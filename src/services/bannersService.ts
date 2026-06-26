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
      .select('*');

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
    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

function applyBannerFilters(
  query: any,
  params?: {
    scope?: string;
    country?: string;
    state?: string;
    city?: string;
  }
) {
  if (!params) return query;

  let q = query;
  const { scope, country, state, city } = params;

  if (scope && scope !== 'all') {
    q = q.eq('scope', scope);
  }
  if (country && country !== 'all') {
    q = q.eq('country', country);
  }
  if (state && state !== 'all') {
    q = q.eq('state', state);
  }
  if (city) {
    q = q.ilike('city', `%${city}%`);
  }

  return q;
}
