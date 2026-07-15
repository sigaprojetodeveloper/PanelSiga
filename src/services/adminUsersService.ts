import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type AdminUser = Database['public']['Tables']['admin_users']['Row'];

export const adminUsersService = {
  async getAdminUsers(params: {
    page: number;
    pageSize: number;
    search?: string;
  }) {
    const { page, pageSize, search } = params;
    const startRange = (page - 1) * pageSize;
    const endRange = startRange + pageSize - 1;

    let query = (supabase.from('admin_users') as any)
      .select('*', { count: 'exact' });

    if (search) {
      query = query.ilike('username', `%${search}%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(startRange, endRange);

    const { data, error, count } = await query;

    if (error) throw error;
    return { data: (data as AdminUser[]) || [], totalCount: count || 0 };
  },

  async createAdminUser(payload: Omit<AdminUser, 'id' | 'created_at'>) {
    const { data, error } = await (supabase.from('admin_users') as any)
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data as AdminUser;
  },

  async updateAdminUserPassword(id: string, password: string) {
    const { data, error } = await (supabase.from('admin_users') as any)
      .update({ password })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AdminUser;
  },

  async deleteAdminUser(id: string) {
    const { error } = await (supabase.from('admin_users') as any)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};
