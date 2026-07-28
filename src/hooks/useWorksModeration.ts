import { useState, useEffect, useCallback } from 'react';
import { moderationService } from '../services/moderationService';
import type { Work, WorkStatus } from '../types/works.types';

export function useWorksModeration() {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<WorkStatus | 'all'>('all');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Modal states
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [blockModalOpen, setBlockModalOpen] = useState<boolean>(false);
  const [workToBlock, setWorkToBlock] = useState<Work | null>(null);
  const [blockReason, setBlockReason] = useState<string>('');
  const [isBlocking, setIsBlocking] = useState<boolean>(false);
  const [blockError, setBlockError] = useState<string | null>(null);

  const fetchWorks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await moderationService.getWorks({
        status: statusFilter,
        page,
        limit,
        searchQuery,
        sortOrder
      });
      setWorks(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('[useWorksModeration] Erro ao carregar obras:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, limit, searchQuery, sortOrder]);

  useEffect(() => {
    fetchWorks();
  }, [fetchWorks]);

  const handleStatusFilterChange = (newStatus: WorkStatus | 'all') => {
    setStatusFilter(newStatus);
    setPage(1);
  };

  const handleSortOrderChange = (newSortOrder: 'desc' | 'asc') => {
    setSortOrder(newSortOrder);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleOpenDetail = (work: Work) => {
    setSelectedWork(work);
    setDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailModalOpen(false);
    setSelectedWork(null);
  };

  const handleOpenBlockModal = (work: Work) => {
    setWorkToBlock(work);
    setBlockReason('');
    setBlockError(null);
    setBlockModalOpen(true);
  };

  const handleCloseBlockModal = () => {
    setBlockModalOpen(false);
    setWorkToBlock(null);
    setBlockReason('');
    setBlockError(null);
  };

  const handleExecuteBlock = async (reasonInput?: string) => {
    const finalReason = reasonInput !== undefined ? reasonInput : blockReason;
    if (!workToBlock) return;

    if (!finalReason || finalReason.trim().length < 10) {
      setBlockError('O motivo do bloqueio é obrigatório e deve ter no mínimo 10 caracteres.');
      return;
    }

    setIsBlocking(true);
    setBlockError(null);

    try {
      await moderationService.blockWork({
        workId: workToBlock.id,
        creatorId: workToBlock.client_id || workToBlock.creator?.id,
        workTitle: workToBlock.title,
        reason: finalReason.trim()
      });

      handleCloseBlockModal();
      if (selectedWork?.id === workToBlock.id) {
        handleCloseDetail();
      }
      await fetchWorks();
    } catch (err: any) {
      console.error('[useWorksModeration] Erro ao executar bloqueio:', err);
      setBlockError(err.message || 'Erro ao realizar o bloqueio da obra.');
    } finally {
      setIsBlocking(false);
    }
  };

  return {
    works,
    loading,
    statusFilter,
    setStatusFilter: handleStatusFilterChange,
    page,
    setPage: handlePageChange,
    limit,
    setLimit: handleLimitChange,
    total,
    totalPages,
    searchQuery,
    setSearchQuery,
    sortOrder,
    setSortOrder: handleSortOrderChange,
    refetch: fetchWorks,

    // Detail Modal
    selectedWork,
    detailModalOpen,
    handleOpenDetail,
    handleCloseDetail,

    // Block Modal
    blockModalOpen,
    workToBlock,
    blockReason,
    setBlockReason,
    isBlocking,
    blockError,
    handleOpenBlockModal,
    handleCloseBlockModal,
    handleExecuteBlock
  };
}
