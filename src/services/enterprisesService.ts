/* eslint-disable complexity */
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

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
        enterprise_subscriptions (*)
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

    // Try to enrich owner details from profiles or users table
    const userIds = Array.from(new Set(enterprisesList.map(e => e.user_id).filter(Boolean)));
    if (userIds.length > 0) {
      try {
        const { data: profiles } = await (supabase.from('profiles') as any)
          .select('id, email, name')
          .in('id', userIds);

        if (profiles) {
          const profileMap = new Map(profiles.map((p: any) => [p.id, p]));
          enterprisesList = enterprisesList.map(ent => {
            const prof: any = profileMap.get(ent.user_id);
            return {
              ...ent,
              owner_email: prof?.email || ent.whatsapp || null,
              owner_name: prof?.name || null
            };
          });
        }
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

    if (data.user_id) {
      try {
        const { data: prof } = await (supabase.from('profiles') as any)
          .select('email, name')
          .eq('id', data.user_id)
          .maybeSingle();

        if (prof) {
          ownerEmail = prof.email;
          ownerName = prof.name;
        }
      } catch (err) {
        console.warn('[enterprisesService] Aviso ao buscar perfil do proprietário:', err);
      }
    }

    return {
      ...data,
      owner_email: ownerEmail,
      owner_name: ownerName
    };
  }
};
