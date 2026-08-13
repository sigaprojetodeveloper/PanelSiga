import { useState, useEffect, useCallback } from 'react';
import {
  monetizationService,
  CityPricing,
  CityVolumeDiscount,
  UpsertCityPricingInput,
  UpsertVolumeDiscountInput
} from '../services/monetizationService';
import { useToast } from './useToast';

export function useMonetizationSettings() {
  const { success, error } = useToast();
  const [fallbackRule, setFallbackRule] = useState<CityPricing | null>(null);
  const [regionalRules, setRegionalRules] = useState<CityPricing[]>([]);
  const [discounts, setDiscounts] = useState<CityVolumeDiscount[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorState, setErrorState] = useState<Error | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setErrorState(null);
    try {
      const { fallbackRule: fallback, regionalRules: regionals, discounts: discList } = await monetizationService.getMonetizationSettings();
      setFallbackRule(fallback || null);
      setRegionalRules(regionals || []);
      setDiscounts(discList || []);
    } catch (err: any) {
      console.error('[useMonetizationSettings] Erro ao carregar configurações:', err);
      setErrorState(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveCityPricing = async (input: UpsertCityPricingInput) => {
    setSaving(true);
    try {
      await monetizationService.upsertCityPricing(input);
      success(input.is_default ? 'Regra de Preço Padrão salva com sucesso!' : 'Tarifa regional salva com sucesso!');
      await fetchSettings();
      return true;
    } catch (err: any) {
      error('Falha ao salvar tarifa: ' + err.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deleteCityPricing = async (id: string) => {
    try {
      await monetizationService.deleteCityPricing(id);
      success('Tarifa regional removida com sucesso!');
      await fetchSettings();
    } catch (err: any) {
      error('Falha ao remover tarifa: ' + err.message);
    }
  };

  const saveVolumeDiscount = async (input: UpsertVolumeDiscountInput) => {
    setSaving(true);
    try {
      await monetizationService.upsertVolumeDiscount(input);
      success('Regra de desconto salva com sucesso!');
      await fetchSettings();
      return true;
    } catch (err: any) {
      error('Falha ao salvar regra de desconto: ' + err.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deleteVolumeDiscount = async (id: string) => {
    try {
      await monetizationService.deleteVolumeDiscount(id);
      success('Regra de desconto removida!');
      await fetchSettings();
    } catch (err: any) {
      error('Falha ao remover regra de desconto: ' + err.message);
    }
  };

  return {
    fallbackRule,
    regionalRules,
    discounts,
    loading,
    saving,
    error: errorState,
    saveCityPricing,
    deleteCityPricing,
    saveVolumeDiscount,
    deleteVolumeDiscount,
    refetch: fetchSettings
  };
}
