/* eslint-disable complexity, @next/next/no-img-element */
import React from 'react';
import { Search, Plus, Key, Trash2 } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';

interface SettingsTabProps {
  settingsSubTab: 'general' | 'banners' | 'stories' | 'contracts' | 'admins' | 'requests';
  setSettingsSubTab: (subTab: 'general' | 'banners' | 'stories' | 'contracts' | 'admins' | 'requests') => void;
  requestDisplayOnScreen: boolean;
  setRequestDisplayOnScreen: (val: boolean) => void;
  requestSoundAlert: boolean;
  setRequestSoundAlert: (val: boolean) => void;
  notificationPermission: NotificationPermission;
  requestNotificationPermission: () => void;
  adPricingHook: any;
  setSelectedLangTab: (lang: 'pt' | 'en' | 'es') => void;
  setTempTemplateText: (text: string) => void;
  templatePt: string;
  contractTemplate: string;
  setIsTemplateModalOpen: (open: boolean) => void;
  adminUsersHook: any;
  adminUsername: string;
  setNewAdminUsername: (val: string) => void;
  setNewAdminPassword: (val: string) => void;
  setNewAdminConfirmPassword: (val: string) => void;
  setIsAdminModalOpen: (open: boolean) => void;
  setSelectedAdminId: (id: string) => void;
  setSelectedAdminUsername: (username: string) => void;
  setEditAdminPassword: (val: string) => void;
  setEditAdminConfirmPassword: (val: string) => void;
  setIsAdminPasswordModalOpen: (open: boolean) => void;
  handleDeleteAdminClick: (admin: any) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settingsSubTab,
  setSettingsSubTab,
  requestDisplayOnScreen,
  setRequestDisplayOnScreen,
  requestSoundAlert,
  setRequestSoundAlert,
  notificationPermission,
  requestNotificationPermission,
  adPricingHook,
  setSelectedLangTab,
  setTempTemplateText,
  templatePt,
  contractTemplate,
  setIsTemplateModalOpen,
  adminUsersHook,
  adminUsername,
  setNewAdminUsername,
  setNewAdminPassword,
  setNewAdminConfirmPassword,
  setIsAdminModalOpen,
  setSelectedAdminId,
  setSelectedAdminUsername,
  setEditAdminPassword,
  setEditAdminConfirmPassword,
  setIsAdminPasswordModalOpen,
  handleDeleteAdminClick
}) => {
  const { success } = useToast();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Sub-tabs header */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`btn ${settingsSubTab === 'general' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSettingsSubTab('general')}
          style={{ padding: '8px 16px', fontSize: '13px' }}
        >
          Geral
        </button>
        <button
          type="button"
          className={`btn ${settingsSubTab === 'banners' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSettingsSubTab('banners')}
          style={{ padding: '8px 16px', fontSize: '13px' }}
        >
          Banners
        </button>
        <button
          type="button"
          className={`btn ${settingsSubTab === 'stories' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSettingsSubTab('stories')}
          style={{ padding: '8px 16px', fontSize: '13px' }}
        >
          Stories
        </button>
        <button
          type="button"
          className={`btn ${settingsSubTab === 'contracts' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSettingsSubTab('contracts')}
          style={{ padding: '8px 16px', fontSize: '13px' }}
        >
          Contratos
        </button>
        <button
          type="button"
          className={`btn ${settingsSubTab === 'admins' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSettingsSubTab('admins')}
          style={{ padding: '8px 16px', fontSize: '13px' }}
        >
          Usuários Admin
        </button>
        <button
          type="button"
          className={`btn ${settingsSubTab === 'requests' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSettingsSubTab('requests')}
          style={{ padding: '8px 16px', fontSize: '13px' }}
        >
          Solicitações
        </button>
      </div>

      {/* Sub-tab: Requests / Solicitações */}
      {settingsSubTab === 'requests' && (
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '32px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', maxWidth: '600px' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Configurações de Solicitações</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
            Defina as preferências de notificação e alertas automáticos quando novas solicitações de anúncios chegarem ao painel.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                checked={requestDisplayOnScreen}
                onChange={(e) => {
                  const val = e.target.checked;
                  setRequestDisplayOnScreen(val);
                  localStorage.setItem('siga_req_display_on_screen', val ? 'true' : 'false');
                  success(val ? 'Exibição em tela ativada.' : 'Exibição em tela desativada.');
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>Exibir na tela</span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Caso esteja ativo, ao chegar uma solicitação de banner ou story, exibe a tela de &ldquo;Análise de Solicitação de Publicidade&ldquo;.
                </span>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                checked={requestSoundAlert}
                onChange={(e) => {
                  const val = e.target.checked;
                  setRequestSoundAlert(val);
                  localStorage.setItem('siga_req_sound_alert', val ? 'true' : 'false');
                  success(val ? 'Alerta sonoro ativado.' : 'Alerta sonoro desativado.');
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>Alerta Sonoro</span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Caso esteja ativo, ao chegar uma solicitação de banner ou stories toca o efeito sonoro do sistema.
                </span>
              </div>
            </label>

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', marginTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>Notificações do Navegador</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Status da permissão: <strong>{notificationPermission === 'granted' ? 'Concedida ✅' : notificationPermission === 'denied' ? 'Bloqueada ❌' : 'Padrão / Não solicitada ⚠️'}</strong>
                  </span>
                </div>
                {notificationPermission !== 'granted' && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={requestNotificationPermission}
                  >
                    Ativar Notificações Web
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab: General */}
      {settingsSubTab === 'general' && (
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '32px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', maxWidth: '600px' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '24px' }}>Preferências do Painel</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label>Nome do Sistema</label>
              <input type="text" className="input-field" value="Siga Painel Administrativo" disabled />
            </div>
            <div className="form-group">
              <label>Versão da API do Supabase</label>
              <input type="text" className="input-field" value="v1.0.0-serverless" disabled />
            </div>
            <div className="form-group">
              <label>Logs de Auditoria</label>
              <select className="select-field">
                <option>Ativado (Registrar todas as exclusões/bloqueios)</option>
                <option>Desativado</option>
              </select>
            </div>
            <button className="btn btn-primary" style={{ width: 'fit-content' }} onClick={() => success('Configurações salvas.')}>
              Salvar Alterações
            </button>
          </div>
        </div>
      )}

      {/* Sub-tab: Banners */}
      {settingsSubTab === 'banners' && (
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '32px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', maxWidth: '600px' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Preços para Banners</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
            Defina os valores cobrados por dia de veiculação do banner por escopo regional.
          </p>

          {adPricingHook.loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Carregando preços...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div className="form-group">
                <label>Preço Nacional (R$ / dia)</label>
                <input
                  type="number"
                  className="input-field"
                  value={adPricingHook.prices.banner.national}
                  onChange={(e) => adPricingHook.updatePrice('banner', 'national', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label>Preço Estadual (R$ / dia)</label>
                <input
                  type="number"
                  className="input-field"
                  value={adPricingHook.prices.banner.state}
                  onChange={(e) => adPricingHook.updatePrice('banner', 'state', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="form-group">
                <label>Prazo para Pagamento (dias)</label>
                <input
                  type="number"
                  className="input-field"
                  value={adPricingHook.prices.banner.payment_term_days}
                  onChange={(e) => adPricingHook.updatePrice('banner', 'payment_term_days' as any, parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          )}

          <button
            className="btn btn-primary"
            style={{ width: 'fit-content' }}
            onClick={adPricingHook.savePrices}
            disabled={adPricingHook.saving || adPricingHook.loading}
          >
            {adPricingHook.saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      )}

      {/* Sub-tab: Stories */}
      {settingsSubTab === 'stories' && (
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '32px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', maxWidth: '600px' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Preços para Stories</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
            Defina os valores cobrados por dia para **cada story publicado**. Os canais de stories são gratuitos.
          </p>

          {adPricingHook.loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Carregando preços...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div className="form-group">
                <label>Preço Nacional (R$ / dia por story)</label>
                <input
                  type="number"
                  className="input-field"
                  value={adPricingHook.prices.story.national}
                  onChange={(e) => adPricingHook.updatePrice('story', 'national', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label>Preço Estadual (R$ / dia por story)</label>
                <input
                  type="number"
                  className="input-field"
                  value={adPricingHook.prices.story.state}
                  onChange={(e) => adPricingHook.updatePrice('story', 'state', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label>Preço Municipal (R$ / dia por story)</label>
                <input
                  type="number"
                  className="input-field"
                  value={adPricingHook.prices.story.city}
                  onChange={(e) => adPricingHook.updatePrice('story', 'city', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label>Prazo para Pagamento (dias)</label>
                <input
                  type="number"
                  className="input-field"
                  value={adPricingHook.prices.story.payment_term_days}
                  onChange={(e) => adPricingHook.updatePrice('story', 'payment_term_days' as any, parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          )}

          <button
            className="btn btn-primary"
            style={{ width: 'fit-content' }}
            onClick={adPricingHook.savePrices}
            disabled={adPricingHook.saving || adPricingHook.loading}
          >
            {adPricingHook.saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      )}

      {/* Sub-tab: Contracts */}
      {settingsSubTab === 'contracts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', width: '100%' }}>
            <div style={{ flex: 1, minWidth: '300px', backgroundColor: 'var(--bg-card)', padding: '32px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Configurações de Contratos</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
                Defina o valor padrão/taxa base para a formalização e fechamento de contratos no aplicativo.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                <div className="form-group">
                  <label>Valor Padrão do Contrato (R$)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={adPricingHook.prices.contract.global}
                    onChange={(e) => adPricingHook.updatePrice('contract', 'global', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <button
                className="btn btn-primary"
                style={{ width: 'fit-content' }}
                onClick={adPricingHook.savePrices}
                disabled={adPricingHook.saving || adPricingHook.loading}
              >
                {adPricingHook.saving ? 'Salvando...' : 'Salvar Valor Padrão'}
              </button>
            </div>

            <div style={{ flex: 1, minWidth: '300px', backgroundColor: 'var(--bg-card)', padding: '32px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Modelo do Contrato</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
                  Visualize e altere o texto base do modelo de contrato utilizado na plataforma pelos usuários.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setSelectedLangTab('pt');
                  setTempTemplateText(templatePt || contractTemplate);
                  setIsTemplateModalOpen(true);
                }}
                style={{ width: 'fit-content' }}
              >
                Visualizar e Alterar Modelo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab: Admins */}
      {settingsSubTab === 'admins' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="filters-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '250px' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input-field"
                  placeholder="Buscar administrador..."
                  value={adminUsersHook.search}
                  onChange={(e) => {
                    adminUsersHook.setSearch(e.target.value);
                    adminUsersHook.setPage(1);
                  }}
                  style={{ paddingLeft: '38px', width: '100%' }}
                />
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setNewAdminUsername('');
                setNewAdminPassword('');
                setNewAdminConfirmPassword('');
                setIsAdminModalOpen(true);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={16} /> Novo Administrador
            </button>
          </div>

          <div className="table-container">
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Usuário</th>
                    <th>Data de Criação</th>
                    <th style={{ textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsersHook.loading ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        Carregando administradores...
                      </td>
                    </tr>
                  ) : adminUsersHook.adminUsers.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        Nenhum administrador encontrado.
                      </td>
                    </tr>
                  ) : (
                    adminUsersHook.adminUsers.map((admin: any) => (
                      <tr key={admin.id}>
                        <td>
                          <span style={{ fontWeight: 600 }}>{admin.username}</span>
                          {admin.username === adminUsername && (
                            <span className="badge badge-success" style={{ marginLeft: '8px', fontSize: '10px' }}>Você</span>
                          )}
                        </td>
                        <td>
                          {new Date(admin.created_at).toLocaleDateString('pt-BR')} às {new Date(admin.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setSelectedAdminId(admin.id);
                                setSelectedAdminUsername(admin.username);
                                setEditAdminPassword('');
                                setEditAdminConfirmPassword('');
                                setIsAdminPasswordModalOpen(true);
                              }}
                              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px' }}
                              title="Alterar Senha"
                            >
                              <Key size={14} /> Alterar Senha
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleDeleteAdminClick(admin)}
                              disabled={admin.username === adminUsername}
                              style={{
                                color: admin.username === adminUsername ? 'var(--text-muted)' : 'var(--danger)',
                                opacity: admin.username === adminUsername ? 0.5 : 1,
                                cursor: admin.username === adminUsername ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '6px'
                              }}
                              title={admin.username === adminUsername ? "Você não pode excluir a si mesmo" : "Excluir Administrador"}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {adminUsersHook.totalCount > 0 && (
              <div className="pagination">
                <div className="pagination-info">
                  Total: {adminUsersHook.totalCount} administradores
                </div>
                <div className="pagination-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={adminUsersHook.page === 1}
                    onClick={() => adminUsersHook.setPage((p: number) => p - 1)}
                  >
                    Anterior
                  </button>
                  <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center' }}>
                    Página {adminUsersHook.page}
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={adminUsersHook.adminUsers.length < 20}
                    onClick={() => adminUsersHook.setPage((p: number) => p + 1)}
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
