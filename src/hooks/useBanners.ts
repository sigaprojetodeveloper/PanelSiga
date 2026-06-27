import { useState, useEffect, useCallback } from 'react';
import { bannersService } from '../services/bannersService';
import type { Database } from '../types/database.types';
import { useToast } from './useToast';

type Banner = Database['public']['Tables']['banners']['Row'];

export function useBanners() {
  const { success, error } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState<Error | null>(null);

  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('');

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    setErrorState(null);
    try {
      const data = await bannersService.getBanners({
        scope: scopeFilter,
        country: countryFilter,
        state: stateFilter,
        city: cityFilter,
      });
      setBanners(data);
    } catch (err: any) {
      setErrorState(err);
    } finally {
      setLoading(false);
    }
  }, [scopeFilter, countryFilter, stateFilter, cityFilter]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const createBanner = async (banner: Omit<Banner, 'id' | 'created_at'>) => {
    try {
      const newBanner = await bannersService.createBanner(banner);
      setBanners((prev) => [newBanner, ...prev]);
      return newBanner;
    } catch (err: any) {
      error('Falha ao criar banner: ' + err.message);
      throw err;
    }
  };

  const updateBanner = async (id: string, updates: Partial<Omit<Banner, 'id' | 'created_at'>>) => {
    try {
      const updated = await bannersService.updateBanner(id, updates);
      setBanners((prev) => prev.map((b) => (b.id === id ? updated : b)));
      return updated;
    } catch (err: any) {
      error('Falha ao atualizar banner: ' + err.message);
      throw err;
    }
  };

  const deleteBanner = async (id: string) => {
    if (!confirm('Deseja realmente excluir este banner?')) return;
    try {
      await bannersService.deleteBanner(id);
      setBanners((prev) => prev.filter((b) => b.id !== id));
      success('Banner excluído com sucesso!');
    } catch (err: any) {
      error('Falha ao deletar banner: ' + err.message);
    }
  };

  return {
    banners,
    loading,
    error: errorState,
    scopeFilter,
    setScopeFilter,
    countryFilter,
    setCountryFilter,
    stateFilter,
    setStateFilter,
    cityFilter,
    setCityFilter,
    createBanner,
    updateBanner,
    deleteBanner,
    refetch: fetchBanners,
  };
}
