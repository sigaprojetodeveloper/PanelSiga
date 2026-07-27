/* eslint-disable complexity, @next/next/no-img-element */
import React from 'react';
import { Country, State } from 'country-state-city';
import { Plus, Eye, Link as LinkIcon, Calendar, Trash2, Edit2, MapPin } from 'lucide-react';
import { getTodayStr } from '../utils';
import { useToast } from '../../../hooks/useToast';

interface ChannelRowProps {
  ch: any;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onToggleDestaque: (id: string, current: boolean) => void;
  onToggleActive: (id: string, current: boolean) => void;
  onEdit: (channel: any) => void;
  onDelete: (channel: any) => void;
}

export function ChannelRow({
  ch,
  isSelected,
  onSelect,
  onToggleDestaque,
  onToggleActive,
  onEdit,
  onDelete
}: ChannelRowProps) {
  const activeCount = (ch.story_items || []).filter((item: any) =>
    item.status === 'active' &&
    item.expiration_date >= getTodayStr()
  ).length;

  return (
    <div
      onClick={() => onSelect(ch.id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px',
        backgroundColor: isSelected ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-app)',
        borderLeft: isSelected ? '4px solid var(--primary)' : '4px solid transparent',
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        border: isSelected ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid transparent'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {ch.avatar_url ? (
          <img src={ch.avatar_url} alt={ch.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600 }}>
            {(ch.name || '?')[0]}
          </div>
        )}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{ fontWeight: 600, fontSize: '14px', color: isSelected ? 'var(--primary)' : 'inherit' }}>{ch.name || 'Sem nome'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
            <MapPin size={10} style={{ color: 'var(--text-muted)' }} />
            <span
              style={{
                fontSize: '9px',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: ch.scope === 'global' ? 'rgba(107, 114, 128, 0.1)' :
                  ch.scope === 'national' ? 'rgba(59, 130, 246, 0.1)' :
                    ch.scope === 'state' ? 'rgba(245, 158, 11, 0.1)' :
                      ch.scope === 'city' ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-app)',
                color: ch.scope === 'global' ? '#6b7280' :
                  ch.scope === 'national' ? 'var(--primary)' :
                    ch.scope === 'state' ? '#d97706' :
                      ch.scope === 'city' ? 'var(--danger)' : 'var(--text-muted)',
                fontWeight: 600,
                border: ch.scope === 'global' || !ch.scope ? '1px solid var(--border-light)' : 'none'
              }}
            >
              {ch.scope === 'global' && 'Global'}
              {ch.scope === 'national' && 'Nacional'}
              {ch.scope === 'state' && `Estadual (${ch.state || ''})`}
              {ch.scope === 'city' && `Municipal (${ch.city || ''}/${ch.state || ''})`}
              {!ch.scope && (ch.state ? (ch.city ? `${ch.city}/${ch.state}` : ch.state) : 'Nacional')}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Ativos: <strong style={{ color: activeCount > 0 ? 'var(--success)' : 'inherit' }}>{activeCount}</strong>
            {ch.is_active ? (
              <span className="badge badge-success" style={{ fontSize: '8px', padding: '1px 4px', marginLeft: '6px' }}>Ativo</span>
            ) : (
              <span className="badge badge-secondary" style={{ fontSize: '8px', padding: '1px 4px', marginLeft: '6px', backgroundColor: '#6b7280', color: 'white' }}>Inativo</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Destaque</span>
          <div
            className="switch-container"
            onClick={() => onToggleDestaque(ch.id, ch.is_destaque)}
          >
            <div className={`switch-track ${ch.is_destaque ? 'active' : ''}`}>
              <div className="switch-thumb" />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            className="btn btn-secondary btn-sm"
            style={{ padding: '4px 8px' }}
            onClick={() => onToggleActive(ch.id, ch.is_active)}
          >
            {ch.is_active ? 'Desativar' : 'Ativar'}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => onEdit(ch)}
            title="Editar"
          >
            <Edit2 size={14} />
          </button>
          <button
            className="btn btn-danger btn-sm"
            style={{ padding: '4px 8px', color: 'var(--danger)', background: 'transparent' }}
            onClick={() => onDelete(ch)}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

interface StoriesTabProps {
  storyHook: any;
  setNewChannelName: (v: string) => void;
  setNewChannelAvatar: (v: string) => void;
  setNewChannelDestaque: (v: boolean) => void;
  setNewChannelScope: (v: any) => void;
  setNewChannelState: (v: string) => void;
  setNewChannelCity: (v: string) => void;
  setAddChannelModalOpen: (v: boolean) => void;
  handleOpenAddStory: () => void;
  handleEditChannelClick: (channel: any) => void;
  handleDeleteChannel: (channel: any) => void;
  setPreviewMedia: (media: { url: string; type: 'image' | 'video' } | null) => void;
  handleExpireStoryClick: (item: any) => void;
  handleDeleteStoryClick: (item: any) => void;
  setConfirmModal: (config: any) => void;
}

export const StoriesTab: React.FC<StoriesTabProps> = ({
  storyHook,
  setNewChannelName,
  setNewChannelAvatar,
  setNewChannelDestaque,
  setNewChannelScope,
  setNewChannelState,
  setNewChannelCity,
  setAddChannelModalOpen,
  handleOpenAddStory,
  handleEditChannelClick,
  handleDeleteChannel,
  setPreviewMedia,
  handleExpireStoryClick,
  handleDeleteStoryClick,
  setConfirmModal
}) => {
  const { warning, success, error } = useToast();
  const selectedChannel = storyHook.channels.find((c: any) => c.id === storyHook.selectedChannelId);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div className="filters-group">
          <div className="filter-control">
            <label>Filtro Canais</label>
            <select
              className="select-field"
              value={storyHook.filter}
              onChange={(e) => {
                storyHook.setFilter(e.target.value as any);
                storyHook.setPage(1);
              }}
            >
              <option value="all">Todos os canais</option>
              <option value="active">Canais ativos</option>
              <option value="inactive">Canais inativos</option>
            </select>
          </div>
          <div className="filter-control">
            <label>Abrangência</label>
            <select
              className="select-field"
              value={storyHook.scopeFilter}
              onChange={(e) => {
                storyHook.setScopeFilter(e.target.value);
                storyHook.setPage(1);
              }}
            >
              <option value="all">Todas as abrangências</option>
              <option value="national">Nacional</option>
              <option value="state">Estadual</option>
              <option value="city">Municipal</option>
            </select>
          </div>
          {storyHook.scopeFilter !== 'all' && (
            <div className="filter-control">
              <label>Filtrar por País</label>
              <select
                className="select-field"
                value={storyHook.countryFilter}
                onChange={(e) => {
                  storyHook.setCountryFilter(e.target.value);
                  storyHook.setStateFilter('all');
                  storyHook.setCityFilter('');
                  storyHook.setPage(1);
                }}
              >
                <option value="all">Todos os Países</option>
                {Country.getAllCountries().map((c) => (
                  <option key={c.isoCode} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          {storyHook.scopeFilter !== 'all' && (storyHook.scopeFilter === 'state' || storyHook.scopeFilter === 'city') && storyHook.countryFilter !== 'all' && (
            <div className="filter-control">
              <label>Filtrar por Estado</label>
              <select
                className="select-field"
                value={storyHook.stateFilter}
                onChange={(e) => {
                  storyHook.setStateFilter(e.target.value);
                  storyHook.setCityFilter('');
                  storyHook.setPage(1);
                }}
              >
                <option value="all">Todos os Estados</option>
                {(() => {
                  const selectedCountryObj = Country.getAllCountries().find(c => c.name === storyHook.countryFilter);
                  const states = selectedCountryObj ? State.getStatesOfCountry(selectedCountryObj.isoCode) : [];
                  return states.map((s) => (
                    <option key={s.isoCode} value={s.isoCode}>{s.name} ({s.isoCode})</option>
                  ));
                })()}
              </select>
            </div>
          )}
          {storyHook.scopeFilter === 'city' && (
            <div className="filter-control">
              <label>Buscar Cidade</label>
              <input
                type="text"
                className="input-field"
                placeholder="Ex: São Paulo"
                style={{ height: '36px', fontSize: '14px' }}
                value={storyHook.cityFilter}
                onChange={(e) => {
                  storyHook.setCityFilter(e.target.value);
                  storyHook.setPage(1);
                }}
              />
            </div>
          )}
          <div className="filter-control">
            <label>Ordenar Canais</label>
            <select
              className="select-field"
              value={storyHook.sort}
              onChange={(e) => {
                storyHook.setSort(e.target.value as any);
                storyHook.setPage(1);
              }}
            >
              <option value="newest">Mais novos</option>
              <option value="oldest">Mais antigos</option>
            </select>
          </div>
        </div>

        <div className={`stories-header-actions ${storyHook.selectedChannelId ? 'channel-selected-actions' : ''}`} style={{ display: 'flex', gap: '12px' }}>
          <button
            className="btn btn-secondary btn-new-channel"
            onClick={() => {
              setNewChannelName('');
              setNewChannelAvatar('');
              setNewChannelDestaque(false);
              setNewChannelScope('national');
              setNewChannelState('');
              setNewChannelCity('');
              setAddChannelModalOpen(true);
            }}
          >
            <Plus size={16} /> <span className="btn-text">Novo Canal</span>
          </button>
          <button
            className="btn btn-primary btn-new-story"
            onClick={handleOpenAddStory}
            disabled={!storyHook.selectedChannelId}
            title={!storyHook.selectedChannelId ? "Selecione um canal antes de criar um story" : ""}
          >
            <Plus size={16} /> <span className="btn-text">Novo Story Item</span>
          </button>
        </div>
      </div>

      {/* Split screen: channels on left, stories on right */}
      <div className={`stories-split-container ${storyHook.selectedChannelId ? 'channel-selected' : ''}`}>
        {/* Channels List */}
        <div className="stories-channels-pane" style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Canais de Stories</h3>
          {storyHook.channels.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Nenhum canal criado.</p>
          ) : (
            <div style={{ display: 'flex', overflowX: 'hidden', flexDirection: 'column', gap: '12px', flex: 1 }}>
              {storyHook.channels.map((ch: any) => (
                <ChannelRow
                  key={ch.id}
                  ch={ch}
                  isSelected={ch.id === storyHook.selectedChannelId}
                  onSelect={(id) => {
                    if (storyHook.selectedChannelId === id) {
                      storyHook.setSelectedChannelId(undefined);
                    } else {
                      storyHook.setSelectedChannelId(id);
                    }
                  }}
                  onToggleDestaque={(id, current) => storyHook.updateChannel(id, { is_destaque: !current })}
                  onToggleActive={(id, current) => {
                    if (current) {
                      if (ch.user_id) {
                        warning('Este canal está vinculado a um usuário e não pode ser desativado.');
                        return;
                      }
                      setConfirmModal({
                        isOpen: true,
                        title: 'Desativar Canal',
                        message: 'Deseja realmente desativar este canal de stories?',
                        onConfirm: async () => {
                          try {
                            await storyHook.updateChannel(id, { is_active: false, status: 'deactivated' });
                            success('Canal desativado com sucesso!');
                          } catch (err: any) {
                            console.error(err);
                            error('Falha ao desativar canal: ' + err.message);
                          }
                        }
                      });
                    } else {
                      storyHook.updateChannel(id, { is_active: true, status: 'active' });
                    }
                  }}
                  onEdit={handleEditChannelClick}
                  onDelete={handleDeleteChannel}
                />
              ))}
            </div>
          )}

          {/* Channels Pagination */}
          {storyHook.channels.length > 0 && (
            <div className="pagination" style={{ marginTop: '16px', borderTop: '1px solid var(--border-light)', paddingTop: '16px', paddingBottom: '0' }}>
              <div className="pagination-info" style={{ fontSize: '12px' }}>
                Total: {storyHook.totalCount} canais
              </div>
              <div className="pagination-actions" style={{ gap: '4px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={storyHook.page === 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    storyHook.setPage((p: number) => p - 1);
                  }}
                  style={{ padding: '4px 8px', fontSize: '11px' }}
                >
                  Anterior
                </button>
                <span style={{ fontSize: '11px', display: 'flex', alignItems: 'center', padding: '0 4px' }}>
                  Pág {storyHook.page}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={storyHook.channels.length < 10}
                  onClick={(e) => {
                    e.stopPropagation();
                    storyHook.setPage((p: number) => p + 1);
                  }}
                  style={{ padding: '4px 8px', fontSize: '11px' }}
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Story Items Grid */}
        <div className="stories-items-pane" style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Stories Publicados</h3>
          {storyHook.selectedChannelId && (
            <button
              className="btn btn-secondary mobile-only-back-btn"
              onClick={() => storyHook.setSelectedChannelId(undefined)}
              style={{ marginBottom: '16px', width: '100%' }}
            >
              ← Voltar para Canais
            </button>
          )}
          {!storyHook.selectedChannelId ? (
            <p style={{ color: 'var(--text-muted)' }}>Selecione um canal na lista para visualizar seus stories.</p>
          ) : storyHook.items.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Nenhum story publicado neste filtro.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
              {storyHook.items.map((item: any) => {
                const todayStr = getTodayStr();
                const isExpired = item.expiration_date < todayStr;

                return (
                  <div
                    key={item.id}
                    style={{
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      backgroundColor: 'var(--bg-app)',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <div
                      className="media-container"
                      onClick={() => setPreviewMedia({ url: item.media_url, type: item.media_type })}
                      style={{
                        height: '180px',
                        backgroundColor: 'black',
                        position: 'relative',
                        cursor: 'pointer'
                      }}
                    >
                      {item.media_type === 'image' ? (
                        <img
                          src={item.media_url}
                          alt="Story"
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          onError={(e) => {
                            console.error("Erro ao carregar imagem do story:", item.media_url);
                            e.currentTarget.src = "https://images.unsplash.com/photo-1594322436404-5a0526db4d13?w=300&h=500&fit=crop";
                          }}
                        />
                      ) : (
                        <video
                          src={item.media_url}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          controls={false}
                          onError={(e) => {
                            console.error("Erro ao carregar vídeo do story:", item.media_url);
                          }}
                        />
                      )}

                      {/* Hover Overlay */}
                      <div
                        className="media-hover-overlay"
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: 'rgba(0, 0, 0, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0,
                          transition: 'opacity 0.2s ease',
                          zIndex: 5
                        }}
                      >
                        <span style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                          padding: '10px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          backdropFilter: 'blur(4px)'
                        }}>
                          <Eye size={20} />
                        </span>
                      </div>

                      <span
                        className={`badge ${isExpired ? 'badge-danger' : 'badge-success'}`}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          backgroundColor: isExpired ? '#6b7280' : undefined,
                          zIndex: 6
                        }}
                      >
                        {isExpired ? 'Expirado' : 'Ativo'}
                      </span>
                    </div>

                    <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>
                        {selectedChannel?.name || 'Canal Desconhecido'}
                      </span>
                      {item.link_url && (
                        <a href={item.link_url} target="_blank" rel="noreferrer" style={{ fontSize: '10px', color: 'var(--primary)', textDecoration: 'none', margin: '4px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <LinkIcon size={10} /> {item.link_label || 'Acessar'}
                        </a>
                      )}
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={10} /> Expira em: {new Date(item.expiration_date).toLocaleDateString()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', borderTop: '1px solid var(--border-light)' }}>
                      {!(isExpired && item.status !== 'active') ? (
                        <>
                          <button
                            onClick={() => handleExpireStoryClick(item)}
                            style={{
                              flex: 1,
                              padding: '8px',
                              background: 'none',
                              border: 'none',
                              borderRight: '1px solid var(--border-light)',
                              fontSize: '11px',
                              cursor: 'pointer',
                              color: 'var(--text-main)',
                              fontWeight: 500
                            }}
                          >
                            {item.status === 'active' ? 'Expirar' : 'Ativar'}
                          </button>
                          <button
                            onClick={() => handleDeleteStoryClick(item)}
                            style={{
                              padding: '8px 16px',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--danger)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Excluir"
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleDeleteStoryClick(item)}
                          style={{
                            flex: 1,
                            padding: '8px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--danger)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            fontWeight: 600,
                            fontSize: '11px'
                          }}
                          title="Excluir"
                        >
                          <Trash2 size={12} /> Excluir Story
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
