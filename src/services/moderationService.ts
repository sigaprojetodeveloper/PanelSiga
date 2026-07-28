import { supabase } from '../lib/supabase';
import { notificationsService } from './notificationsService';
import type { Database } from '../types/database.types';

type Banner = Database['public']['Tables']['banners']['Row'];
type Channel = Database['public']['Tables']['story_channels']['Row'];

export const moderationService = {
  async getPendingBanners(statusGroup: 'pending' | 'accepted' | 'rejected' = 'pending') {
    let query = supabase
      .from('banners')
      .select('*, users(name, email)');

    if (statusGroup === 'pending') {
      query = query.eq('status', 'pending');
    } else if (statusGroup === 'accepted') {
      query = query.in('status', ['awaiting_payment', 'scheduled', 'active']);
    } else if (statusGroup === 'rejected') {
      query = query.eq('status', 'rejected');
    }

    const { data, error } = await (query.order('created_at', { ascending: false }) as any);

    if (error) {
      console.error(`[moderationService] Erro ao buscar banners (${statusGroup}):`, error);
      throw error;
    }
    return data || [];
  },

  async getPendingStories(statusGroup: 'pending' | 'accepted' | 'rejected' = 'pending') {
    let query = supabase
      .from('story_items')
      .select(`
        *,
        story_channels!inner (
          id,
          name,
          avatar_url,
          user_id,
          scope,
          country,
          state,
          city,
          users (
            name,
            email
          )
        )
      `);

    if (statusGroup === 'pending') {
      query = query.eq('status', 'pending');
    } else if (statusGroup === 'accepted') {
      query = query.in('status', ['awaiting_payment', 'scheduled', 'active']);
    } else if (statusGroup === 'rejected') {
      query = query.eq('status', 'rejected');
    }

    const { data, error } = await (query.order('created_at', { ascending: false }) as any);

    if (error) {
      console.error(`[moderationService] Erro ao buscar stories (${statusGroup}):`, error);
      throw error;
    }
    return data || [];
  },

  async acceptRequest(params: {
    type: 'banner' | 'story';
    id: string;
    userId: string;
    adName: string;
    totalPrice?: number;
  }) {
    const { type, id, userId, adName, totalPrice } = params;
    const table = type === 'banner' ? 'banners' : 'story_items';

    // Obter prazo de pagamento configurado na tabela ad_pricing
    let daysToPay = 7;
    try {
      const { data: pricing } = await (supabase
        .from('ad_pricing') as any)
        .select('payment_term_days')
        .eq('ad_type', type)
        .limit(1)
        .maybeSingle();

      if (pricing && pricing.payment_term_days !== null) {
        daysToPay = Number(pricing.payment_term_days);
      }
    } catch (err) {
      console.warn('[moderationService] Erro ao obter prazo de pagamento, usando fallback de 7 dias:', err);
    }

    const paymentLimitDate = new Date(Date.now() + daysToPay * 24 * 60 * 60 * 1000).toISOString();

    const updates: any = {
      status: 'awaiting_payment',
      payment_limit_date: paymentLimitDate,
    };

    if (totalPrice !== undefined) {
      updates.total_price = totalPrice;
    }

    const { data, error } = await (supabase.from(table) as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`[moderationService] Erro ao aceitar ${type}:`, error);
      throw error;
    }

    // Enviar notificação
    const displayType = type === 'banner' ? 'Banner' : 'Story';
    await notificationsService.sendNotification({
      userId,
      title: 'Publicação Aprovada! 🚀',
      body: `Sua solicitação de ${displayType} "${adName}" foi aprovada. Clique aqui para realizar o pagamento e iniciar sua exibição.`,
      type: 'ad_approved',
      relatedId: id,
    });

    return data;
  },

  async rejectRequest(params: {
    type: 'banner' | 'story';
    id: string;
    userId: string;
    adName: string;
    reason: string;
  }) {
    const { type, id, userId, adName, reason } = params;
    const table = type === 'banner' ? 'banners' : 'story_items';

    const { data, error } = await (supabase.from(table) as any)
      .update({
        status: 'rejected',
        rejection_reason: reason,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`[moderationService] Erro ao recusar ${type}:`, error);
      throw error;
    }

    // Enviar notificação
    const displayType = type === 'banner' ? 'Banner' : 'Story';
    await notificationsService.sendNotification({
      userId,
      title: 'Publicação Recusada ⚠️',
      body: `Sua solicitação de ${displayType} "${adName}" foi recusada pela moderação. Motivo: ${reason}.`,
      type: 'ad_rejected',
      relatedId: id,
    });

    return data;
  },

  async getWorks(params: {
    status?: string;
    page?: number;
    limit?: number;
    searchQuery?: string;
  }) {
    const { status = 'all', page = 1, limit = 10, searchQuery } = params;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('works')
      .select(`
        *,
        users!client_id (
          id,
          name,
          email,
          phone,
          role_flags
        )
      `, { count: 'exact' });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (searchQuery && searchQuery.trim() !== '') {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`);
    }

    const { data: worksData, count, error } = await (query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1) as any);

    if (error) {
      console.error('[moderationService] Erro ao buscar obras:', error);
      throw error;
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit) || 1;

    // Process works with creator and contract details
    const formattedWorks = await Promise.all((worksData || []).map(async (w: any) => {
      // Fetch creator profile if exists
      let creatorProfile: any = null;
      if (w.client_id) {
        const { data: profile } = await (supabase
          .from('user_profiles') as any)
          .select('avatar_url, bio, whatsapp_phone')
          .eq('user_id', w.client_id)
          .maybeSingle();
        creatorProfile = profile;
      }

      // Fetch contract/proposal if exists
      let contractData: any = null;
      const { data: proposal } = await (supabase
        .from('proposals') as any)
        .select(`
          id,
          status,
          created_at,
          budget_id,
          professional_id,
          users!professional_id (
            name
          )
        `)
        .eq('work_id', w.id)
        .limit(1)
        .maybeSingle();

      if (proposal) {
        let pdfUrl: string | null = null;
        if (proposal.budget_id) {
          const { data: budget } = await (supabase
            .from('budgets') as any)
            .select('pdf_url')
            .eq('id', proposal.budget_id)
            .maybeSingle();
          pdfUrl = budget?.pdf_url || null;
        }

        const isSigned = proposal.status === 'aceita';
        contractData = {
          id: proposal.id,
          work_id: w.id,
          status: isSigned ? 'signed' : proposal.status === 'recusada' ? 'cancelled' : 'pending_signatures',
          is_signed: isSigned,
          pdf_url: pdfUrl,
          created_at: proposal.created_at,
          signers: [
            {
              id: `signer-client-${w.id}`,
              user_id: w.client_id || '',
              name: w.users?.name || 'Cliente (Criador)',
              role: 'cliente',
              signed_flag: isSigned,
              signed_at: isSigned ? proposal.created_at : null
            },
            {
              id: `signer-prof-${proposal.id}`,
              user_id: proposal.professional_id || '',
              name: proposal.users?.name || 'Profissional Contratado',
              role: 'profissional',
              signed_flag: isSigned,
              signed_at: isSigned ? proposal.created_at : null
            }
          ]
        };
      }

      return {
        id: w.id,
        client_id: w.client_id,
        title: w.title || 'Obra sem título',
        description: w.description || null,
        status: w.status,
        city: w.city || 'Não informada',
        state: w.state || '',
        address: {
          city: w.city || '',
          state: w.state || '',
          formatted_address: `${w.city || ''}${w.state ? ` / ${w.state}` : ''}`
        },
        media_urls: Array.isArray(w.media_urls) ? w.media_urls : [],
        created_at: w.created_at,
        rejection_reason: w.rejection_reason || null,
        creator: w.users ? {
          id: w.users.id,
          name: w.users.name || 'Sem nome',
          email: w.users.email || 'Não informado',
          phone: w.users.phone || null,
          role_flags: w.users.role_flags || [],
          avatar_url: creatorProfile?.avatar_url || null,
          bio: creatorProfile?.bio || null,
          whatsapp_phone: creatorProfile?.whatsapp_phone || null
        } : undefined,
        contract: contractData
      };
    }));

    return {
      data: formattedWorks,
      total,
      page,
      limit,
      totalPages
    };
  },

  async blockWork(params: {
    workId: string;
    creatorId?: string | null;
    workTitle?: string;
    reason: string;
  }) {
    const { workId, creatorId, workTitle = 'Obra', reason } = params;

    const { data, error } = await (supabase
      .from('works') as any)
      .update({
        status: 'bloqueada',
        rejection_reason: reason
      })
      .eq('id', workId)
      .select()
      .single();

    if (error) {
      console.error('[moderationService] Erro ao bloquear obra:', error);
      throw error;
    }

    // Se houver criador vinculado, dispara a notificação
    if (creatorId) {
      try {
        await notificationsService.sendNotification({
          userId: creatorId,
          title: 'Obra Bloqueada 🚫',
          body: `Sua obra "${workTitle}" foi bloqueada pela moderação. Motivo: ${reason}`,
          type: 'work_blocked',
          relatedId: workId,
        });
      } catch (notifErr) {
        console.warn('[moderationService] Erro ao enviar notificação de bloqueio:', notifErr);
      }
    }

    return data;
  }
};

