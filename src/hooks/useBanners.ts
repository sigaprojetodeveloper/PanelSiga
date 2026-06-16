import { useState, useEffect, useCallback } from 'react';
import { bannersService } from '../services/bannersService';
import type { Database } from '../types/database.types';

type Banner = Database['public']['Tables']['banners']['Row'];

export function useBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bannersService.getBanners();
      setBanners(data);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const createBanner = async (banner: Omit<Banner, 'id' | 'created_at'>) => {
    try {
      const newBanner = await bannersService.createBanner(banner);
      setBanners((prev) => [newBanner, ...prev]);
      return newBanner;
    } catch (err: any) {
      alert('Falha ao criar banner: ' + err.message);
      throw err;
    }
  };

  const updateBanner = async (id: string, updates: Partial<Omit<Banner, 'id' | 'created_at'>>) => {
    try {
      const updated = await bannersService.updateBanner(id, updates);
      setBanners((prev) => prev.map((b) => (b.id === id ? updated : b)));
      return updated;
    } catch (err: any) {
      alert('Falha ao atualizar banner: ' + err.message);
      throw err;
    }
  };

  const deleteBanner = async (id: string) => {
    if (!confirm('Deseja realmente excluir este banner?')) return;
    try {
      await bannersService.deleteBanner(id);
      setBanners((prev) => prev.filter((b) => b.id !== id));
    } catch (err: any) {
      alert('Falha ao deletar banner: ' + err.message);
    }
  };

  return {
    banners,
    loading,
    error,
    createBanner,
    updateBanner,
    deleteBanner,
    refetch: fetchBanners,
  };
}
