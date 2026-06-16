import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type Banner = Database['public']['Tables']['banners']['Row'];

export const bannersService = {
  async getBanners() {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('created_at', { ascending: false });

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
