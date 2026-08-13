/* eslint-disable complexity */
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

export type CityPricing = Database['public']['Tables']['city_pricings']['Row'];
export type CityVolumeDiscount = Database['public']['Tables']['city_volume_discounts']['Row'];

export interface UpsertCityPricingInput {
  id?: string;
  is_default: boolean;
  city_name: string;
  state: string;
  price_lite: number;      // Em centavos (ou R$ antes de converter)
  price_premium: number;   // Em centavos
  tax_extra_lite: number;  // Em centavos
  tax_extra_premium: number; // Em centavos
}

export interface UpsertVolumeDiscountInput {
  id?: string;
  min_distinct_cities: number;
  discount_percentage: number;
  is_active: boolean;
}

export const monetizationService = {
  async getMonetizationSettings() {
    const { data: pricings, error: errPricings } = await (supabase.from('city_pricings') as any)
      .select('*')
      .order('city_name', { ascending: true });

    if (errPricings) {
      console.error('[monetizationService] Erro ao buscar tarifas regionais:', errPricings);
      throw errPricings;
    }

    const { data: discounts, error: errDiscounts } = await (supabase.from('city_volume_discounts') as any)
      .select('*')
      .order('min_distinct_cities', { ascending: true });

    if (errDiscounts) {
      console.error('[monetizationService] Erro ao buscar descontos por volume:', errDiscounts);
      throw errDiscounts;
    }

    const pricingsList: CityPricing[] = pricings || [];
    const discountsList: CityVolumeDiscount[] = discounts || [];

    const fallbackRule = pricingsList.find(p => p.is_default || p.city_name === 'DEFAULT');
    const regionalRules = pricingsList.filter(p => !p.is_default && p.city_name !== 'DEFAULT');

    return {
      fallbackRule,
      regionalRules,
      discounts: discountsList
    };
  },

  async upsertCityPricing(pricingData: UpsertCityPricingInput) {
    const isDefault = pricingData.is_default;

    const payload: any = {
      ...(pricingData.id ? { id: pricingData.id } : {}),
      is_default: isDefault,
      city_name: isDefault ? 'DEFAULT' : pricingData.city_name.trim(),
      state: isDefault ? 'ALL' : pricingData.state.trim().toUpperCase(),
      price_lite: Math.round(pricingData.price_lite),
      price_premium: Math.round(pricingData.price_premium),
      tax_extra_lite: Math.round(pricingData.tax_extra_lite),
      tax_extra_premium: Math.round(pricingData.tax_extra_premium),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await (supabase.from('city_pricings') as any)
      .upsert(payload, { onConflict: 'city_name,state' })
      .select()
      .single();

    if (error) {
      console.error('[monetizationService] Erro ao salvar tarifa de cidade:', error);
      throw error;
    }

    return data;
  },

  async deleteCityPricing(id: string) {
    const { error } = await (supabase.from('city_pricings') as any)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[monetizationService] Erro ao excluir tarifa de cidade:', error);
      throw error;
    }
  },

  async upsertVolumeDiscount(discountData: UpsertVolumeDiscountInput) {
    if (discountData.min_distinct_cities < 2) {
      throw new Error('A quantidade mínima de cidades distintas deve ser maior ou igual a 2.');
    }
    if (discountData.discount_percentage <= 0 || discountData.discount_percentage > 100) {
      throw new Error('O percentual de desconto deve ser entre 0% e 100%.');
    }

    const payload: any = {
      ...(discountData.id ? { id: discountData.id } : {}),
      min_distinct_cities: discountData.min_distinct_cities,
      discount_percentage: discountData.discount_percentage,
      is_active: discountData.is_active,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await (supabase.from('city_volume_discounts') as any)
      .upsert(payload)
      .select()
      .single();

    if (error) {
      console.error('[monetizationService] Erro ao salvar regra de desconto:', error);
      throw error;
    }

    return data;
  },

  async deleteVolumeDiscount(id: string) {
    const { error } = await (supabase.from('city_volume_discounts') as any)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[monetizationService] Erro ao excluir regra de desconto:', error);
      throw error;
    }
  },

  async calculateEnterpriseCheckoutPrice(enterpriseId: string) {
    // 1. Fetch enterprise details and addresses
    const { data: enterprise } = await (supabase.from('enterprises') as any)
      .select('tier')
      .eq('id', enterpriseId)
      .single();

    const { data: addresses } = await (supabase.from('enterprise_addresses') as any)
      .select('city, state')
      .eq('enterprise_id', enterpriseId);

    if (!addresses || addresses.length === 0) {
      throw new Error('O estabelecimento não possui endereços vinculados.');
    }

    // 2. Group addresses by city
    const cityGroups = new Map<string, { city: string; state: string; count: number }>();
    for (const addr of addresses) {
      const key = `${addr.city.toLowerCase()}_${addr.state.toLowerCase()}`;
      if (!cityGroups.has(key)) {
        cityGroups.set(key, { city: addr.city, state: addr.state, count: 0 });
      }
      cityGroups.get(key)!.count++;
    }

    let grossTotalCentavos = 0;
    const isPremium = enterprise?.tier === 'PREMIUM';

    // 3. Fetch pricing rules
    const { data: allPricings } = await (supabase.from('city_pricings') as any).select('*');
    const pricingsList: CityPricing[] = allPricings || [];
    const defaultPricing = pricingsList.find(p => p.is_default || p.city_name === 'DEFAULT') || {
      price_lite: 9900,
      price_premium: 19900,
      tax_extra_lite: 2900,
      tax_extra_premium: 4900
    };

    const breakdownByCity: Array<{
      city: string;
      state: string;
      count: number;
      basePrice: number;
      extraTax: number;
      subtotal: number;
    }> = [];

    Array.from(cityGroups.values()).forEach(group => {
      const rule = pricingsList.find(
        p => !p.is_default && p.city_name.toLowerCase() === group.city.toLowerCase() && p.state.toLowerCase() === group.state.toLowerCase()
      ) || defaultPricing;

      const basePrice = isPremium ? rule.price_premium : rule.price_lite;
      const extraPrice = isPremium ? rule.tax_extra_premium : rule.tax_extra_lite;

      const citySubtotal = basePrice + (group.count - 1) * extraPrice;
      grossTotalCentavos += citySubtotal;

      breakdownByCity.push({
        city: group.city,
        state: group.state,
        count: group.count,
        basePrice,
        extraTax: extraPrice,
        subtotal: citySubtotal
      });
    });

    // 4. Volume Discount Calculation
    const distinctCitiesCount = cityGroups.size;
    const { data: discounts } = await (supabase.from('city_volume_discounts') as any)
      .select('*')
      .eq('is_active', true)
      .lte('min_distinct_cities', distinctCitiesCount)
      .order('min_distinct_cities', { ascending: false });

    let discountPercentage = 0;
    if (discounts && discounts.length > 0) {
      discountPercentage = Number(discounts[0].discount_percentage);
    }

    const discountAmountCentavos = Math.round(grossTotalCentavos * (discountPercentage / 100));
    const finalTotalCentavos = grossTotalCentavos - discountAmountCentavos;

    return {
      grossTotalCentavos,
      discountPercentage,
      discountAmountCentavos,
      finalTotalCentavos,
      distinctCitiesCount,
      breakdownByCity
    };
  }
};
