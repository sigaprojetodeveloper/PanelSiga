/* eslint-disable complexity */
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type Report = Database['public']['Tables']['reports']['Row'];

export const reportsService = {
  async getReports(params: {
    page: number;
    pageSize: number;
    status?: Report['status'];
    targetType?: Report['target_type'];
    reason?: string;
    search?: string;
  }) {
    const { page, pageSize, status, targetType, reason, search } = params;
    const startRange = (page - 1) * pageSize;
    const endRange = startRange + pageSize - 1;

    let query = supabase
      .from('reports')
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }
    if (targetType) {
      query = query.eq('target_type', targetType);
    }
    if (reason) {
      query = query.eq('reason', reason);
    }
    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      query = query.or(`reason.ilike.${q},description.ilike.${q},target_id.ilike.${q}`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(startRange, endRange);

    const { data, error, count } = await query;

    if (error) throw error;
    return { data: data || [], totalCount: count || 0 };
  },

  async updateReportStatus(reportId: string, status: Report['status'], notes?: string) {
    const updates: any = { 
      status, 
      updated_at: new Date().toISOString() 
    };

    if (notes !== undefined && notes !== null && notes !== '') {
      updates.notes = notes;
    }

    let { data, error } = await (supabase.from('reports') as any)
      .update(updates)
      .eq('id', reportId)
      .select()
      .maybeSingle();

    // Fallback gracioso se a coluna 'notes' não existir no schema do banco
    if (error && (error.message?.includes("'notes'") || error.details?.includes("'notes'") || error.code === 'PGRST204')) {
      console.warn('[reportsService] Coluna "notes" não encontrada na tabela "reports". Atualizando apenas status.');
      delete updates.notes;

      const retry = await (supabase.from('reports') as any)
        .update(updates)
        .eq('id', reportId)
        .select()
        .maybeSingle();

      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error('[reportsService] Erro ao atualizar status da denúncia:', error);
      throw error;
    }

    return data;
  },

  async getReporterDetails(reporterId: string) {
    if (!reporterId) return null;
    try {
      const [{ data: user }, { data: profile }, { data: legacyProfile }] = await Promise.all([
        (supabase.from('users') as any).select('id, name, email').eq('id', reporterId).maybeSingle(),
        (supabase.from('user_profiles') as any).select('avatar_url').eq('user_id', reporterId).maybeSingle(),
        (supabase.from('profiles') as any).select('name, email, avatar_url').eq('id', reporterId).maybeSingle()
      ]);

      if (!user && !legacyProfile) return null;

      return {
        id: reporterId,
        name: user?.name || legacyProfile?.name || 'Usuário Sem Nome',
        email: user?.email || legacyProfile?.email || '',
        avatar_url: profile?.avatar_url || legacyProfile?.avatar_url || null,
      };
    } catch (err) {
      console.warn('[reportsService] Erro ao buscar detalhes do usuário:', err);
      return null;
    }
  },

  async getTargetOwnerUserId(targetType: string, targetId: string): Promise<string | null> {
    if (!targetId) return null;
    const type = targetType?.toLowerCase();
    if (type === 'user') return targetId;

    if (type === 'work' || type === 'construction') {
      const { data } = await supabase
        .from('works')
        .select('client_id')
        .eq('id', targetId)
        .maybeSingle();
      return (data as any)?.client_id || null;
    }

    if (type === 'proposal') {
      const { data } = await supabase
        .from('proposals')
        .select('professional_id')
        .eq('id', targetId)
        .maybeSingle();
      return (data as any)?.professional_id || null;
    }

    if (type === 'budget') {
      const { data } = await supabase
        .from('budgets')
        .select('professional_id')
        .eq('id', targetId)
        .maybeSingle();
      return (data as any)?.professional_id || null;
    }

    return null;
  },
};
