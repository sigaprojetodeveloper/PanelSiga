import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type AdPricing = Database['public']['Tables']['ad_pricing']['Row'];

export const adPricingService = {
  async getPricingSettings() {
    const { data, error } = await supabase
      .from('ad_pricing')
      .select('*')
      .order('ad_type', { ascending: true })
      .order('scope', { ascending: true });

    if (error) {
      console.error('[adPricingService] Erro ao buscar preços:', error);
      throw error;
    }
    return data || [];
  },

  async upsertPricingSettings(settings: Omit<AdPricing, 'id' | 'created_at' | 'updated_at'>[]) {
    const { data, error } = await (supabase.from('ad_pricing') as any)
      .upsert(settings, { onConflict: 'ad_type,scope' })
      .select();

    if (error) {
      console.error('[adPricingService] Erro ao atualizar preços:', error);
      throw error;
    }
    return data;
  }
};
