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
  Globe,
  Phone,
  Mail,
  MessageCircle,
  Image as ImageIcon,
  AlertTriangle,
  Send,
  User,
  ShieldCheck
} from 'lucide-react';

const InstagramIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);
import { useEnterprises } from '../../../hooks/useEnterprises';
import { useToast } from '../../../hooks/useToast';
import { EnterpriseWithDetails } from '../../../services/enterprisesService';
import { VerificationBadgeAdmin } from '../../users/VerificationBadgeAdmin';

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

const maskCNPJ = (cnpj?: string | null) => {
  if (!cnpj) return '';
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length !== 14) return cnpj;
  return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
};

export const StoresTab: React.FC = () => {
  const { success } = useToast();
  const enterprisesHook = useEnterprises();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [blockReasonInput, setBlockReasonInput] = useState('');
  const [blockReasonError, setBlockReasonError] = useState('');
  const [detailsTab, setDetailsTab] = useState<'overview' | 'addresses' | 'subscriptions' | 'moderation'>('overview');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
        return <span className="badge badge-success" style={{ backgroundColor: '#10b981', color: 'white', fontWeight: 600 }}>Ativa</span>;
      case 'PENDING_PAYMENT':
        return <span className="badge badge-warning" style={{ backgroundColor: '#f59e0b', color: 'white', fontWeight: 600 }}>Aguardando Pagamento</span>;
      case 'EXPIRED':
        return <span className="badge badge-danger" style={{ backgroundColor: '#ef4444', color: 'white', fontWeight: 600 }}>Expirada</span>;
      case 'BLOCKED':
        return <span className="badge" style={{ backgroundColor: '#18181b', color: '#f43f5e', border: '1px solid #f43f5e', fontWeight: 700 }}>Bloqueada</span>;
      case 'DRAFT':
      default:
        return <span className="badge badge-secondary" style={{ backgroundColor: '#6b7280', color: 'white', fontWeight: 600 }}>Rascunho</span>;
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

                  // Sort subscriptions by expires_at descending to obtain the latest active validity period
                  const sortedSubs = (ent.enterprise_subscriptions || []).slice().sort((a, b) => {
                    const dateA = a.expires_at ? new Date(a.expires_at).getTime() : 0;
                    const dateB = b.expires_at ? new Date(b.expires_at).getTime() : 0;
                    return dateB - dateA;
                  });

                  const latestSub = sortedSubs[0];
                  // Expiration resolution order:
                  // 1. Direct expires_at on enterprises record
                  // 2. Latest subscription's expires_at
                  // 3. ACTIVE store fallback (1 year after created_at)
                  const rawExpiresAt = ent.expires_at || latestSub?.expires_at;

                  let expiresAtDate: Date | null = null;
                  if (rawExpiresAt) {
                    expiresAtDate = new Date(rawExpiresAt);
                  } else if (ent.status === 'ACTIVE' && ent.created_at) {
                    const createdAtMs = new Date(ent.created_at).getTime();
                    if (!isNaN(createdAtMs)) {
                      expiresAtDate = new Date(createdAtMs + 365 * 24 * 60 * 60 * 1000);
                    }
                  }

                  const isExpired = expiresAtDate ? expiresAtDate.getTime() < Date.now() : false;
                  const expiresAtStr = expiresAtDate && !isNaN(expiresAtDate.getTime())
                    ? expiresAtDate.toLocaleDateString('pt-BR')
                    : '-';

                  const firstAddr = addresses[0];
                  const cityText = firstAddr ? [firstAddr.city, firstAddr.state].filter(Boolean).join(' - ') : null;
                  const extraCount = addresses.length - 1;

                  return (
                    <tr
                      key={ent.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        enterprisesHook.loadEnterpriseDetails(ent.id);
                        setDetailsTab('overview');
                      }}
                    >
                      {/* Logo */}
                      <td>
                        {ent.logo_url ? (
                          <img
                            src={ent.logo_url}
                            alt={ent.nome_fantasia}
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '10px',
                              objectFit: 'contain',
                              backgroundColor: '#ffffff',
                              padding: '2px',
                              border: '1px solid var(--border-light)',
                              boxShadow: 'var(--shadow-sm)'
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '10px',
                              background: 'linear-gradient(135deg, var(--primary) 0%, #b91c1c 100%)',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '16px',
                              boxShadow: 'var(--shadow-sm)'
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
                          {ent.cnpj && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>CNPJ: {maskCNPJ(ent.cnpj)}</span>}
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
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: expiresAtStr !== '-' ? 600 : 400,
                            color: isExpired && ent.status !== 'BLOCKED'
                              ? '#ef4444'
                              : expiresAtStr === '-'
                              ? 'var(--text-muted)'
                              : 'inherit'
                          }}
                          title={isExpired && ent.status !== 'BLOCKED' ? 'Assinatura expirada' : undefined}
                        >
                          {expiresAtStr}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          {ent.status === 'BLOCKED' ? (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              title="Desbloquear Empresa"
                              onClick={(e) => {
                                e.stopPropagation();
                                enterprisesHook.setUnblockingEnterprise(ent);
                              }}
                              style={{ padding: '6px 10px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Unlock size={14} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              title="Bloquear Empresa"
                              onClick={(e) => {
                                e.stopPropagation();
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
                <Ban size={22} /> Bloquear Estabelecimento Comercial
              </h3>
              <button type="button" onClick={() => enterprisesHook.setBlockingEnterprise(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '14px', marginBottom: '16px', color: 'var(--text-muted)' }}>
              Você está prestes a bloquear o anúncio de <strong>{enterprisesHook.blockingEnterprise.nome_fantasia}</strong>. O estabelecimento deixará de ser visível no aplicativo e uma <strong>notificação in-app</strong> será enviada ao proprietário.
            </p>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', display: 'block' }}>
                Motivo do Bloqueio * (mínimo 10 caracteres):
              </label>
              <textarea
                className="input-field"
                rows={4}
                placeholder="Descreva a justificativa para auditoria e envio via notificação in-app ao anunciante..."
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

            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px 12px', borderRadius: '6px', fontSize: '12px', color: 'var(--text-main)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Send size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} />
              <span>Esta justificativa ficará gravada no registro da empresa e será enviada diretamente à central de notificações do aplicativo do anunciante.</span>
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
                Confirmar Bloqueio & Notificar
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
              O sistema irá restaurar o status com base na vigência da última assinatura e notificará o anunciante no app mobile.
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

      {/* Modal 3: Refactored Store Details & Audit Drawer / Modal (Mobile-inspired Layout) */}
      {enterprisesHook.selectedEnterprise && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', maxWidth: '840px', width: '100%', maxHeight: '92vh', overflowY: 'auto', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            
            {/* Header Toolbar */}
            <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Building2 size={20} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  Detalhes do Estabelecimento
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {getTierBadge(enterprisesHook.selectedEnterprise.tier)}
                {getStatusBadge(enterprisesHook.selectedEnterprise.status)}
                <button
                  type="button"
                  onClick={() => copyToClipboard(enterprisesHook.selectedEnterprise!.id)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {copiedId === enterprisesHook.selectedEnterprise.id ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                  <span>{copiedId === enterprisesHook.selectedEnterprise.id ? 'Copiado!' : 'ID Loja'}</span>
                </button>
                <button type="button" onClick={() => enterprisesHook.setSelectedEnterprise(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Store Header Info Card (Logo & Store Name Aligned Side-by-Side) */}
            <div style={{ padding: '20px 24px', backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                
                {/* High Visibility Logo Container (Side-by-Side with Store Name) */}
                <div
                  className="logo-hover-container"
                  title={enterprisesHook.selectedEnterprise.logo_url ? "Clique para expandir a logo em alta resolução" : "Logo do Estabelecimento"}
                  onClick={() => {
                    if (enterprisesHook.selectedEnterprise?.logo_url) {
                      setSelectedImage(enterprisesHook.selectedEnterprise.logo_url);
                    }
                  }}
                  style={{
                    position: 'relative',
                    width: '84px',
                    height: '84px',
                    borderRadius: '14px',
                    backgroundColor: '#ffffff',
                    border: '2px solid var(--border-light)',
                    boxShadow: 'var(--shadow-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    cursor: enterprisesHook.selectedEnterprise.logo_url ? 'pointer' : 'default',
                    flexShrink: 0
                  }}
                >
                  {enterprisesHook.selectedEnterprise.logo_url ? (
                    <>
                      <img
                        src={enterprisesHook.selectedEnterprise.logo_url}
                        alt={`Logo ${enterprisesHook.selectedEnterprise.nome_fantasia}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          padding: '6px',
                          backgroundColor: '#ffffff',
                          borderRadius: '10px'
                        }}
                      />
                      {/* Hover Overlay Hint for expanding logo */}
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: 'rgba(0,0,0,0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          opacity: 0,
                          transition: 'opacity 0.2s ease',
                          borderRadius: '10px'
                        }}
                        className="logo-hover-overlay"
                      >
                        <Eye size={22} />
                      </div>
                    </>
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, var(--primary) 0%, #b91c1c 100%)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '32px',
                        borderRadius: '10px'
                      }}
                    >
                      {(enterprisesHook.selectedEnterprise.nome_fantasia || '?')[0].toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Store Name, Category & CNPJ (Cleanly Aligned Side-by-Side) */}
                <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <h4 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-main)', lineHeight: '1.2' }}>
                    {enterprisesHook.selectedEnterprise.nome_fantasia}
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{enterprisesHook.selectedEnterprise.category || 'Categoria Geral'}</span>
                    {enterprisesHook.selectedEnterprise.cnpj && (
                      <span>• CNPJ: <strong>{maskCNPJ(enterprisesHook.selectedEnterprise.cnpj)}</strong></span>
                    )}
                    {enterprisesHook.selectedEnterprise.razao_social && (
                      <span>• Razão Social: <strong>{enterprisesHook.selectedEnterprise.razao_social}</strong></span>
                    )}
                  </p>
                </div>

              </div>
            </div>

            {/* Hero Cover/Banner Preview (If present) */}
            {enterprisesHook.selectedEnterprise.banner_url && (
              <div style={{ position: 'relative', width: '100%', height: '160px', backgroundColor: '#0f172a', overflow: 'hidden' }}>
                <img
                  src={enterprisesHook.selectedEnterprise.banner_url}
                  alt="Cover Banner"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}

            {/* Moderation Alert Banner (If Blocked) */}
            {enterprisesHook.selectedEnterprise.status === 'BLOCKED' && (
              <div style={{ backgroundColor: '#fee2e2', borderBottom: '1px solid #fca5a5', padding: '14px 24px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <ShieldAlert size={22} style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: '#991b1b', fontSize: '14px' }}>ESTABELECIMENTO BLOQUEADO NA PLATAFORMA</strong>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => enterprisesHook.setUnblockingEnterprise(enterprisesHook.selectedEnterprise)}
                      style={{ backgroundColor: 'white', color: '#10b981', borderColor: '#10b981', fontWeight: 600 }}
                    >
                      <Unlock size={14} style={{ marginRight: '4px' }} /> Reativar Loja
                    </button>
                  </div>
                  <p style={{ fontSize: '13px', color: '#7f1d1d', marginTop: '6px', margin: 0, lineHeight: '1.4' }}>
                    <strong>Justificativa enviada ao proprietário via notificação:</strong> &quot;{enterprisesHook.selectedEnterprise.blocked_reason || 'Motivo não especificado.'}&quot;
                  </p>
                </div>
              </div>
            )}

            {/* Inner Sub-tabs Bar */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', padding: '0 24px', backgroundColor: 'var(--bg-app)', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setDetailsTab('overview')}
                style={{
                  padding: '14px 18px',
                  fontWeight: 600,
                  fontSize: '13px',
                  border: 'none',
                  background: 'none',
                  borderBottom: detailsTab === 'overview' ? '3px solid var(--primary)' : '3px solid transparent',
                  color: detailsTab === 'overview' ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Building2 size={16} /> Visão Geral & Mídia
              </button>
              <button
                type="button"
                onClick={() => setDetailsTab('addresses')}
                style={{
                  padding: '14px 18px',
                  fontWeight: 600,
                  fontSize: '13px',
                  border: 'none',
                  background: 'none',
                  borderBottom: detailsTab === 'addresses' ? '3px solid var(--primary)' : '3px solid transparent',
                  color: detailsTab === 'addresses' ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <MapPin size={16} /> Filiais & Endereços ({(enterprisesHook.selectedEnterprise.enterprise_addresses || []).length})
              </button>
              <button
                type="button"
                onClick={() => setDetailsTab('subscriptions')}
                style={{
                  padding: '14px 18px',
                  fontWeight: 600,
                  fontSize: '13px',
                  border: 'none',
                  background: 'none',
                  borderBottom: detailsTab === 'subscriptions' ? '3px solid var(--primary)' : '3px solid transparent',
                  color: detailsTab === 'subscriptions' ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <DollarSign size={16} /> Histórico Stripe ({(enterprisesHook.selectedEnterprise.enterprise_subscriptions || []).length})
              </button>
              <button
                type="button"
                onClick={() => setDetailsTab('moderation')}
                style={{
                  padding: '14px 18px',
                  fontWeight: 600,
                  fontSize: '13px',
                  border: 'none',
                  background: 'none',
                  borderBottom: detailsTab === 'moderation' ? '3px solid var(--primary)' : '3px solid transparent',
                  color: detailsTab === 'moderation' ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ShieldAlert size={16} /> Moderação & Notificações
              </button>
            </div>

            {/* Tab Body Content */}
            <div style={{ padding: '24px', flex: 1 }}>
              
              {/* TAB 1: VISÃO GERAL & MÍDIA */}
              {detailsTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Store Quick Actions Toolbar (WhatsApp, Instagram, Website, Email, Phone) */}
                  <div>
                    <h5 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '10px', letterSpacing: '0.5px' }}>
                      Canais de Comunicação Rápidos
                    </h5>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {enterprisesHook.selectedEnterprise.whatsapp && (
                        <a
                          href={`https://wa.me/55${enterprisesHook.selectedEnterprise.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ backgroundColor: '#25D366', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                        >
                          <MessageCircle size={14} /> WhatsApp ({enterprisesHook.selectedEnterprise.whatsapp})
                        </a>
                      )}
                      {enterprisesHook.selectedEnterprise.instagram && (
                        <a
                          href={`https://instagram.com/${enterprisesHook.selectedEnterprise.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                        >
                          <InstagramIcon size={14} /> Instagram (@{enterprisesHook.selectedEnterprise.instagram.replace('@', '')})
                        </a>
                      )}
                      {enterprisesHook.selectedEnterprise.website && (
                        <a
                          href={enterprisesHook.selectedEnterprise.website.startsWith('http') ? enterprisesHook.selectedEnterprise.website : `https://${enterprisesHook.selectedEnterprise.website}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                        >
                          <Globe size={14} /> Website Oficial
                        </a>
                      )}
                      {enterprisesHook.selectedEnterprise.email_fiscal && (
                        <a
                          href={`mailto:${enterprisesHook.selectedEnterprise.email_fiscal}`}
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Mail size={14} /> {enterprisesHook.selectedEnterprise.email_fiscal}
                        </a>
                      )}
                      {enterprisesHook.selectedEnterprise.phone && (
                        <a
                          href={`tel:${enterprisesHook.selectedEnterprise.phone}`}
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Phone size={14} /> {enterprisesHook.selectedEnterprise.phone}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Card Seção Proprietário (Imagem, Nome, Siga Check e Contato) */}
                  <div style={{ backgroundColor: 'var(--bg-app)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                      <User size={18} style={{ color: 'var(--primary)' }} />
                      <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Proprietário do Anúncio</h4>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        {/* Avatar do Proprietário */}
                        <div
                          style={{
                            width: '54px',
                            height: '54px',
                            borderRadius: '50%',
                            backgroundColor: '#ffffff',
                            border: '2px solid var(--border-light)',
                            boxShadow: 'var(--shadow-sm)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            flexShrink: 0
                          }}
                        >
                          {enterprisesHook.selectedEnterprise.owner_avatar_url ? (
                            <img
                              src={enterprisesHook.selectedEnterprise.owner_avatar_url}
                              alt={enterprisesHook.selectedEnterprise.owner_name || 'Proprietário'}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '100%',
                                height: '100%',
                                background: 'linear-gradient(135deg, var(--primary) 0%, #b91c1c 100%)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '20px'
                              }}
                            >
                              {(enterprisesHook.selectedEnterprise.owner_name || enterprisesHook.selectedEnterprise.owner_email || '?')[0].toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Nome, Selo Siga Check e Contatos */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: '15px', color: 'var(--text-main)' }}>
                              {enterprisesHook.selectedEnterprise.owner_name || 'Nome não informado'}
                            </strong>
                            <VerificationBadgeAdmin
                              level={enterprisesHook.selectedEnterprise.owner_verification_level || 'none'}
                              isSuspended={Boolean(enterprisesHook.selectedEnterprise.owner_is_suspended)}
                            />
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                            {enterprisesHook.selectedEnterprise.owner_email && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Mail size={13} /> {enterprisesHook.selectedEnterprise.owner_email}
                              </span>
                            )}
                            {enterprisesHook.selectedEnterprise.owner_phone && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Phone size={13} /> {enterprisesHook.selectedEnterprise.owner_phone}
                              </span>
                            )}
                            <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)' }}>
                              User ID: {enterprisesHook.selectedEnterprise.user_id}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Botão de Contato Direto via WhatsApp */}
                      {enterprisesHook.selectedEnterprise.owner_phone && (
                        <a
                          href={`https://wa.me/55${enterprisesHook.selectedEnterprise.owner_phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ backgroundColor: '#25D366', color: 'white', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                        >
                          <MessageCircle size={14} /> Contatar Anunciante
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Cadastral & Fiscal Card (Espelhando o Card Fiscal do App Mobile) */}
                  <div style={{ backgroundColor: 'var(--bg-app)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                      <Building2 size={18} style={{ color: 'var(--primary)' }} />
                      <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Dados Cadastrais & Fiscais</h4>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Razão Social</span>
                        <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                          {enterprisesHook.selectedEnterprise.razao_social || 'Não informada'}
                        </strong>
                      </div>

                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>
                          {enterprisesHook.selectedEnterprise.is_international ? 'Registro Fiscal (Tax ID)' : 'CNPJ'}
                        </span>
                        <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                          {enterprisesHook.selectedEnterprise.is_international
                            ? enterprisesHook.selectedEnterprise.tax_id || 'Não informado'
                            : maskCNPJ(enterprisesHook.selectedEnterprise.cnpj) || 'Não informado'}
                        </strong>
                      </div>

                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>E-mail Fiscal</span>
                        <span style={{ fontSize: '13px', color: 'var(--text-main)' }}>
                          {enterprisesHook.selectedEnterprise.email_fiscal || 'Não informado'}
                        </span>
                      </div>

                      {enterprisesHook.selectedEnterprise.inscricao_estadual && (
                        <div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Inscrição Estadual</span>
                          <span style={{ fontSize: '13px', fontWeight: 600 }}>{enterprisesHook.selectedEnterprise.inscricao_estadual}</span>
                        </div>
                      )}

                      {enterprisesHook.selectedEnterprise.inscricao_municipal && (
                        <div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Inscrição Municipal</span>
                          <span style={{ fontSize: '13px', fontWeight: 600 }}>{enterprisesHook.selectedEnterprise.inscricao_municipal}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Seção Sobre a Empresa */}
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <FileText size={18} style={{ color: 'var(--primary)' }} />
                      Sobre a Empresa (Descrição)
                    </h4>
                    {enterprisesHook.selectedEnterprise.description ? (
                      <p style={{ fontSize: '14px', lineHeight: '1.6', backgroundColor: 'var(--bg-app)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-light)', margin: 0, color: 'var(--text-main)' }}>
                        {enterprisesHook.selectedEnterprise.description}
                      </p>
                    ) : (
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                        Nenhuma descrição informada pelo anunciante.
                      </p>
                    )}
                  </div>

                  {/* Seção Galeria de Fotos / Mídias */}
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                      <ImageIcon size={18} style={{ color: 'var(--primary)' }} />
                      Galeria de Fotos & Mídias
                    </h4>
                    
                    {(() => {
                      const gallery = enterprisesHook.selectedEnterprise.gallery_urls || [];
                      const imagesToShow = gallery.length > 0
                        ? gallery
                        : [enterprisesHook.selectedEnterprise.banner_url, enterprisesHook.selectedEnterprise.logo_url].filter(Boolean) as string[];

                      if (imagesToShow.length === 0) {
                        return (
                          <div style={{ backgroundColor: 'var(--bg-app)', padding: '24px', borderRadius: '10px', border: '1px dashed var(--border-light)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                            Nenhuma mídia registrada para este estabelecimento.
                          </div>
                        );
                      }

                      return (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                          {imagesToShow.map((imgUrl: string, idx: number) => (
                            <div
                              key={idx}
                              onClick={() => setSelectedImage(imgUrl)}
                              style={{ position: 'relative', width: '100%', height: '110px', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', border: '1px solid var(--border-light)' }}
                            >
                              <img src={imgUrl} alt={`Mídia ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0)', transition: 'background-color 0.2s' }} className="gallery-hover-overlay" />
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                </div>
              )}

              {/* TAB 2: FILIAIS & ENDEREÇOS */}
              {detailsTab === 'addresses' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={20} style={{ color: 'var(--primary)' }} />
                      Endereços e Filiais Cadastradas ({(enterprisesHook.selectedEnterprise.enterprise_addresses || []).length})
                    </h4>
                  </div>

                  {(enterprisesHook.selectedEnterprise.enterprise_addresses || []).length === 0 ? (
                    <div style={{ backgroundColor: 'var(--bg-app)', padding: '30px', borderRadius: '12px', border: '1px dashed var(--border-light)', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Nenhum endereço ou filial cadastrado para esta empresa.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {(enterprisesHook.selectedEnterprise.enterprise_addresses || []).map((addr, idx) => (
                        <div
                          key={addr.id || idx}
                          style={{
                            backgroundColor: 'var(--bg-app)',
                            padding: '18px',
                            borderRadius: '12px',
                            border: '1px solid var(--border-light)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            flexWrap: 'wrap',
                            gap: '16px'
                          }}
                        >
                          <div style={{ flex: 1, minWidth: '240px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                              <span style={{ backgroundColor: 'var(--primary)', color: 'white', fontWeight: 700, fontSize: '11px', padding: '2px 8px', borderRadius: '12px' }}>
                                Filial #{idx + 1}
                              </span>
                              <strong style={{ fontSize: '15px' }}>{addr.city} / {addr.state}</strong>
                            </div>

                            <p style={{ fontSize: '14px', color: 'var(--text-main)', margin: '4px 0', fontWeight: 500 }}>
                              {addr.street}, {addr.number || 'S/N'} {addr.complement ? `- ${addr.complement}` : ''}
                            </p>
                            
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                              Bairro: {addr.district || 'Não informado'} {addr.zip_code ? `• CEP: ${addr.zip_code}` : ''}
                            </p>
                          </div>

                          {addr.latitude && addr.longitude && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${addr.latitude},${addr.longitude}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <ExternalLink size={12} /> Ver no Mapa
                              </a>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                {addr.latitude.toFixed(5)}, {addr.longitude.toFixed(5)}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: HISTÓRICO STRIPE */}
              {detailsTab === 'subscriptions' && (
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DollarSign size={20} style={{ color: 'var(--success)' }} />
                    Histórico de Pagamentos e Assinaturas ({(enterprisesHook.selectedEnterprise.enterprise_subscriptions || []).length})
                  </h4>

                  {(enterprisesHook.selectedEnterprise.enterprise_subscriptions || []).length === 0 ? (
                    <div style={{ backgroundColor: 'var(--bg-app)', padding: '30px', borderRadius: '12px', border: '1px dashed var(--border-light)', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Nenhuma transação de assinatura Stripe registrada para esta empresa.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {(enterprisesHook.selectedEnterprise.enterprise_subscriptions || []).map((sub, idx) => (
                        <div
                          key={sub.id || idx}
                          style={{
                            backgroundColor: 'var(--bg-app)',
                            padding: '18px',
                            borderRadius: '12px',
                            border: '1px solid var(--border-light)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--success)' }}>
                              {formatCurrency(sub.amount_paid)}
                            </span>
                            <span className="badge badge-success" style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 700 }}>
                              {sub.status || 'succeeded'}
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '13px' }}>
                            <div>
                              <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Stripe Intent ID</span>
                              <code style={{ fontSize: '12px', fontWeight: 600 }}>{sub.stripe_intent_id || 'manual_admin'}</code>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Período de Vigência</span>
                              <strong>{new Date(sub.starts_at).toLocaleDateString('pt-BR')} até {new Date(sub.expires_at).toLocaleDateString('pt-BR')}</strong>
                            </div>
                          </div>

                          {sub.billing_breakdown && (
                            <div style={{ marginTop: '4px', backgroundColor: 'var(--bg-card)', padding: '12px', borderRadius: '8px', fontSize: '11px', border: '1px solid var(--border-light)' }}>
                              <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--text-main)' }}>Detalhamento da Cobrança (JSON):</strong>
                              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
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

              {/* TAB 4: MODERAÇÃO & NOTIFICAÇÕES */}
              {detailsTab === 'moderation' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldAlert size={20} style={{ color: 'var(--danger)' }} />
                    Painel de Moderação e Auditoria da Loja
                  </h4>

                  {/* Situational Status Banner */}
                  {enterprisesHook.selectedEnterprise.status === 'BLOCKED' ? (
                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '20px', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <Ban size={22} style={{ color: 'var(--danger)' }} />
                        <h5 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--danger)', margin: 0 }}>
                          Status Atual: BLOQUEADA
                        </h5>
                      </div>

                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                        Esta loja foi bloqueada pelo painel administrativo e teve a seguinte justificativa enviada e registrada:
                      </p>

                      <div style={{ backgroundColor: 'var(--bg-card)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '16px' }}>
                        <strong style={{ fontSize: '12px', color: 'var(--danger)', display: 'block', marginBottom: '4px' }}>Justificativa do Bloqueio:</strong>
                        <span style={{ fontSize: '14px', color: 'var(--text-main)', fontStyle: 'italic' }}>
                          &quot;{enterprisesHook.selectedEnterprise.blocked_reason}&quot;
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => enterprisesHook.setUnblockingEnterprise(enterprisesHook.selectedEnterprise)}
                          style={{ backgroundColor: '#10b981', border: 'none', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Unlock size={16} /> Reativar Estabelecimento
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '20px', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <ShieldCheck size={22} style={{ color: '#10b981' }} />
                        <h5 style={{ fontSize: '16px', fontWeight: 700, color: '#10b981', margin: 0 }}>
                          Status Atual: REGULAR ({enterprisesHook.selectedEnterprise.status})
                        </h5>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                        O estabelecimento está ativo e em situação regular. Se constatar alguma violação dos termos, você pode bloqueá-lo fornecendo uma justificativa obrigatória que será notificada ao proprietário.
                      </p>
                      
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => {
                          enterprisesHook.setBlockingEnterprise(enterprisesHook.selectedEnterprise);
                          setBlockReasonInput('');
                          setBlockReasonError('');
                        }}
                        style={{ backgroundColor: '#ef4444', color: 'white', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Ban size={16} /> Bloquear Empresa & Enviar Notificação
                      </button>
                    </div>
                  )}

                </div>
              )}

            </div>

            {/* Footer Toolbar */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', backgroundColor: 'var(--bg-app)', borderRadius: '0 0 16px 16px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => enterprisesHook.setSelectedEnterprise(null)}
              >
                Fechar Detalhes
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal Lightbox Viewer para Imagens de Galeria */}
      {selectedImage && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedImage(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px' }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              style={{ position: 'absolute', top: '-40px', right: 0, background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
            >
              <X size={28} />
            </button>
            <img src={selectedImage} alt="Mídia em alta resolução" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '8px', objectFit: 'contain' }} />
          </div>
        </div>
      )}

    </div>
  );
};
