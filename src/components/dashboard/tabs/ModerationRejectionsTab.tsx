/* eslint-disable complexity, @next/next/no-img-element */
import React, { useState } from 'react';
import {
  ShieldAlert,
  Image as ImageIcon,
  Film,
  AlertTriangle,
  Search,
  RefreshCw,
  Eye,
  Calendar,
  Layers,
  Info
} from 'lucide-react';
import {
  useModerationRejections,
  RejectedItem,
  categorizeRejectionReason,
  RejectionCategoryFilter
} from '../../../hooks/useModerationRejections';
import { RejectionDetailModal } from '../modals/RejectionDetailModal';

export const ModerationRejectionsTab: React.FC = () => {
  const {
    filteredItems,
    paginatedItems,
    loading,
    error,
    stats,
    typeFilter,
    setTypeFilter,
    categoryFilter,
    setCategoryFilter,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,
    refetch
  } = useModerationRejections();

  const [selectedItem, setSelectedItem] = useState<RejectedItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenDetail = (item: RejectedItem) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  const handleCloseDetail = () => {
    setModalOpen(false);
    setSelectedItem(null);
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredItems.length);

  return (
    <div className="moderation-rejections-tab" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner / Explanatory Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--bg-card)',
          padding: '16px 20px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <ShieldAlert size={20} style={{ color: 'var(--danger)' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
              Central de Moderação & Recusas
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            Acompanhe e audite as solicitações de anúncios que foram rejeitadas manualmente ou bloqueadas preventivamente por diretrizes de segurança.
          </p>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={refetch}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} className={loading ? 'spinning' : ''} />
          {loading ? 'Atualizando...' : 'Atualizar Lista'}
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {/* Card 1: Total Recusas */}
        <div className="stat-card">
          <div className="stat-info">
            <h3>Total de Recusas</h3>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>
              {stats.total}
            </div>
          </div>
          <div
            className="stat-icon-wrapper"
            style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', marginTop: '8px' }}
          >
            <ShieldAlert size={24} />
          </div>
        </div>

        {/* Card 2: Banners Recusados */}
        <div className="stat-card">
          <div className="stat-info">
            <h3>Banners Recusados</h3>
            <div className="stat-value">{stats.bannersCount}</div>
          </div>
          <div
            className="stat-icon-wrapper"
            style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', marginTop: '8px' }}
          >
            <ImageIcon size={24} />
          </div>
        </div>

        {/* Card 3: Stories Recusados */}
        <div className="stat-card">
          <div className="stat-info">
            <h3>Stories Recusados</h3>
            <div className="stat-value">{stats.storiesCount}</div>
          </div>
          <div
            className="stat-icon-wrapper"
            style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', marginTop: '8px' }}
          >
            <Film size={24} />
          </div>
        </div>

        {/* Card 4: Principal Causa */}
        <div className="stat-card">
          <div className="stat-info">
            <h3>Principal Causa</h3>
            <div
              className="stat-value"
              style={{
                fontSize: stats.topReason.length > 20 ? '16px' : '20px',
                fontWeight: 600,
                lineHeight: 1.3
              }}
              title={stats.topReason}
            >
              {stats.topReason}
            </div>
          </div>
          <div
            className="stat-icon-wrapper"
            style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)', color: '#f97316', marginTop: '8px' }}
          >
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div className="filters-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {/* Filter by Type */}
            <div className="filter-control">
              <label>Tipo de Anúncio</label>
              <div style={{ display: 'flex', gap: '6px', paddingTop: '4px' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${typeFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setTypeFilter('all')}
                >
                  Todos ({stats.total})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${typeFilter === 'banner' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setTypeFilter('banner')}
                >
                  Banners ({stats.bannersCount})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${typeFilter === 'story' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setTypeFilter('story')}
                >
                  Stories ({stats.storiesCount})
                </button>
              </div>
            </div>

            {/* Filter by Category */}
            <div className="filter-control">
              <label>Categoria da Recusa</label>
              <select
                className="select-field"
                style={{ height: '36px', minWidth: '200px' }}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as RejectionCategoryFilter)}
              >
                <option value="all">Todas as Categorias</option>
                <option value="image">Imagem (Baixa qualidade / imprópria)</option>
                <option value="text">Texto (Ofensivo / erros)</option>
                <option value="link">Link (Inválido / suspeito)</option>
                <option value="safety">Segurança & Diretrizes</option>
                <option value="other">Outros Motivos</option>
              </select>
            </div>
          </div>

          {/* Search Box */}
          <div className="filter-control" style={{ minWidth: '260px', flex: 1, maxWidth: '400px' }}>
            <label>Buscar Solicitante, Anúncio ou Motivo</label>
            <div style={{ position: 'relative', marginTop: '4px' }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                className="input-field"
                placeholder="Ex: João, Promoção, Ofensivo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '34px', height: '36px', width: '100%' }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '8px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rejections Table */}
      <div className="table-container">
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '260px' }}>Anúncio Recusado</th>
                <th style={{ width: '200px' }}>Solicitante</th>
                <th>Motivo da Recusa</th>
                <th style={{ width: '150px' }}>Abrangência</th>
                <th style={{ width: '140px' }}>Data da Recusa</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <RefreshCw size={24} className="spinning" style={{ margin: '0 auto 8px', display: 'block' }} />
                    Carregando recusas da moderação...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--danger)' }}>
                    <AlertTriangle size={24} style={{ margin: '0 auto 8px', display: 'block' }} />
                    Erro ao carregar recusas: {error.message}
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <ShieldAlert size={36} style={{ margin: '0 auto 12px', display: 'block', color: 'var(--text-muted)', opacity: 0.5 }} />
                    <strong>Nenhuma solicitação recusada encontrada</strong>
                    <div style={{ fontSize: '13px', marginTop: '4px' }}>
                      {searchQuery || categoryFilter !== 'all' || typeFilter !== 'all'
                        ? 'Tente ajustar os filtros ou o termo de busca.'
                        : 'Não existem registros de publicações recusadas no momento.'}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const isBanner = item._type === 'banner';
                  const name = isBanner
                    ? item.title || 'Sem título'
                    : item.story_channels?.name || 'Story';
                  const requesterName = isBanner
                    ? item.users?.name || 'Não informado'
                    : item.story_channels?.users?.name || item.users?.name || 'Não informado';
                  const requesterEmail = isBanner
                    ? item.users?.email || ''
                    : item.story_channels?.users?.email || item.users?.email || '';

                  const mediaUrl = isBanner
                    ? item.image_url
                    : item.media_url || item.story_channels?.avatar_url;

                  const itemScope = isBanner ? item.scope : item.story_channels?.scope;
                  const itemCountry = isBanner ? item.country : item.story_channels?.country;
                  const itemState = isBanner ? item.state : item.story_channels?.state;
                  const itemCity = isBanner ? item.city : item.story_channels?.city;

                  const scopeText =
                    itemScope === 'global'
                      ? 'Global'
                      : itemScope === 'national'
                      ? `Brasil`
                      : itemScope === 'state'
                      ? `${itemState || 'Estado'}`
                      : `${itemCity || 'Cidade'}${itemState ? `/${itemState}` : ''}`;

                  const rejectionDate = item.rejected_at || item.created_at;
                  const category = categorizeRejectionReason(item.rejection_reason);

                  return (
                    <tr
                      key={`${item._type}-${item.id}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleOpenDetail(item)}
                    >
                      {/* Anúncio & Mídia */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: 'var(--radius-sm)',
                              overflow: 'hidden',
                              backgroundColor: '#222',
                              border: '1px solid var(--border-light)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            {mediaUrl ? (
                              <img
                                src={mediaUrl}
                                alt={name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <Layers size={18} style={{ color: '#888' }} />
                            )}
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: '13px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '180px'
                              }}
                              title={name}
                            >
                              {name}
                            </div>
                            <span
                              className={`badge ${isBanner ? 'badge-primary' : 'badge-info'}`}
                              style={{ fontSize: '10px', padding: '1px 6px', marginTop: '2px', display: 'inline-block' }}
                            >
                              {isBanner ? 'Banner' : 'Story'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Solicitante */}
                      <td>
                        <div style={{ overflow: 'hidden' }}>
                          <span style={{ fontWeight: 500, fontSize: '13px', display: 'block' }}>
                            {requesterName}
                          </span>
                          {requesterEmail && (
                            <span
                              style={{
                                fontSize: '11px',
                                color: 'var(--text-muted)',
                                display: 'block',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '190px'
                              }}
                              title={requesterEmail}
                            >
                              {requesterEmail}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Motivo da Recusa (Destaque Principal) */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              backgroundColor: 'var(--danger-bg)',
                              border: '1px solid rgba(211, 47, 47, 0.25)',
                              color: 'var(--danger)',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              lineHeight: 1.4,
                              maxWidth: '380px'
                            }}
                          >
                            <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                            <span style={{ fontWeight: 500 }}>
                              {item.rejection_reason || 'Motivo não especificado'}
                            </span>
                          </div>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', paddingLeft: '4px' }}>
                            Tag: {category}
                          </span>
                        </div>
                      </td>

                      {/* Abrangência */}
                      <td>
                        <span style={{ fontSize: '12px' }}>{scopeText}</span>
                      </td>

                      {/* Data */}
                      <td>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {rejectionDate
                            ? new Date(rejectionDate).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })
                            : '-'}
                        </span>
                      </td>

                      {/* Ação */}
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(item);
                          }}
                        >
                          <Eye size={13} />
                          Ver
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', padding: '0 8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Mostrando {startIndex + 1} a {endIndex} de {filteredItems.length} recusas
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                className={`btn btn-sm ${currentPage === page ? 'btn-primary' : 'btn-secondary'}`}
                style={{ minWidth: '32px', padding: '4px 8px' }}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      {/* Rejection Detail Modal */}
      <RejectionDetailModal
        isOpen={modalOpen}
        item={selectedItem}
        onClose={handleCloseDetail}
      />
    </div>
  );
};
