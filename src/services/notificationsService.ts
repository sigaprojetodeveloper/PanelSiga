import { supabase } from '../lib/supabase';

export const notificationsService = {
  async sendNotification(params: {
    userId: string;
    title: string;
    body: string;
    type?: string;
    relatedId?: string | null;
  }) {
    const { userId, title, body, type = 'admin', relatedId = null } = params;

    const { data, error } = await (supabase.from('notifications') as any)
      .insert({
        user_id: userId,
        title,
        body,
        type,
        is_read: false,
        related_id: relatedId,
      });

    if (error) {
      console.error('[notificationsService] Erro ao enviar notificação:', error);
      throw error;
    }

    return data;
  }
};
