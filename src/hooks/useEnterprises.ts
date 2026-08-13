import { useState, useEffect, useCallback } from 'react';
import { enterprisesService, EnterpriseWithDetails } from '../services/enterprisesService';
import { useToast } from './useToast';

export function useEnterprises() {
  const { success, error } = useToast();
  const [enterprises, setEnterprises] = useState<EnterpriseWithDetails[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [tierFilter, setTierFilter] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState<string | null>(null);
  const [cityFilter, setCityFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState<Error | null>(null);

  // Detail & Modal States
  const [selectedEnterprise, setSelectedEnterprise] = useState<EnterpriseWithDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [blockingEnterprise, setBlockingEnterprise] = useState<EnterpriseWithDetails | null>(null);
  const [unblockingEnterprise, setUnblockingEnterprise] = useState<EnterpriseWithDetails | null>(null);

  const fetchEnterprises = useCallback(async () => {
    setLoading(true);
    setErrorState(null);
    try {
      const { enterprises: data, totalCount: count } = await enterprisesService.getAdminEnterprises({
        page,
        pageSize,
        search,
        status: statusFilter,
        tier: tierFilter,
        state: stateFilter,
        city: cityFilter
      });
      setEnterprises(data || []);
      setTotalCount(count);
    } catch (err: any) {
      console.error('[useEnterprises] Erro ao carregar empresas:', err);
      setErrorState(err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter, tierFilter, stateFilter, cityFilter]);

  useEffect(() => {
    fetchEnterprises();
  }, [fetchEnterprises]);

  const loadEnterpriseDetails = async (enterpriseId: string) => {
    setDetailsLoading(true);
    try {
      const details = await enterprisesService.getEnterpriseDetails(enterpriseId);
      setSelectedEnterprise(details);
      return details;
    } catch (err: any) {
      error('Falha ao carregar detalhes do estabelecimento: ' + err.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  const blockEnterprise = async (enterpriseId: string, reason: string) => {
    try {
      await enterprisesService.blockEnterprise(enterpriseId, reason);
      success('Empresa bloqueada com sucesso!');
      setBlockingEnterprise(null);
      fetchEnterprises();
      if (selectedEnterprise && selectedEnterprise.id === enterpriseId) {
        loadEnterpriseDetails(enterpriseId);
      }
    } catch (err: any) {
      error('Falha ao bloquear empresa: ' + err.message);
    }
  };

  const unblockEnterprise = async (enterpriseId: string) => {
    try {
      await enterprisesService.unblockEnterprise(enterpriseId);
      success('Empresa desbloqueada com sucesso!');
      setUnblockingEnterprise(null);
      fetchEnterprises();
      if (selectedEnterprise && selectedEnterprise.id === enterpriseId) {
        loadEnterpriseDetails(enterpriseId);
      }
    } catch (err: any) {
      error('Falha ao desbloquear empresa: ' + err.message);
    }
  };

  return {
    enterprises,
    totalCount,
    loading,
    error: errorState,
    page,
    setPage,
    pageSize,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    tierFilter,
    setTierFilter,
    stateFilter,
    setStateFilter,
    cityFilter,
    setCityFilter,
    selectedEnterprise,
    setSelectedEnterprise,
    detailsLoading,
    blockingEnterprise,
    setBlockingEnterprise,
    unblockingEnterprise,
    setUnblockingEnterprise,
    loadEnterpriseDetails,
    blockEnterprise,
    unblockEnterprise,
    refetch: fetchEnterprises
  };
}
