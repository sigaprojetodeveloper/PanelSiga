/* eslint-disable complexity */
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';
import { notificationsService } from './notificationsService';

export type Enterprise = Database['public']['Tables']['enterprises']['Row'];
export type EnterpriseAddress = Database['public']['Tables']['enterprise_addresses']['Row'];
export type EnterpriseSubscription = Database['public']['Tables']['enterprise_subscriptions']['Row'];

export interface GetAdminEnterprisesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string | null;
  tier?: string | null;
  state?: string | null;
  city?: string | null;
}

export interface EnterpriseWithDetails extends Enterprise {
  owner_email?: string | null;
  owner_name?: string | null;
  owner_avatar_url?: string | null;
  owner_verification_level?: string | null;
  owner_is_suspended?: boolean | null;
  owner_phone?: string | null;
  enterprise_addresses?: EnterpriseAddress[];
  enterprise_subscriptions?: EnterpriseSubscription[];
}

export const enterprisesService = {
  async getAdminEnterprises({
    page = 1,
    pageSize = 10,
    search = '',
    status = null,
    tier = null,
    state = null,
    city = null
  }: GetAdminEnterprisesParams) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = (supabase.from('enterprises') as any)
      .select(`
        *,
        enterprise_addresses (*),
        enterprise_subscriptions (
          id,
          enterprise_id,
          amount_paid,
          status,
          starts_at,
          expires_at,
          created_at
        )
      `, { count: 'exact' });

    if (search) {
      const cleanSearch = search.trim();
      query = query.or(`nome_fantasia.ilike.%${cleanSearch}%,razao_social.ilike.%${cleanSearch}%,cnpj.ilike.%${cleanSearch}%`);
    }

    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    if (tier && tier !== 'ALL') {
      query = query.eq('tier', tier);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('[enterprisesService] Erro ao buscar empresas:', error);
      throw error;
    }

    let enterprisesList: EnterpriseWithDetails[] = data || [];

    // Filter by state/city if specified on enterprise_addresses
    if (state || city) {
      enterprisesList = enterprisesList.filter(ent => {
        const addresses = ent.enterprise_addresses || [];
        return addresses.some(addr => {
          const matchState = !state || addr.state?.toUpperCase() === state.toUpperCase();
          const matchCity = !city || addr.city?.toLowerCase() === city.toLowerCase();
          return matchState && matchCity;
        });
      });
    }

    // Try to enrich owner details from profiles and users tables
    const userIds = Array.from(new Set(enterprisesList.map(e => e.user_id).filter(Boolean)));
    if (userIds.length > 0) {
      try {
        const [{ data: usersList }, { data: profilesList }] = await Promise.all([
          (supabase.from('users') as any)
            .select('id, email, name, phone, verification_level, is_suspended, user_profiles(*)')
            .in('id', userIds),
          (supabase.from('profiles') as any)
            .select('id, email, name, avatar_url, verification_level, is_suspended')
            .in('id', userIds)
        ]);

        const userMap = new Map((usersList || []).map((u: any) => [u.id, u]));
        const profileMap = new Map((profilesList || []).map((p: any) => [p.id, p]));

        enterprisesList = enterprisesList.map(ent => {
          const u: any = userMap.get(ent.user_id);
          const p: any = profileMap.get(ent.user_id);
          const up = u?.user_profiles ? (Array.isArray(u.user_profiles) ? u.user_profiles[0] : u.user_profiles) : null;

          return {
            ...ent,
            owner_email: u?.email || p?.email || ent.email_fiscal || null,
            owner_name: u?.name || p?.name || null,
            owner_avatar_url: up?.avatar_url || p?.avatar_url || null,
            owner_verification_level: u?.verification_level || p?.verification_level || up?.verification_level || 'none',
            owner_is_suspended: Boolean(u?.is_suspended || p?.is_suspended || up?.is_suspended),
            owner_phone: u?.phone || up?.whatsapp_phone || ent.phone || ent.whatsapp || null
          };
        });
      } catch (err) {
        console.warn('[enterprisesService] Aviso ao enriquecer perfis dos proprietários:', err);
      }
    }

    return {
      enterprises: enterprisesList,
      totalCount: count || enterprisesList.length
    };
  },

  async blockEnterprise(enterpriseId: string, reason: string) {
    if (!reason || reason.trim().length < 10) {
      throw new Error('O motivo do bloqueio deve conter no mínimo 10 caracteres.');
    }

    const { data, error } = await (supabase.from('enterprises') as any)
      .update({
        status: 'BLOCKED',
        blocked_reason: reason.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', enterpriseId)
      .select()
      .single();

    if (error) {
      console.error('[enterprisesService] Erro ao bloquear empresa:', error);
      throw error;
    }

    // Send in-app notification to the store owner
    if (data.user_id) {
      try {
        await notificationsService.sendNotification({
          userId: data.user_id,
          title: `Seu anúncio "${data.nome_fantasia || 'da loja'}" foi bloqueado`,
          body: `Motivo do bloqueio: ${reason.trim()}`,
          type: 'store_blocked',
          relatedId: enterpriseId
        });
      } catch (notifErr) {
        console.error('[enterprisesService] Erro ao enviar notificação de bloqueio:', notifErr);
      }
    }

    // Attempt to invoke Edge Function notification (with graceful catch)
    try {
      await supabase.functions.invoke('send-enterprise-blocked-email', {
        body: { enterpriseId, reason: reason.trim(), ownerUserId: data.user_id }
      });
    } catch (edgeErr) {
      console.warn('[enterprisesService] Função Edge de e-mail não executada ou indisponível:', edgeErr);
    }

    return data;
  },

  async unblockEnterprise(enterpriseId: string) {
    // Check latest subscription in enterprise_subscriptions
    const { data: subscriptions } = await (supabase.from('enterprise_subscriptions') as any)
      .select('*')
      .eq('enterprise_id', enterpriseId)
      .order('expires_at', { ascending: false });

    const latestSub = subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;

    let restoredStatus: 'ACTIVE' | 'EXPIRED' | 'PENDING_PAYMENT' | 'DRAFT' = 'DRAFT';

    if (latestSub) {
      const expiresAt = new Date(latestSub.expires_at).getTime();
      const now = new Date().getTime();
      if (expiresAt > now) {
        restoredStatus = 'ACTIVE';
      } else {
        restoredStatus = 'EXPIRED';
      }
    }

    const { data, error } = await (supabase.from('enterprises') as any)
      .update({
        status: restoredStatus,
        blocked_reason: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', enterpriseId)
      .select()
      .single();

    if (error) {
      console.error('[enterprisesService] Erro ao desbloquear empresa:', error);
      throw error;
    }

    // Send in-app notification to store owner on unblock
    if (data.user_id) {
      try {
        await notificationsService.sendNotification({
          userId: data.user_id,
          title: `Seu anúncio "${data.nome_fantasia || 'da loja'}" foi reativado`,
          body: `O anúncio da sua empresa foi reativado pelo suporte e está visível novamente.`,
          type: 'store_unblocked',
          relatedId: enterpriseId
        });
      } catch (notifErr) {
        console.error('[enterprisesService] Erro ao enviar notificação de desbloqueio:', notifErr);
      }
    }

    return data;
  },

  async getEnterpriseDetails(enterpriseId: string): Promise<EnterpriseWithDetails> {
    const { data, error } = await (supabase.from('enterprises') as any)
      .select(`
        *,
        enterprise_addresses (*),
        enterprise_subscriptions (*)
      `)
      .eq('id', enterpriseId)
      .single();

    if (error) {
      console.error('[enterprisesService] Erro ao carregar detalhes da empresa:', error);
      throw error;
    }

    let ownerEmail: string | null = null;
    let ownerName: string | null = null;
    let ownerAvatarUrl: string | null = null;
    let ownerVerificationLevel: string | null = 'none';
    let ownerIsSuspended: boolean = false;
    let ownerPhone: string | null = null;

    if (data.user_id) {
      try {
        const [{ data: userRecord }, { data: profileRecord }] = await Promise.all([
          (supabase.from('users') as any)
            .select('*, user_profiles(*)')
            .eq('id', data.user_id)
            .maybeSingle(),
          (supabase.from('profiles') as any)
            .select('*')
            .eq('id', data.user_id)
            .maybeSingle()
        ]);

        const up = userRecord?.user_profiles ? (Array.isArray(userRecord.user_profiles) ? userRecord.user_profiles[0] : userRecord.user_profiles) : null;

        ownerEmail = userRecord?.email || profileRecord?.email || data.email_fiscal || null;
        ownerName = userRecord?.name || profileRecord?.name || null;
        ownerAvatarUrl = up?.avatar_url || profileRecord?.avatar_url || null;
        ownerVerificationLevel = userRecord?.verification_level || profileRecord?.verification_level || up?.verification_level || 'none';
        ownerIsSuspended = Boolean(userRecord?.is_suspended || profileRecord?.is_suspended || up?.is_suspended);
        ownerPhone = userRecord?.phone || up?.whatsapp_phone || data.phone || data.whatsapp || null;
      } catch (err) {
        console.warn('[enterprisesService] Aviso ao buscar perfil do proprietário:', err);
      }
    }

    return {
      ...data,
      owner_email: ownerEmail,
      owner_name: ownerName,
      owner_avatar_url: ownerAvatarUrl,
      owner_verification_level: ownerVerificationLevel,
      owner_is_suspended: ownerIsSuspended,
      owner_phone: ownerPhone
    };
  }
};
