import { supabase } from '../lib/supabase';
import type { Database, VerificationLevelEnum } from '../types/database.types';

type User = Database['public']['Tables']['users']['Row'];

export const usersService = {
  async getUsers(params: {
    page: number;
    pageSize: number;
    search?: string;
    role?: 'cliente' | 'profissional';
    status?: User['status'];
    verificationLevel?: VerificationLevelEnum;
    isSuspended?: boolean;
  }) {
    const { page, pageSize, search, role, status, verificationLevel, isSuspended } = params;
    const startRange = (page - 1) * pageSize;
    const endRange = startRange + pageSize - 1;

    let query = supabase
      .from('users')
      .select('*, user_profiles(*)', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }
    if (verificationLevel) {
      query = query.eq('verification_level', verificationLevel);
    }
    if (isSuspended !== undefined && isSuspended !== null) {
      query = query.eq('is_suspended', isSuspended);
    }
    if (role) {
      query = query.contains('role_flags', [role]);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,document_hash.ilike.%${search}%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(startRange, endRange);

    const { data, error, count } = await query;

    if (error) throw error;

    const formattedData = (data || []).map((u: any) => {
      const p = Array.isArray(u.profiles) ? u.profiles[0] : u.profiles;
      const up = Array.isArray(u.user_profiles) ? u.user_profiles[0] : u.user_profiles;
      return {
        ...u,
        verification_level: u.verification_level || p?.verification_level || up?.verification_level || 'none',
        is_suspended: u.is_suspended ?? p?.is_suspended ?? up?.is_suspended ?? false,
        verification_updated_at: u.verification_updated_at || p?.verification_updated_at || up?.verification_updated_at || null,
      };
    });

    return { data: formattedData, totalCount: count || 0 };
  },

  async updateUserVerification(userId: string, verificationLevel?: VerificationLevelEnum, isSuspended?: boolean) {
    const response = await fetch('/api/admin/users/update-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, verificationLevel, isSuspended }),
    });

    const resData = await response.json();
    if (!response.ok || resData.error) {
      throw new Error(resData.error || 'Falha ao atualizar dados de verificação do usuário.');
    }
    return resData.data;
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
    const p = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
    const up = Array.isArray(data.user_profiles) ? data.user_profiles[0] : data.user_profiles;

    data.verification_level = data.verification_level || p?.verification_level || up?.verification_level || 'none';
    data.is_suspended = data.is_suspended ?? p?.is_suspended ?? up?.is_suspended ?? false;
    data.verification_updated_at = data.verification_updated_at || p?.verification_updated_at || up?.verification_updated_at || null;

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
