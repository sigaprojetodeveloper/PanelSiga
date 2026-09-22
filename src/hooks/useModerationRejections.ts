/* eslint-disable complexity */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { moderationService } from '../services/moderationService';
import { supabase } from '../lib/supabase';

export interface RejectedItem {
  id: string;
  _type: 'banner' | 'story';
  title?: string | null;
  subtitle?: string | null;
  link_url?: string | null;
  link_label?: string | null;
  image_url?: string;
  media_url?: string;
  media_type?: 'image' | 'video';
  scope?: 'global' | 'national' | 'state' | 'city' | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  rejected_at?: string;
  users?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  story_channels?: {
    id: string;
    name: string;
    avatar_url?: string | null;
    user_id?: string | null;
    scope?: 'global' | 'national' | 'state' | 'city';
    country?: string | null;
    state?: string | null;
    city?: string | null;
    users?: {
      name?: string | null;
      email?: string | null;
      phone?: string | null;
    } | null;
  } | null;
}

export type RejectionCategoryFilter = 'all' | 'image' | 'text' | 'link' | 'safety' | 'other';

export function categorizeRejectionReason(reason?: string | null): string {
  if (!reason || !reason.trim()) return 'Não informado';
  const lower = reason.toLowerCase();
  if (lower.includes('qualidade') || lower.includes('imagem')) return 'Imagem de Baixa Qualidade / Inapropriada';
  if (lower.includes('texto') || lower.includes('ofensivo') || lower.includes('erro') || lower.includes('linguagem')) return 'Texto Inapropriado ou com Erros';
  if (lower.includes('link') || lower.includes('url')) return 'Link Inválido ou Suspeito';
  if (lower.includes('diretriz') || lower.includes('segurança') || lower.includes('rekognition') || lower.includes('comprehend') || lower.includes('nudez') || lower.includes('violência')) {
    return 'Violação de Segurança / Diretrizes';
  }
  return 'Outro Motivo';
}

export function useModerationRejections() {
  const [allItems, setAllItems] = useState<RejectedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<'all' | 'banner' | 'story'>('all');
  const [categoryFilter, setCategoryFilter] = useState<RejectionCategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchRejectedItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await moderationService.getRejectedItems();
      setAllItems(items as RejectedItem[]);
    } catch (err: any) {
      console.error('[useModerationRejections] Erro ao carregar itens rejeitados:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRejectedItems();
  }, [fetchRejectedItems]);

  // Realtime subscription for rejections
  useEffect(() => {
    const channel = supabase
      .channel('moderation_rejections_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'banners' },
        (payload) => {
          if (
            (payload.new && (payload.new as any).status === 'rejected') ||
            (payload.old && (payload.old as any).status === 'rejected')
          ) {
            fetchRejectedItems();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'story_items' },
        (payload) => {
          if (
            (payload.new && (payload.new as any).status === 'rejected') ||
            (payload.old && (payload.old as any).status === 'rejected')
          ) {
            fetchRejectedItems();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRejectedItems]);

  // KPIs
  const stats = useMemo(() => {
    const total = allItems.length;
    const bannersCount = allItems.filter((i) => i._type === 'banner').length;
    const storiesCount = allItems.filter((i) => i._type === 'story').length;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCount = allItems.filter((i) => {
      const d = new Date(i.rejected_at || i.created_at);
      return d >= sevenDaysAgo;
    }).length;

    // Reason frequency
    const reasonCounts: Record<string, number> = {};
    allItems.forEach((i) => {
      const cat = categorizeRejectionReason(i.rejection_reason);
      reasonCounts[cat] = (reasonCounts[cat] || 0) + 1;
    });

    let topReason = 'Nenhum';
    let topReasonCount = 0;
    Object.entries(reasonCounts).forEach(([cat, count]) => {
      if (count > topReasonCount) {
        topReasonCount = count;
        topReason = cat;
      }
    });

    return {
      total,
      bannersCount,
      storiesCount,
      recentCount,
      topReason,
      topReasonCount,
      reasonCounts,
    };
  }, [allItems]);

  // Filtering
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      // Type filter
      if (typeFilter !== 'all' && item._type !== typeFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'all') {
        const cat = categorizeRejectionReason(item.rejection_reason);
        if (categoryFilter === 'image' && !cat.includes('Imagem')) return false;
        if (categoryFilter === 'text' && !cat.includes('Texto')) return false;
        if (categoryFilter === 'link' && !cat.includes('Link')) return false;
        if (categoryFilter === 'safety' && !cat.includes('Segurança')) return false;
        if (categoryFilter === 'other' && !cat.includes('Outro')) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const title = (item.title || item.story_channels?.name || '').toLowerCase();
        const requesterName = (
          item.users?.name ||
          item.story_channels?.users?.name ||
          ''
        ).toLowerCase();
        const requesterEmail = (
          item.users?.email ||
          item.story_channels?.users?.email ||
          ''
        ).toLowerCase();
        const reason = (item.rejection_reason || '').toLowerCase();

        const matches =
          title.includes(query) ||
          requesterName.includes(query) ||
          requesterEmail.includes(query) ||
          reason.includes(query);

        if (!matches) return false;
      }

      return true;
    });
  }, [allItems, typeFilter, categoryFilter, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, categoryFilter, searchQuery]);

  return {
    items: allItems,
    filteredItems,
    paginatedItems,
    loading,
    error,
    stats,
    typeFilter,
    setTypeFilter,
    categoryFilter,
    setCategoryFilter,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,
    refetch: fetchRejectedItems,
  };
}
