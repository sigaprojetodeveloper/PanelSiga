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
    const updates: Partial<Report> = { 
      status, 
      updated_at: new Date().toISOString() 
    };
    if (notes !== undefined) {
      updates.notes = notes;
    }

    const { data, error } = await (supabase.from('reports') as any)
      .update(updates)
      .eq('id', reportId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
