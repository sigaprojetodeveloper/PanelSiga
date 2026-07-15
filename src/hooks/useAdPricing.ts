import { useState, useEffect, useCallback } from 'react';
import { adPricingService } from '../services/adPricingService';
import { useToast } from './useToast';

export function useAdPricing() {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorState, setErrorState] = useState<Error | null>(null);

  const [prices, setPrices] = useState({
    banner: { global: 0, national: 0, state: 0, city: 0 },
    story: { global: 0, national: 0, state: 0, city: 0 },
    contract: { global: 0 }
  });

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    setErrorState(null);
    try {
      const data = await adPricingService.getPricingSettings();
      const newPrices = {
        banner: { global: 0, national: 0, state: 0, city: 0 },
        story: { global: 0, national: 0, state: 0, city: 0 },
        contract: { global: 0 }
      };
      data.forEach((item: any) => {
        if (item.ad_type === 'banner' || item.ad_type === 'story') {
          const type = item.ad_type as 'banner' | 'story';
          const scope = item.scope as 'global' | 'national' | 'state' | 'city';
          newPrices[type][scope] = Number(item.price_per_day);
        } else if (item.ad_type === 'contract') {
          newPrices.contract.global = Number(item.price_per_day);
        }
      });
      setPrices(newPrices);
    } catch (err: any) {
      setErrorState(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  const updatePrice = (type: 'banner' | 'story' | 'contract', scope: 'global' | 'national' | 'state' | 'city', value: number) => {
    setPrices((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [scope]: value
      }
    }));
  };

  const savePrices = async () => {
    setSaving(true);
    try {
      const payload = [
        { ad_type: 'banner', scope: 'global', price_per_day: prices.banner.global },
        { ad_type: 'banner', scope: 'national', price_per_day: prices.banner.national },
        { ad_type: 'banner', scope: 'state', price_per_day: prices.banner.state },
        { ad_type: 'banner', scope: 'city', price_per_day: prices.banner.city },
        { ad_type: 'story', scope: 'global', price_per_day: prices.story.global },
        { ad_type: 'story', scope: 'national', price_per_day: prices.story.national },
        { ad_type: 'story', scope: 'state', price_per_day: prices.story.state },
        { ad_type: 'story', scope: 'city', price_per_day: prices.story.city },
        { ad_type: 'contract', scope: 'global', price_per_day: prices.contract.global }
      ] as any[];

      await adPricingService.upsertPricingSettings(payload);
      success('Preços atualizados com sucesso!');
      await fetchPrices();
    } catch (err: any) {
      error('Falha ao salvar preços: ' + err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return {
    prices,
    loading,
    saving,
    error: errorState,
    updatePrice,
    savePrices,
    refetch: fetchPrices
  };
}
