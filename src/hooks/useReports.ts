import { useState, useEffect, useCallback } from 'react';
import { reportsService } from '../services/reportsService';
import type { Database } from '../types/database.types';
import { useToast } from './useToast';

type Report = Database['public']['Tables']['reports']['Row'];

export function useReports(initialStatus?: Report['status'], initialTargetType?: Report['target_type']) {
  const { success, error } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [statusFilter, setStatusFilter] = useState<Report['status'] | undefined>(initialStatus);
  const [targetTypeFilter, setTargetTypeFilter] = useState<Report['target_type'] | undefined>(initialTargetType);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState<Error | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setErrorState(null);
    try {
      const { data, totalCount } = await reportsService.getReports({
        page,
        pageSize,
        status: statusFilter,
        targetType: targetTypeFilter,
      });
      setReports(data || []);
      setTotalCount(totalCount);
    } catch (err: any) {
      setErrorState(err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, targetTypeFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const updateReportStatus = async (reportId: string, status: Report['status'], notes?: string) => {
    try {
      await reportsService.updateReportStatus(reportId, status, notes);
      setReports((prev) =>
        prev.map((rep) => (rep.id === reportId ? { ...rep, status, notes: notes || rep.notes } : rep))
      );
      success('Denúncia atualizada com sucesso!');
    } catch (err: any) {
      error('Falha ao atualizar denúncia: ' + err.message);
      throw err;
    }
  };

  return {
    reports,
    totalCount,
    loading,
    error: errorState,
    page,
    setPage,
    statusFilter,
    setStatusFilter,
    targetTypeFilter,
    setTargetTypeFilter,
    updateReportStatus,
    refetch: fetchReports,
  };
}
