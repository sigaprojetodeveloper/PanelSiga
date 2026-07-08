import { supabase } from '../lib/supabase';

export const notificationsService = {
  async sendNotification(params: {
    userId: string;
    title: string;
    body: string;
  }) {
    const { userId, title, body } = params;

    const { data, error } = await (supabase.from('notifications') as any)
      .insert({
        user_id: userId,
        title,
        body,
        type: 'admin',
        is_read: false,
        related_id: null,
      });

    if (error) {
      console.error('[notificationsService] Erro ao enviar notificação:', error);
      throw error;
    }

    return data;
  }
};
