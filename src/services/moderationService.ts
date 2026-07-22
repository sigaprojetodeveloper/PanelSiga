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
  }
};
