/* eslint-disable complexity, @next/next/no-img-element */
import React, { useState } from 'react';
import {
  Search,
  Building2,
  Star,
  Eye,
  Ban,
  Unlock,
  MapPin,
  Calendar,
  DollarSign,
  ExternalLink,
  Copy,
  Check,
  X,
  FileText,
  ShieldAlert,
  Layers,
  Globe
} from 'lucide-react';
import { useEnterprises } from '../../../hooks/useEnterprises';
import { useToast } from '../../../hooks/useToast';
import { EnterpriseWithDetails } from '../../../services/enterprisesService';

const ESTADOS_BRASIL = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' }
];

export const StoresTab: React.FC = () => {
  const { success } = useToast();
  const enterprisesHook = useEnterprises();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [blockReasonInput, setBlockReasonInput] = useState('');
  const [blockReasonError, setBlockReasonError] = useState('');
  const [detailsTab, setDetailsTab] = useState<'cadastral' | 'addresses' | 'subscriptions'>('cadastral');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    success('ID copiado para a área de transferência!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatCurrency = (amountInCentavos: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format((amountInCentavos || 0) / 100);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="badge badge-success" style={{ backgroundColor: '#10b981', color: 'white' }}>Ativa</span>;
      case 'PENDING_PAYMENT':
        return <span className="badge badge-warning" style={{ backgroundColor: '#f59e0b', color: 'white' }}>Aguardando Pagamento</span>;
      case 'EXPIRED':
        return <span className="badge badge-danger" style={{ backgroundColor: '#ef4444', color: 'white' }}>Expirada</span>;
      case 'BLOCKED':
        return <span className="badge" style={{ backgroundColor: '#18181b', color: '#f43f5e', border: '1px solid #f43f5e' }}>Bloqueada</span>;
      case 'DRAFT':
      default:
        return <span className="badge badge-secondary" style={{ backgroundColor: '#6b7280', color: 'white' }}>Rascunho</span>;
    }
  };

  const getTierBadge = (tier: string) => {
    if (tier === 'PREMIUM') {
      return (
        <span
          className="badge"
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)'
          }}
        >
          <Star size={12} fill="white" /> PREMIUM
        </span>
      );
    }
    return (
      <span
        className="badge"
        style={{
          backgroundColor: '#3b82f6',
          color: 'white',
          fontWeight: 600
        }}
      >
        LITE
      </span>
    );
  };

  const handleConfirmBlock = async () => {
    if (!blockReasonInput || blockReasonInput.trim().length < 10) {
      setBlockReasonError('O motivo do bloqueio é obrigatório e deve ter no mínimo 10 caracteres.');
      return;
    }
    if (enterprisesHook.blockingEnterprise) {
      await enterprisesHook.blockEnterprise(enterprisesHook.blockingEnterprise.id, blockReasonInput);
      setBlockReasonInput('');
      setBlockReasonError('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header & Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={28} style={{ color: 'var(--primary)' }} />
            Gestão de Empresas e Moderação
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Monitore, audite e modere estabelecimentos comerciais cadastrados na plataforma.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div
        className="filters-bar"
        style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center',
          backgroundColor: 'var(--bg-card)',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)'
        }}
      >
        {/* Search Field */}
        <div style={{ position: 'relative', flex: 2, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Buscar por Nome, Razão Social, CNPJ ou E-mail..."
            value={enterprisesHook.search}
            onChange={(e) => {
              enterprisesHook.setSearch(e.target.value);
              enterprisesHook.setPage(1);
            }}
            style={{ paddingLeft: '38px', width: '100%' }}
          />
        </div>

        {/* Status Filter */}
        <div style={{ flex: 1, minWidth: '160px' }}>
          <select
            className="select-field"
            value={enterprisesHook.statusFilter || ''}
            onChange={(e) => {
              enterprisesHook.setStatusFilter(e.target.value || null);
              enterprisesHook.setPage(1);
            }}
            style={{ width: '100%' }}
          >
            <option value="">Status: Todos</option>
            <option value="ACTIVE">Ativa (ACTIVE)</option>
            <option value="PENDING_PAYMENT">Aguardando Pagamento</option>
            <option value="DRAFT">Rascunho (DRAFT)</option>
            <option value="EXPIRED">Expirada (EXPIRED)</option>
            <option value="BLOCKED">Bloqueada (BLOCKED)</option>
          </select>
        </div>

        {/* Tier Filter */}
        <div style={{ flex: 1, minWidth: '140px' }}>
          <select
            className="select-field"
            value={enterprisesHook.tierFilter || ''}
            onChange={(e) => {
              enterprisesHook.setTierFilter(e.target.value || null);
              enterprisesHook.setPage(1);
            }}
            style={{ width: '100%' }}
          >
            <option value="">Plano: Todos</option>
            <option value="LITE">Plano LITE</option>
            <option value="PREMIUM">Plano PREMIUM</option>
          </select>
        </div>

        {/* State Filter */}
        <div style={{ flex: 1, minWidth: '120px' }}>
          <select
            className="select-field"
            value={enterprisesHook.stateFilter || ''}
            onChange={(e) => {
              enterprisesHook.setStateFilter(e.target.value || null);
              enterprisesHook.setPage(1);
            }}
            style={{ width: '100%' }}
          >
            <option value="">Estado: Todos</option>
            {ESTADOS_BRASIL.map(est => (
              <option key={est.value} value={est.value}>{est.value} - {est.label}</option>
            ))}
          </select>
        </div>

        {/* City Filter Input */}
        <div style={{ flex: 1, minWidth: '140px' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Cidade..."
            value={enterprisesHook.cityFilter || ''}
            onChange={(e) => {
              enterprisesHook.setCityFilter(e.target.value || null);
              enterprisesHook.setPage(1);
            }}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Table of Enterprises */}
      <div className="table-container">
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Logo</th>
                <th>Nome Fantasia</th>
                <th>Plano (Tier)</th>
                <th>Endereço</th>
                <th>Status</th>
                <th>Validade Assinatura</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {enterprisesHook.loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    Carregando empresas...
                  </td>
                </tr>
              ) : enterprisesHook.enterprises.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    Nenhum estabelecimento comercial encontrado.
                  </td>
                </tr>
              ) : (
                enterprisesHook.enterprises.map((ent: EnterpriseWithDetails) => {
                  const addresses = ent.enterprise_addresses || [];
                  const latestSub = (ent.enterprise_subscriptions || [])[0];
                  const expiresAtStr = latestSub?.expires_at
                    ? new Date(latestSub.expires_at).toLocaleDateString('pt-BR')
                    : '-';

                  const firstAddr = addresses[0];
                  const cityText = firstAddr ? [firstAddr.city, firstAddr.state].filter(Boolean).join(' - ') : null;
                  const extraCount = addresses.length - 1;

                  return (
                    <tr key={ent.id}>
                      {/* Logo */}
                      <td>
                        {ent.logo_url ? (
                          <img
                            src={ent.logo_url}
                            alt={ent.nome_fantasia}
                            style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-light)' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '8px',
                              backgroundColor: 'var(--primary)',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '15px'
                            }}
                          >
                            {(ent.nome_fantasia || '?')[0].toUpperCase()}
                          </div>
                        )}
                      </td>

                      {/* Nome Fantasia */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, fontSize: '14px' }}>{ent.nome_fantasia}</span>
                          {ent.cnpj && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>CNPJ: {ent.cnpj}</span>}
                        </div>
                      </td>

                      {/* Plano Tier */}
                      <td>{getTierBadge(ent.tier)}</td>

                      {/* Endereço / Cidade */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                            {cityText || 'Cidade não informada'}
                          </span>
                          {extraCount > 0 && (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '18px' }}>
                              +{extraCount} {extraCount === 1 ? 'outra filial' : 'outras filiais'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td>{getStatusBadge(ent.status)}</td>

                      {/* Validade */}
                      <td>
                        <span style={{ fontSize: '13px', color: expiresAtStr === '-' ? 'var(--text-muted)' : 'inherit' }}>
                          {expiresAtStr}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            title="Ver Detalhes e Auditoria"
                            onClick={() => {
                              enterprisesHook.loadEnterpriseDetails(ent.id);
                              setDetailsTab('cadastral');
                            }}
                            style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Eye size={14} />
                          </button>

                          {ent.status === 'BLOCKED' ? (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              title="Desbloquear Empresa"
                              onClick={() => enterprisesHook.setUnblockingEnterprise(ent)}
                              style={{ padding: '6px 10px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Unlock size={14} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              title="Bloquear Empresa"
                              onClick={() => {
                                enterprisesHook.setBlockingEnterprise(ent);
                                setBlockReasonInput('');
                                setBlockReasonError('');
                              }}
                              style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Ban size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {enterprisesHook.totalCount > 0 && (
          <div className="pagination" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
            <div className="pagination-info" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Exibindo {(enterprisesHook.page - 1) * enterprisesHook.pageSize + 1} - {Math.min(enterprisesHook.page * enterprisesHook.pageSize, enterprisesHook.totalCount)} de {enterprisesHook.totalCount} estabelecimentos
            </div>
            <div className="pagination-actions" style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={enterprisesHook.page === 1}
                onClick={() => enterprisesHook.setPage(p => p - 1)}
              >
                Anterior
              </button>
              <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                Página {enterprisesHook.page}
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={enterprisesHook.page * enterprisesHook.pageSize >= enterprisesHook.totalCount}
                onClick={() => enterprisesHook.setPage(p => p + 1)}
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal 1: Bloquear Empresa */}
      {enterprisesHook.blockingEnterprise && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '28px', borderRadius: 'var(--radius-md)', maxWidth: '540px', width: '100%', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Ban size={22} /> Bloquear Estabelecimento Commercial
              </h3>
              <button type="button" onClick={() => enterprisesHook.setBlockingEnterprise(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '14px', marginBottom: '16px', color: 'var(--text-muted)' }}>
              Você está prestes a bloquear o anúncio de <strong>{enterprisesHook.blockingEnterprise.nome_fantasia}</strong>. O estabelecimento deixará de ser visível imediatamente na busca e feed público do aplicativo.
            </p>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', display: 'block' }}>
                Motivo do Bloqueio * (mínimo 10 caracteres):
              </label>
              <textarea
                className="input-field"
                rows={4}
                placeholder="Descreva o motivo detalhado para auditoria e notificação ao anunciante..."
                value={blockReasonInput}
                onChange={(e) => {
                  setBlockReasonInput(e.target.value);
                  if (e.target.value.trim().length >= 10) setBlockReasonError('');
                }}
                style={{ width: '100%', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                {blockReasonError && <span style={{ fontSize: '12px', color: 'var(--danger)' }}>{blockReasonError}</span>}
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                  {blockReasonInput.length}/500 caracteres
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => enterprisesHook.setBlockingEnterprise(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmBlock}
                style={{ backgroundColor: '#ef4444', color: 'white' }}
              >
                Confirmar Bloqueio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Desbloquear Empresa */}
      {enterprisesHook.unblockingEnterprise && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '28px', borderRadius: 'var(--radius-md)', maxWidth: '480px', width: '100%', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Unlock size={22} /> Reativar Estabelecimento
              </h3>
              <button type="button" onClick={() => enterprisesHook.setUnblockingEnterprise(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '14px', marginBottom: '20px', color: 'var(--text-muted)' }}>
              Deseja reativar o anúncio do estabelecimento <strong>{enterprisesHook.unblockingEnterprise.nome_fantasia}</strong>?
              <br /><br />
              O sistema irá restaurar o status de acordo com o prazo da última assinatura em vigor.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => enterprisesHook.setUnblockingEnterprise(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => enterprisesHook.unblockEnterprise(enterprisesHook.unblockingEnterprise!.id)}
                style={{ backgroundColor: '#10b981', border: 'none', color: 'white' }}
              >
                Confirmar Reativação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Details & Audit Drawer / Modal */}
      {enterprisesHook.selectedEnterprise && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-md)', maxWidth: '750px', width: '100%', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column' }}>
            
            {/* Header */}
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 700 }}>{enterprisesHook.selectedEnterprise.nome_fantasia}</h3>
                  {getTierBadge(enterprisesHook.selectedEnterprise.tier)}
                  {getStatusBadge(enterprisesHook.selectedEnterprise.status)}
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  ID: {enterprisesHook.selectedEnterprise.id}
                </p>
              </div>
              <button type="button" onClick={() => enterprisesHook.setSelectedEnterprise(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={24} />
              </button>
            </div>

            {/* Inner Sub-tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', padding: '0 24px', backgroundColor: 'var(--bg-app)' }}>
              <button
                type="button"
                onClick={() => setDetailsTab('cadastral')}
                style={{
                  padding: '12px 16px',
                  fontWeight: 600,
                  fontSize: '13px',
                  border: 'none',
                  background: 'none',
                  borderBottom: detailsTab === 'cadastral' ? '2px solid var(--primary)' : '2px solid transparent',
                  color: detailsTab === 'cadastral' ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                Dados Cadastrais & Mídia
              </button>
              <button
                type="button"
                onClick={() => setDetailsTab('addresses')}
                style={{
                  padding: '12px 16px',
                  fontWeight: 600,
                  fontSize: '13px',
                  border: 'none',
                  background: 'none',
                  borderBottom: detailsTab === 'addresses' ? '2px solid var(--primary)' : '2px solid transparent',
                  color: detailsTab === 'addresses' ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                Filiais & Endereços ({(enterprisesHook.selectedEnterprise.enterprise_addresses || []).length})
              </button>
              <button
                type="button"
                onClick={() => setDetailsTab('subscriptions')}
                style={{
                  padding: '12px 16px',
                  fontWeight: 600,
                  fontSize: '13px',
                  border: 'none',
                  background: 'none',
                  borderBottom: detailsTab === 'subscriptions' ? '2px solid var(--primary)' : '2px solid transparent',
                  color: detailsTab === 'subscriptions' ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                Histórico Stripe ({(enterprisesHook.selectedEnterprise.enterprise_subscriptions || []).length})
              </button>
            </div>

            {/* Tab 1: Cadastral */}
            {detailsTab === 'cadastral' && (
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Banner & Logo */}
                {enterprisesHook.selectedEnterprise.banner_url && (
                  <div style={{ width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                    <img src={enterprisesHook.selectedEnterprise.banner_url} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}

                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                  {enterprisesHook.selectedEnterprise.logo_url && (
                    <img
                      src={enterprisesHook.selectedEnterprise.logo_url}
                      alt="Logo"
                      style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--border-light)' }}
                    />
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flex: 1 }}>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Razão Social</span>
                      <strong style={{ fontSize: '14px' }}>{enterprisesHook.selectedEnterprise.razao_social || 'Não informada'}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>CNPJ</span>
                      <strong style={{ fontSize: '14px' }}>{enterprisesHook.selectedEnterprise.cnpj || 'Não informado'}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Proprietário (User ID)</span>
                      <span style={{ fontSize: '13px' }}>{enterprisesHook.selectedEnterprise.owner_email || enterprisesHook.selectedEnterprise.user_id}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Categoria</span>
                      <span style={{ fontSize: '13px' }}>{enterprisesHook.selectedEnterprise.category || 'Geral'}</span>
                    </div>
                  </div>
                </div>

                {enterprisesHook.selectedEnterprise.description && (
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Descrição Completa</span>
                    <p style={{ fontSize: '13px', backgroundColor: 'var(--bg-app)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                      {enterprisesHook.selectedEnterprise.description}
                    </p>
                  </div>
                )}

                {/* Contacts & Social links */}
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
                  {enterprisesHook.selectedEnterprise.whatsapp && (
                    <a
                      href={`https://wa.me/55${enterprisesHook.selectedEnterprise.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <ExternalLink size={14} /> WhatsApp ({enterprisesHook.selectedEnterprise.whatsapp})
                    </a>
                  )}
                  {enterprisesHook.selectedEnterprise.instagram && (
                    <a
                      href={`https://instagram.com/${enterprisesHook.selectedEnterprise.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <ExternalLink size={14} /> Instagram (@{enterprisesHook.selectedEnterprise.instagram.replace('@', '')})
                    </a>
                  )}
                  {enterprisesHook.selectedEnterprise.website && (
                    <a
                      href={enterprisesHook.selectedEnterprise.website.startsWith('http') ? enterprisesHook.selectedEnterprise.website : `https://${enterprisesHook.selectedEnterprise.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Globe size={14} /> Website
                    </a>
                  )}
                </div>

                {/* Blocked Reason callout if present */}
                {enterprisesHook.selectedEnterprise.blocked_reason && (
                  <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '14px', borderRadius: '8px' }}>
                    <span style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldAlert size={16} /> Motivo do Bloqueio Registrado:
                    </span>
                    <p style={{ fontSize: '13px', marginTop: '4px', color: 'var(--text-main)' }}>
                      {enterprisesHook.selectedEnterprise.blocked_reason}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Addresses */}
            {detailsTab === 'addresses' && (
              <div style={{ padding: '24px' }}>
                {(enterprisesHook.selectedEnterprise.enterprise_addresses || []).length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Nenhum endereço/filial cadastrado.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(enterprisesHook.selectedEnterprise.enterprise_addresses || []).map((addr, idx) => (
                      <div
                        key={addr.id || idx}
                        style={{
                          backgroundColor: 'var(--bg-app)',
                          padding: '14px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-light)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={16} style={{ color: 'var(--primary)' }} />
                            Filial #{idx + 1}: {addr.city} / {addr.state}
                          </strong>
                          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {addr.street}, {addr.number || 'S/N'} {addr.complement ? `- ${addr.complement}` : ''} ({addr.district || 'Bairro N/I'})
                          </p>
                          {addr.zip_code && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>CEP: {addr.zip_code}</span>}
                        </div>
                        {addr.latitude && addr.longitude && (
                          <span style={{ fontSize: '11px', backgroundColor: 'var(--bg-card)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
                            Lat: {addr.latitude}, Lng: {addr.longitude}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Subscriptions */}
            {detailsTab === 'subscriptions' && (
              <div style={{ padding: '24px' }}>
                {(enterprisesHook.selectedEnterprise.enterprise_subscriptions || []).length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Nenhuma transação de assinatura registrada.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {(enterprisesHook.selectedEnterprise.enterprise_subscriptions || []).map((sub, idx) => (
                      <div
                        key={sub.id || idx}
                        style={{
                          backgroundColor: 'var(--bg-app)',
                          padding: '16px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-light)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--success)' }}>
                            {formatCurrency(sub.amount_paid)}
                          </span>
                          <span className="badge badge-success" style={{ textTransform: 'uppercase', fontSize: '10px' }}>
                            {sub.status || 'succeeded'}
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Stripe Intent ID:</span>
                            <br />
                            <code style={{ fontSize: '11px' }}>{sub.stripe_intent_id || 'manual_admin'}</code>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Vigência:</span>
                            <br />
                            <strong>{new Date(sub.starts_at).toLocaleDateString('pt-BR')} até {new Date(sub.expires_at).toLocaleDateString('pt-BR')}</strong>
                          </div>
                        </div>

                        {sub.billing_breakdown && (
                          <div style={{ marginTop: '8px', backgroundColor: 'var(--bg-card)', padding: '10px', borderRadius: '6px', fontSize: '11px', border: '1px solid var(--border-light)' }}>
                            <strong style={{ display: 'block', marginBottom: '4px' }}>Breakdown de Cobrança (JSON):</strong>
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                              {JSON.stringify(sub.billing_breakdown, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', backgroundColor: 'var(--bg-app)' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => enterprisesHook.setSelectedEnterprise(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
