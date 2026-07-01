import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type Banner = Database['public']['Tables']['banners']['Row'];

export const bannersService = {
  async getBanners(params?: {
    scope?: string;
    country?: string;
    state?: string;
    city?: string;
  }) {
    let query = supabase
      .from('banners')
      .select('*')
      .neq('status', 'deleted');

    query = applyBannerFilters(query, params);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createBanner(banner: Omit<Banner, 'id' | 'created_at'>) {
    const { data, error } = await (supabase.from('banners') as any)
      .insert(banner)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateBanner(id: string, updates: Partial<Omit<Banner, 'id' | 'created_at'>>) {
    const { data, error } = await (supabase.from('banners') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteBanner(id: string) {
    const { error } = await (supabase.from('banners') as any)
      .update({ status: 'deleted' })
      .eq('id', id);

    if (error) throw error;
  }
};

interface FilterParams {
  scope?: string;
  country?: string;
  state?: string;
  city?: string;
}

function shouldApplyFilter(value?: string): boolean {
  return !!value && value !== 'all';
}

function applyCountryFilter(query: any, scope: string, country?: string) {
  const isCountryScope = ['national', 'state', 'city'].includes(scope);
  if (isCountryScope && shouldApplyFilter(country)) {
    return query.eq('country', country);
  }
  return query;
}

function applyStateFilter(query: any, scope: string, state?: string) {
  const isStateScope = ['state', 'city'].includes(scope);
  if (isStateScope && shouldApplyFilter(state)) {
    return query.eq('state', state);
  }
  return query;
}

function applyCityFilter(query: any, scope: string, city?: string) {
  const isCityScope = scope === 'city';
  if (isCityScope && city) {
    return query.ilike('city', `%${city}%`);
  }
  return query;
}

function applyBannerFilters(query: any, params?: FilterParams) {
  if (!params || !params.scope || params.scope === 'all') {
    return query;
  }

  const { scope, country, state, city } = params;
  let q = query.eq('scope', scope);

  q = applyCountryFilter(q, scope, country);
  q = applyStateFilter(q, scope, state);
  q = applyCityFilter(q, scope, city);

  return q;
}
