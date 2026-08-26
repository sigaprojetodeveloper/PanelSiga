/* eslint-disable complexity, @next/next/no-img-element */
import React from 'react';
import { getAdDates } from '../utils';

interface ModerationTabProps {
  moderationHook: any;
  adTypeFilter: 'all' | 'banner' | 'story';
  setAdTypeFilter: (filter: 'all' | 'banner' | 'story') => void;
  totalModerationItems: number;
  paginatedModerationItems: any[];
  handleOpenModerationDetails: (item: any, type: 'banner' | 'story') => void;
  totalModerationPages: number;
  startModerationIndex: number;
  moderationItemsPerPage: number;
  currentPage: number;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
}

export const ModerationTab: React.FC<ModerationTabProps> = ({
  moderationHook,
  adTypeFilter,
  setAdTypeFilter,
  totalModerationItems,
  paginatedModerationItems,
  handleOpenModerationDetails,
  totalModerationPages,
  startModerationIndex,
  moderationItemsPerPage,
  currentPage,
  setCurrentPage
}) => {
  return (
    <div>
      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="filters-group">
          <div className="filter-control">
            <label>Tipo de Solicitação</label>
            <div style={{ display: 'flex', gap: '8px', paddingTop: '6px' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                {moderationHook.pendingCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '-6px',
                    backgroundColor: 'var(--danger)',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '10px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    zIndex: 2,
                    pointerEvents: 'none'
                  }}>
                    {moderationHook.pendingCount}
                  </span>
                )}
                <button
                  className={`btn ${adTypeFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setAdTypeFilter('all')}
                >
                  Todos
                </button>
              </div>

              <div style={{ position: 'relative', display: 'inline-block' }}>
                {moderationHook.pendingBannersCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '-6px',
                    backgroundColor: 'var(--danger)',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '10px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    zIndex: 2,
                    pointerEvents: 'none'
                  }}>
                    {moderationHook.pendingBannersCount}
                  </span>
                )}
                <button
                  className={`btn ${adTypeFilter === 'banner' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setAdTypeFilter('banner')}
                >
                  Banners
                </button>
              </div>

              <div style={{ position: 'relative', display: 'inline-block' }}>
                {moderationHook.pendingStoriesCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '-6px',
                    backgroundColor: 'var(--danger)',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '10px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    zIndex: 2,
                    pointerEvents: 'none'
                  }}>
                    {moderationHook.pendingStoriesCount}
                  </span>
                )}
                <button
                  className={`btn ${adTypeFilter === 'story' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setAdTypeFilter('story')}
                >
                  Stories
                </button>
              </div>
            </div>
          </div>

          <div className="filter-control">
            <label>Status</label>
            <div style={{ display: 'flex', gap: '8px', paddingTop: '6px' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                {moderationHook.pendingCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '-6px',
                    backgroundColor: 'var(--danger)',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '10px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    zIndex: 2,
                    pointerEvents: 'none'
                  }}>
                    {moderationHook.pendingCount}
                  </span>
                )}
                <button
                  className={`btn ${moderationHook.statusFilter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => moderationHook.setStatusFilter('pending')}
                >
                  Pendentes
                </button>
              </div>
              <button
                className={`btn ${moderationHook.statusFilter === 'accepted' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => moderationHook.setStatusFilter('accepted')}
              >
                Aceitas
              </button>
              <button
                className={`btn ${moderationHook.statusFilter === 'rejected' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => moderationHook.setStatusFilter('rejected')}
              >
                Recusadas
              </button>
            </div>
          </div>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={moderationHook.refetch}
          disabled={moderationHook.loading}
        >
          Atualizar Lista
        </button>
      </div>

      {/* Moderation Items Table */}
      <div className="table-container">
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Anúncio</th>
                <th>Solicitante</th>
                <th>Abrangência</th>
                <th>Vigência</th>
              </tr>
            </thead>
            <tbody>
              {moderationHook.loading ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    Carregando solicitações...
                  </td>
                </tr>
              ) : totalModerationItems === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    Nenhuma solicitação {
                      moderationHook.statusFilter === 'pending' ? 'pendente' :
                        moderationHook.statusFilter === 'accepted' ? 'aceita' :
                          'recusada'
                    } encontrada.
                  </td>
                </tr>
              ) : (
                paginatedModerationItems.map((item) => {
                  const isBanner = item._type === 'banner';
                  const name = isBanner ? item.title || 'Sem título' : (item.story_channels?.name || item.name || 'Sem nome');
                  const requesterName = isBanner ? (item.users?.name || 'Não informado') : (item.story_channels?.users?.name || item.users?.name || 'Não informado');
                  const requesterEmail = isBanner ? (item.users?.email || '') : (item.story_channels?.users?.email || item.users?.email || '');

                  // Date & price calculations
                  const { start, end } = getAdDates(item, isBanner ? 'banner' : 'story');
                  const itemScope = isBanner ? item.scope : item.story_channels?.scope;
                  const itemCountry = isBanner ? item.country : item.story_channels?.country;
                  const itemState = isBanner ? item.state : item.story_channels?.state;
                  const itemCity = isBanner ? item.city : item.story_channels?.city;

                  return (
                    <tr
                      key={`${item._type}-${item.id}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleOpenModerationDetails(item, isBanner ? 'banner' : 'story')}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: 'var(--radius-sm)',
                            overflow: 'hidden',
                            backgroundColor: '#eee',
                            border: '1px solid var(--border-light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {(isBanner ? item.image_url : (item.story_channels?.avatar_url || item.avatar_url)) ? (
                              <img
                                src={isBanner ? item.image_url : (item.story_channels?.avatar_url || item.avatar_url)}
                                alt={name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <span style={{ fontSize: '12px', fontWeight: 600 }}>{name ? name[0] : '?'}</span>
                            )}
                          </div>
                          <div>
                            <span style={{ fontWeight: 600 }}>{name}</span>
                            <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                              {isBanner ? 'Banner' : 'Story'}
                            </span>
                            {isBanner && item.subtitle && (
                              <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>{item.subtitle}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <span style={{ fontWeight: 500 }}>{requesterName}</span>
                          {requesterEmail && (
                            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>{requesterEmail}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span>
                          {itemScope === 'global' ? 'Global' :
                            itemScope === 'national' ? `País: ${itemCountry || 'Brasil'}` :
                              itemScope === 'state' ? `Estado: ${itemState || ''}` :
                                `Cidade: ${itemCity || ''}${itemState ? ` / ${itemState}` : ''}`}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px' }}>
                          {start ? new Date(start).toLocaleDateString('pt-BR') : '-'} até {end ? new Date(end).toLocaleDateString('pt-BR') : '-'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalModerationPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', padding: '0 8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Mostrando {startModerationIndex + 1} a {Math.min(startModerationIndex + moderationItemsPerPage, totalModerationItems)} de {totalModerationItems} solicitações
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </button>
            {Array.from({ length: totalModerationPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`btn btn-sm ${currentPage === page ? 'btn-primary' : 'btn-secondary'}`}
                style={{ minWidth: '32px', padding: '4px 8px' }}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalModerationPages))}
              disabled={currentPage === totalModerationPages}
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
