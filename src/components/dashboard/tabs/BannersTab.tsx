/* eslint-disable complexity, @next/next/no-img-element */
import React, { useState } from 'react';
import { Country, State } from 'country-state-city';
import { Plus, Trash2, Link as LinkIcon, MapPin, Calendar } from 'lucide-react';

interface BannersTabProps {
  bannersHook: any;
  handleOpenAddBanner: () => void;
  handleToggleBannerStatus: (banner: any) => void;
  handleDeleteBannerClick: (banner: any) => void;
}

export const BannersTab: React.FC<BannersTabProps> = ({
  bannersHook,
  handleOpenAddBanner,
  handleToggleBannerStatus,
  handleDeleteBannerClick
}) => {
  const [scheduledLimit, setScheduledLimit] = useState(5);

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
          Gerencie os banners do carrossel principal do aplicativo móvel. O app exibe no máximo os 5 banners ativos mais recentes.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div className="filters-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          <div className="filter-control">
            <label>Abrangência</label>
            <select
              className="select-field"
              value={bannersHook.scopeFilter}
              onChange={(e) => {
                bannersHook.setScopeFilter(e.target.value);
              }}
            >
              <option value="all">Todas as abrangências</option>
              <option value="national">Nacional</option>
              <option value="state">Estadual</option>
              <option value="city">Municipal</option>
            </select>
          </div>
          {bannersHook.scopeFilter !== 'all' && (
            <div className="filter-control">
              <label>Filtrar por País</label>
              <select
                className="select-field"
                value={bannersHook.countryFilter}
                onChange={(e) => {
                  bannersHook.setCountryFilter(e.target.value);
                  bannersHook.setStateFilter('all');
                  bannersHook.setCityFilter('');
                }}
              >
                <option value="all">Todos os Países</option>
                {Country.getAllCountries().map((c) => (
                  <option key={c.isoCode} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          {bannersHook.scopeFilter !== 'all' && (bannersHook.scopeFilter === 'state' || bannersHook.scopeFilter === 'city') && bannersHook.countryFilter !== 'all' && (
            <div className="filter-control">
              <label>Filtrar por Estado</label>
              <select
                className="select-field"
                value={bannersHook.stateFilter}
                onChange={(e) => {
                  bannersHook.setStateFilter(e.target.value);
                }}
              >
                <option value="all">Todos os Estados</option>
                {(() => {
                  const selectedCountryObj = Country.getAllCountries().find(c => c.name === bannersHook.countryFilter);
                  const states = selectedCountryObj ? State.getStatesOfCountry(selectedCountryObj.isoCode) : [];
                  return states.map((s) => (
                    <option key={s.isoCode} value={s.isoCode}>{s.name} ({s.isoCode})</option>
                  ));
                })()}
              </select>
            </div>
          )}
          {bannersHook.scopeFilter === 'city' && (
            <div className="filter-control">
              <label>Buscar Cidade</label>
              <input
                type="text"
                className="input-field"
                placeholder="Ex: São Paulo"
                style={{ height: '36px', fontSize: '14px' }}
                value={bannersHook.cityFilter}
                onChange={(e) => {
                  bannersHook.setCityFilter(e.target.value);
                }}
              />
            </div>
          )}
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddBanner}>
          <Plus size={16} /> Novo Banner
        </button>
      </div>

      {bannersHook.error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: 'var(--danger)',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          fontSize: '14px'
        }}>
          <strong>Erro ao carregar banners:</strong> {bannersHook.error.message || 'Erro de conexão ou permissão com o banco de dados.'}
        </div>
      )}

      {bannersHook.loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Carregando banners...
        </div>
      ) : (
        <>
          {/* Banners em Exibição (Máx 5) */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)' }}></span>
              Banners em Exibição no App (Máx 5 ativos mais recentes)
            </h3>
            {(() => {
              const activeBanners = bannersHook.banners
                .filter((b: any) => b.status === 'active')
                .slice(0, 5);

              if (activeBanners.length === 0) {
                return (
                  <div style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', color: 'var(--text-muted)', textAlign: 'center' }}>
                    Nenhum banner ativo em exibição no momento.
                  </div>
                );
              }

              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                  {activeBanners.map((banner: any) => (
                    <div
                      key={banner.id}
                      className="banner-active-card"
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-light)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', backgroundColor: '#f0f0f0' }}>
                        <img
                          src={banner.image_url}
                          alt={banner.title || 'Banner'}
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <span className="badge badge-success" style={{ position: 'absolute', top: '10px', right: '10px' }}>
                          Em Exibição
                        </span>
                      </div>
                      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: 600 }}>{banner.title || 'Sem título'}</h4>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{banner.subtitle || 'Sem subtítulo'}</p>
                        {banner.link_url && (
                          <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)' }}>
                            <LinkIcon size={12} />
                            <a href={banner.link_url} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                              {banner.link_label || 'Ver Mais'}
                            </a>
                          </div>
                        )}
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={10} /> Abrangência: {banner.scope === 'national' ? `Nacional (${banner.country || 'Brasil'})` : banner.scope === 'state' ? `Estadual (${banner.state || ''})` : banner.scope || 'Nacional'}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={10} /> Início: {new Date(banner.initialization_date).toLocaleDateString()}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={10} /> Expira em: {new Date(banner.expiration_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', borderTop: '1px solid var(--border-light)' }}>
                        <button
                          onClick={() => handleToggleBannerStatus(banner)}
                          style={{ flex: 1, padding: '10px', background: 'none', border: 'none', borderRight: '1px solid var(--border-light)', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Desativar
                        </button>
                        <button
                          onClick={() => handleDeleteBannerClick(banner)}
                          style={{ padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
                          title="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Banners Agendados */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)' }}></span>
              Banners Agendados
            </h3>
            {(() => {
              const scheduledBannersAll = bannersHook.banners
                .filter((b: any) => b.status === 'scheduled')
                .sort((a: any, b: any) => a.initialization_date.localeCompare(b.initialization_date));

              const scheduledBannersToShow = scheduledBannersAll.slice(0, scheduledLimit);
              const hasMoreScheduled = scheduledBannersAll.length > scheduledBannersToShow.length;

              if (scheduledBannersAll.length === 0) {
                return (
                  <div style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', color: 'var(--text-muted)', textAlign: 'center' }}>
                    Nenhum banner agendado no momento.
                  </div>
                );
              }

              return (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {scheduledBannersToShow.map((banner: any) => (
                      <div
                        key={banner.id}
                        className="banner-active-card"
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-light)',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', backgroundColor: '#f0f0f0' }}>
                          <img
                            src={banner.image_url}
                            alt={banner.title || 'Banner'}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <span className="badge badge-info" style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: '#3b82f6' }}>
                            Agendado
                          </span>
                        </div>
                        <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <h4 style={{ fontSize: '15px', fontWeight: 600 }}>{banner.title || 'Sem título'}</h4>
                          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{banner.subtitle || 'Sem subtítulo'}</p>
                          {banner.link_url && (
                            <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)' }}>
                              <LinkIcon size={12} />
                              <a href={banner.link_url} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                                {banner.link_label || 'Ver Mais'}
                              </a>
                            </div>
                          )}
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <MapPin size={10} /> Abrangência: {banner.scope === 'national' ? `Nacional (${banner.country || 'Brasil'})` : banner.scope === 'state' ? `Estadual (${banner.state || ''})` : banner.scope || 'Nacional'}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Calendar size={10} /> Início: {new Date(banner.initialization_date).toLocaleDateString()}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Calendar size={10} /> Expira em: {new Date(banner.expiration_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', borderTop: '1px solid var(--border-light)' }}>
                          <button
                            onClick={() => handleToggleBannerStatus(banner)}
                            style={{ flex: 1, padding: '10px', background: 'none', border: 'none', borderRight: '1px solid var(--border-light)', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                          >
                            Desativar
                          </button>
                          <button
                            onClick={() => handleDeleteBannerClick(banner)}
                            style={{ padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
                            title="Excluir"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {hasMoreScheduled && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setScheduledLimit(prev => prev + 5)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 20px', fontWeight: 600 }}
                      >
                        <Plus size={14} /> Mais
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
};
