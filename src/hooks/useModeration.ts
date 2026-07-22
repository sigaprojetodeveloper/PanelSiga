import { useState, useEffect, useCallback } from 'react';
import { moderationService } from '../services/moderationService';
import { useToast } from './useToast';

export function useModeration() {
  const { success, error } = useToast();
  const [pendingBanners, setPendingBanners] = useState<any[]>([]);
  const [pendingStories, setPendingStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // holds id of item currently being processed
  const [errorState, setErrorState] = useState<Error | null>(null);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'accepted' | 'rejected'>('pending');
  const [pendingCount, setPendingCount] = useState(0);

  const fetchPendingItems = useCallback(async (filter: 'pending' | 'accepted' | 'rejected' = 'pending') => {
    setLoading(true);
    setErrorState(null);
    try {
      const [banners, stories, allPendingBanners, allPendingStories] = await Promise.all([
        moderationService.getPendingBanners(filter),
        moderationService.getPendingStories(filter),
        filter === 'pending' ? Promise.resolve([]) : moderationService.getPendingBanners('pending'),
        filter === 'pending' ? Promise.resolve([]) : moderationService.getPendingStories('pending'),
      ]);
      setPendingBanners(banners);
      setPendingStories(stories);
      if (filter === 'pending') {
        setPendingCount(banners.length + stories.length);
      } else {
        setPendingCount(allPendingBanners.length + allPendingStories.length);
      }
    } catch (err: any) {
      setErrorState(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingItems(statusFilter);
  }, [fetchPendingItems, statusFilter]);

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
      success(`Solicitação de ${type === 'banner' ? 'banner' : 'canal'} aprovada com sucesso!`);
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
      success(`Solicitação de ${type === 'banner' ? 'banner' : 'canal'} recusada com sucesso!`);
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
    pendingCount
  };
}
