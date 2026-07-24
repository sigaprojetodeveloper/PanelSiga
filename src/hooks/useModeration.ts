import { useState, useEffect, useCallback, useRef } from 'react';
import { moderationService } from '../services/moderationService';
import { useToast } from './useToast';
import { supabase } from '../lib/supabase';

interface UseModerationOptions {
  onNewRequest?: (req: { type: 'banner' | 'story'; item: any }) => void;
}

export function useModeration(options: UseModerationOptions = {}) {
  const { success, error } = useToast();
  const [pendingBanners, setPendingBanners] = useState<any[]>([]);
  const [pendingStories, setPendingStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // holds id of item currently being processed
  const [errorState, setErrorState] = useState<Error | null>(null);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'accepted' | 'rejected'>('pending');
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingBannersCount, setPendingBannersCount] = useState(0);
  const [pendingStoriesCount, setPendingStoriesCount] = useState(0);

  const statusFilterRef = useRef(statusFilter);
  useEffect(() => {
    statusFilterRef.current = statusFilter;
  }, [statusFilter]);

  const onNewRequestRef = useRef(options.onNewRequest);
  useEffect(() => {
    onNewRequestRef.current = options.onNewRequest;
  }, [options.onNewRequest]);

  const fetchPendingItems = useCallback(async (filter: 'pending' | 'accepted' | 'rejected' = 'pending') => {
    setLoading(true);
    setErrorState(null);
    try {
      const [banners, stories] = await Promise.all([
        moderationService.getPendingBanners(filter),
        moderationService.getPendingStories(filter),
      ]);

      let pBanners = banners;
      let pStories = stories;

      if (filter !== 'pending') {
        [pBanners, pStories] = await Promise.all([
          moderationService.getPendingBanners('pending'),
          moderationService.getPendingStories('pending'),
        ]);
      }

      setPendingBanners(banners);
      setPendingStories(stories);
      setPendingBannersCount(pBanners.length);
      setPendingStoriesCount(pStories.length);
      setPendingCount(pBanners.length + pStories.length);
    } catch (err: any) {
      setErrorState(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingItems(statusFilter);
  }, [fetchPendingItems, statusFilter]);

  // Supabase Realtime Listener for Banners & Story Items
  useEffect(() => {
    const channel = supabase
      .channel('moderation_realtime_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'banners' },
        async (payload) => {
          await fetchPendingItems(statusFilterRef.current);
          if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new && payload.new.status === 'pending') {
            const isNewPending = payload.eventType === 'INSERT' || (payload.old && payload.old.status !== 'pending');
            if (isNewPending) {
              try {
                const fullBanners = await moderationService.getPendingBanners('pending');
                const fullItem = fullBanners.find((b: any) => b.id === payload.new.id) || payload.new;
                onNewRequestRef.current?.({ type: 'banner', item: fullItem });
              } catch (e) {
                onNewRequestRef.current?.({ type: 'banner', item: payload.new });
              }
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'story_items' },
        async (payload) => {
          await fetchPendingItems(statusFilterRef.current);
          if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new && payload.new.status === 'pending') {
            const isNewPending = payload.eventType === 'INSERT' || (payload.old && payload.old.status !== 'pending');
            if (isNewPending) {
              try {
                const fullStories = await moderationService.getPendingStories('pending');
                const fullItem = fullStories.find((s: any) => s.id === payload.new.id) || payload.new;
                onNewRequestRef.current?.({ type: 'story', item: fullItem });
              } catch (e) {
                onNewRequestRef.current?.({ type: 'story', item: payload.new });
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPendingItems]);

  const acceptRequest = async (params: {
    type: 'banner' | 'story';
    id: string;
    userId: string;
    adName: string;
    totalPrice?: number;
  }) => {
    const { type, id } = params;
    setActionLoading(id);
    try {
      await moderationService.acceptRequest(params);
      success(`Solicitação de ${type === 'banner' ? 'banner' : 'story'} aprovada com sucesso!`);
      await fetchPendingItems(statusFilter);
    } catch (err: any) {
      error(`Erro ao aprovar solicitação: ${err.message}`);
      throw err;
    } finally {
      setActionLoading(null);
    }
  };

  const rejectRequest = async (params: {
    type: 'banner' | 'story';
    id: string;
    userId: string;
    adName: string;
    reason: string;
  }) => {
    const { type, id } = params;
    setActionLoading(id);
    try {
      await moderationService.rejectRequest(params);
      success(`Solicitação de ${type === 'banner' ? 'banner' : 'story'} recusada com sucesso!`);
      await fetchPendingItems(statusFilter);
    } catch (err: any) {
      error(`Erro ao recusar solicitação: ${err.message}`);
      throw err;
    } finally {
      setActionLoading(null);
    }
  };

  return {
    pendingBanners,
    pendingStories,
    loading,
    actionLoading,
    error: errorState,
    acceptRequest,
    rejectRequest,
    refetch: () => fetchPendingItems(statusFilter),
    statusFilter,
    setStatusFilter,
    pendingCount,
    pendingBannersCount,
    pendingStoriesCount
  };
}

