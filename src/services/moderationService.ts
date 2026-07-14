import { supabase } from '../lib/supabase';
import { notificationsService } from './notificationsService';
import type { Database } from '../types/database.types';

type Banner = Database['public']['Tables']['banners']['Row'];
type Channel = Database['public']['Tables']['story_channels']['Row'];

export const moderationService = {
  async getPendingBanners() {
    const { data, error } = await (supabase
      .from('banners')
      .select('*, users(name, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false }) as any);

    if (error) {
      console.error('[moderationService] Erro ao buscar banners pendentes:', error);
      throw error;
    }
    return data || [];
  },

  async getPendingStories() {
    const { data, error } = await (supabase
      .from('story_channels')
      .select('*, users(name, email), story_items(*)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false }) as any);

    if (error) {
      console.error('[moderationService] Erro ao buscar stories pendentes:', error);
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
    const table = type === 'banner' ? 'banners' : 'story_channels';

    // Prazo limite para pagamento de 7 dias
    const paymentLimitDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const updates: any = {
      status: 'awaiting_payment',
      payment_limit_date: paymentLimitDate,
      updated_at: new Date().toISOString(),
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
    const displayType = type === 'banner' ? 'Banner' : 'Canal';
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
    const table = type === 'banner' ? 'banners' : 'story_channels';

    const { data, error } = await (supabase.from(table) as any)
      .update({
        status: 'rejected',
        rejection_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`[moderationService] Erro ao recusar ${type}:`, error);
      throw error;
    }

    // Enviar notificação
    const displayType = type === 'banner' ? 'Banner' : 'Canal';
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
