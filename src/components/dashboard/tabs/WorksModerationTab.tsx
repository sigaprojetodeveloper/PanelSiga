import React from 'react';
import {
  MapPin,
  Calendar,
  User,
  Search,
  RefreshCw,
  Eye,
  ShieldAlert,
  Inbox,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { useWorksModeration } from '../../../hooks/useWorksModeration';
import { WorkDetailModal } from '../modals/WorkDetailModal';
import { BlockWorkModal } from '../modals/BlockWorkModal';
import type { WorkStatus, Work } from '../../../types/works.types';

interface WorksModerationTabProps {
  worksModerationHook: ReturnType<typeof useWorksModeration>;
}

export const WorksModerationTab: React.FC<WorksModerationTabProps> = ({ worksModerationHook }) => {
  const {
    works,
    loading,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    limit,
    setLimit,
    total,
    totalPages,
    searchQuery,
    setSearchQuery,
    sortOrder,
    setSortOrder,
    refetch,

    // Detail Modal
    selectedWork,
    detailModalOpen,
    handleOpenDetail,
    handleCloseDetail,

    // Block Modal
    blockModalOpen,
    workToBlock,
    isBlocking,
    blockError,
    handleOpenBlockModal,
    handleCloseBlockModal,
    handleExecuteBlock
  } = worksModerationHook;

  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aberta':
        return <span className="badge badge-info" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>Disponível</span>;
      case 'em_andamento':
        return <span className="badge badge-warning">Em Andamento</span>;
      case 'concluida':
        return <span className="badge badge-success">Concluída</span>;
      case 'cancelled':
        return <span className="badge badge-secondary">Cancelada</span>;
      case 'bloqueada':
        return <span className="badge badge-danger">Bloqueada</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  const statusOptions: { label: string; value: WorkStatus | 'all' }[] = [
    { label: 'Todas', value: 'all' },
    { label: 'Disponíveis', value: 'aberta' },
    { label: 'Em Andamento', value: 'em_andamento' },
    { label: 'Concluídas', value: 'concluida' },
    { label: 'Canceladas', value: 'cancelled' },
    { label: 'Bloqueadas', value: 'bloqueada' },
  ];

  return (
    <div className="works-moderation-tab" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Filters Toolbar */}
      <div className="filters-bar" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Moderação de Obras</h2>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Gerencie, visualize detalhes e aplique ações de bloqueio em obras cadastradas.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={refetch}
              disabled={loading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Atualizar Lista
            </button>
          </div>
        </div>

        {/* Filters Group & Search */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          {/* Status Pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                className={`btn btn-sm ${statusFilter === opt.value ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStatusFilter(opt.value)}
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Search Box, Sort & Limit selector */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '200px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-field"
                placeholder="Buscar obra, cidade..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '32px', fontSize: '12px', height: '34px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <span>Ordem:</span>
              <select
                className="select-field"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
                style={{ fontSize: '12px', height: '34px', padding: '4px 8px' }}
              >
                <option value="desc">Mais recentes</option>
                <option value="asc">Mais antigas</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <span>Por pág:</span>
              <select
                className="select-field"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                style={{ fontSize: '12px', height: '34px', padding: '4px 8px' }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="table-container">
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Obra / Mídia</th>
                <th>Endereço Completo</th>
                <th>Criador</th>
                <th>Data de Criação</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                /* Skeleton Loading State */
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    <td colSpan={6} style={{ padding: '16px 20px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        animation: 'pulse 1.5s infinite'
                      }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '6px', backgroundColor: '#e5e7eb' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ width: '40%', height: '14px', backgroundColor: '#e5e7eb', borderRadius: '4px', marginBottom: '6px' }} />
                          <div style={{ width: '20%', height: '10px', backgroundColor: '#f3f4f6', borderRadius: '4px' }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : works.length === 0 ? (
                /* Empty State */
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}>
                      <Inbox size={42} strokeWidth={1.5} />
                      <span style={{ fontSize: '15px', fontWeight: 600 }}>Nenhuma obra encontrada</span>
                      <span style={{ fontSize: '13px' }}>
                        Tente alterar o filtro de status ou o termo de busca pesquisado.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                /* Works List */
                works.map((work: Work) => {
                  const mediaCover = work.media_urls && work.media_urls.length > 0 ? work.media_urls[0] : null;

                  return (
                    <tr key={work.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: 'var(--radius-sm)',
                            overflow: 'hidden',
                            backgroundColor: '#f3f4f6',
                            border: '1px solid var(--border-light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {mediaCover ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={mediaCover}
                                alt={work.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <span style={{ fontSize: '14px', fontWeight: 700, color: '#9ca3af' }}>
                                {work.title ? work.title[0].toUpperCase() : 'O'}
                              </span>
                            )}
                          </div>
                          <div>
                            <span style={{ fontWeight: 600, color: 'var(--text-main)', display: 'block' }}>
                              {work.title}
                            </span>
                            {work.contract && (
                              <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 500 }}>
                                📄 Contrato {work.contract.is_signed ? 'Assinado' : 'Pendente'}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                          <MapPin size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                          <span>
                            {work.address?.formatted_address || `${work.city}${work.state ? ` / ${work.state}` : ''}`}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                          <User size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                          <span>{work.creator?.name || 'Não informado'}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                          <Calendar size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                          <span>{new Date(work.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </td>
                      <td>
                        {getStatusBadge(work.status)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenDetail(work)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Eye size={13} /> Ver Detalhes
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Backend Pagination Bar */}
      {totalPages > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 8px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Mostrando {startItem} a {endItem} de {total} obras cadastradas
          </span>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPage(Math.max(page - 1, 1))}
              disabled={page <= 1 || loading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <ChevronLeft size={14} /> Anterior
            </button>

            <span style={{ fontSize: '13px', fontWeight: 600, padding: '0 6px' }}>
              Página {page} de {totalPages || 1}
            </span>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPage(Math.min(page + 1, totalPages))}
              disabled={page >= totalPages || loading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              Próxima <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Modais de Detalhes e Bloqueio */}
      <WorkDetailModal
        isOpen={detailModalOpen}
        onClose={handleCloseDetail}
        work={selectedWork}
        onBlockWork={(w) => {
          handleOpenBlockModal(w);
        }}
      />

      <BlockWorkModal
        isOpen={blockModalOpen}
        onClose={handleCloseBlockModal}
        work={workToBlock}
        onConfirmBlock={handleExecuteBlock}
        isSubmitting={isBlocking}
        externalError={blockError}
      />
    </div>
  );
};
