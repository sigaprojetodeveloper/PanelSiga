import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type User = Database['public']['Tables']['users']['Row'];

export const usersService = {
  async getUsers(params: {
    page: number;
    pageSize: number;
    search?: string;
    role?: 'cliente' | 'profissional';
    status?: User['status'];
  }) {
    const { page, pageSize, search, role, status } = params;
    const startRange = (page - 1) * pageSize;
    const endRange = startRange + pageSize - 1;

    let query = supabase
      .from('users')
      .select('*, user_profiles(*)', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }
    if (role) {
      // In PostgreSQL, array containing is checked using cs.
      // But since supabase-js does not have direct array operations in simple helper filters easily,
      // we can use .contains('role_flags', [role]) or raw filter.
      // Let's use contains:
      query = query.contains('role_flags', [role]);
    }
    if (search) {
      // search in name or email or phone
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(startRange, endRange);

    const { data, error, count } = await query;

    if (error) throw error;
    return { data: data || [], totalCount: count || 0 };
  },

  async getUserDetails(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        user_profiles (*),
        addresses (*),
        professional_coverages (*)
      `)
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateUserStatus(userId: string, status: User['status']) {
    const { data, error } = await (supabase.from('users') as any)
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateUserProfile(userId: string, updates: {
    name?: string;
    email?: string;
    phone?: string;
    bio?: string;
    avatar_url?: string | null;
  }) {
    // Splits updates into user and profile tables
    const userUpdates: any = {};
    if (updates.name !== undefined) userUpdates.name = updates.name;
    if (updates.email !== undefined) userUpdates.email = updates.email;
    if (updates.phone !== undefined) userUpdates.phone = updates.phone;

    if (Object.keys(userUpdates).length > 0) {
      const { error } = await (supabase.from('users') as any)
        .update(userUpdates)
        .eq('id', userId);
      if (error) throw error;
    }

    const profileUpdates: any = {};
    if (updates.bio !== undefined) profileUpdates.bio = updates.bio;
    if (updates.avatar_url !== undefined) profileUpdates.avatar_url = updates.avatar_url;

    if (Object.keys(profileUpdates).length > 0) {
      const { error } = await (supabase.from('user_profiles') as any)
        .update(profileUpdates)
        .eq('user_id', userId);
      if (error) throw error;
    }
  }
};
