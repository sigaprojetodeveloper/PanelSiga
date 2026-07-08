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
      // search in name or email or phone or CPF/CNPJ
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,document_hash.ilike.%${search}%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(startRange, endRange);

    const { data, error, count } = await query;

    if (error) throw error;
    return { data: data || [], totalCount: count || 0 };
  },

  // eslint-disable-next-line complexity
  async getUserDetails(userId: string) {
    const [detailsResult, createdWorksResult, assignedWorksResult] = await Promise.all([
      supabase
        .from('users')
        .select(`
          *,
          user_profiles (*),
          addresses (*),
          professional_coverages (*),
          user_specialties (
            specialties:view_specialties_translated (id, name, locale)
          ),
          portfolio_works (
            id,
            title,
            description,
            portfolio_media (url, media_type)
          )
        `)
        .eq('id', userId)
        .single(),
      supabase
        .from('works')
        .select('id, title, status, city, state, created_at')
        .eq('client_id', userId),
      supabase
        .from('works')
        .select('id, title, status, city, state, created_at')
        .eq('assigned_professional_id', userId)
    ]);

    if (detailsResult.error) throw detailsResult.error;

    const data = detailsResult.data as any;

    // Auto-upsert default profile if it's missing or empty
    if (data && (!data.user_profiles || (Array.isArray(data.user_profiles) && data.user_profiles.length === 0))) {
      const { data: newProfile, error: profileErr } = await (supabase
        .from('user_profiles') as any)
        .upsert({ user_id: userId, is_available: true }, { onConflict: 'user_id' })
        .select()
        .single();
      if (!profileErr && newProfile) {
        data.user_profiles = newProfile;
      }
    }

    if (data && Array.isArray(data.user_specialties)) {
      data.user_specialties = data.user_specialties.filter((us: any) => {
        const spec = Array.isArray(us.specialties) ? us.specialties[0] : us.specialties;
        return spec?.locale === 'pt';
      });
    }

    return {
      ...(data as any),
      created_works: createdWorksResult.data || [],
      assigned_works: assignedWorksResult.data || []
    };
  },

  async updateUserStatus(userId: string, status: User['status'], blockReason?: string | null) {
    const updatePayload: any = { status, updated_at: new Date().toISOString() };
    if (status === 'blocked') {
      updatePayload.block_reason = blockReason || null;
    } else {
      updatePayload.block_reason = null;
    }

    const { data, error } = await (supabase.from('users') as any)
      .update(updatePayload)
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
