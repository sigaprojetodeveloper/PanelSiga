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

  const fetchPendingItems = useCallback(async () => {
    setLoading(true);
    setErrorState(null);
    try {
      const [banners, stories] = await Promise.all([
        moderationService.getPendingBanners(),
        moderationService.getPendingStories()
      ]);
      setPendingBanners(banners);
      setPendingStories(stories);
    } catch (err: any) {
      setErrorState(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingItems();
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
      success(`Solicitação de ${type === 'banner' ? 'banner' : 'canal'} aprovada com sucesso!`);
      await fetchPendingItems();
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
      await fetchPendingItems();
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
    refetch: fetchPendingItems
  };
}
