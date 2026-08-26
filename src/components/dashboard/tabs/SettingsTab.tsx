/* eslint-disable complexity, @next/next/no-img-element */
import React, { useState } from 'react';
import { Search, Plus, Key, Trash2, Edit2, Globe, Building2, Tag, Percent, X, Check, ShieldAlert } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import { useMonetizationSettings } from '../../../hooks/useMonetizationSettings';
import { CityPricing, CityVolumeDiscount } from '../../../services/monetizationService';

export type SettingsSubTab = 'general' | 'banners' | 'stories' | 'contracts' | 'admins' | 'requests' | 'monetization';

interface SettingsTabProps {
  settingsSubTab: SettingsSubTab;
  setSettingsSubTab: (subTab: SettingsSubTab) => void;
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
  adminRole?: string;
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
  adminRole,
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
  const { success, error } = useToast();
  const monetizationHook = useMonetizationSettings();

  const currentAdminObj = adminUsersHook?.adminUsers?.find((a: any) => a.username === adminUsername);
  const isMasterAdmin = adminRole === 'admin_master' || currentAdminObj?.role === 'admin_master' || adminUsername?.toLowerCase().includes('master');

  // Monetization UI State
  const [regionalSearch, setRegionalSearch] = useState('');
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [editingPricing, setEditingPricing] = useState<CityPricing | null>(null);
  const [isDefaultCheckbox, setIsDefaultCheckbox] = useState(false);
  const [pricingState, setPricingState] = useState('SP');
  const [pricingCity, setPricingCity] = useState('');
  const [priceBaseLite, setPriceBaseLite] = useState('99.00');
  const [priceBasePremium, setPriceBasePremium] = useState('199.00');
  const [taxExtraLite, setTaxExtraLite] = useState('29.00');
  const [taxExtraPremium, setTaxExtraPremium] = useState('49.00');

  // Discount Modal UI State
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<CityVolumeDiscount | null>(null);
  const [minCitiesInput, setMinCitiesInput] = useState('2');
  const [discountPctInput, setDiscountPctInput] = useState('10.00');
  const [discountActiveInput, setDiscountActiveInput] = useState(true);

  const formatCurrency = (centavos: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format((centavos || 0) / 100);
  };

  const openPricingModal = (pricing?: CityPricing | null, forceDefault = false) => {
    if (pricing) {
      setEditingPricing(pricing);
      setIsDefaultCheckbox(pricing.is_default || pricing.city_name === 'DEFAULT');
      setPricingState(pricing.state === 'ALL' ? 'SP' : pricing.state);
      setPricingCity(pricing.city_name === 'DEFAULT' ? '' : pricing.city_name);
      setPriceBaseLite(((pricing.price_lite || 0) / 100).toFixed(2));
      setPriceBasePremium(((pricing.price_premium || 0) / 100).toFixed(2));
      setTaxExtraLite(((pricing.tax_extra_lite || 0) / 100).toFixed(2));
      setTaxExtraPremium(((pricing.tax_extra_premium || 0) / 100).toFixed(2));
    } else {
      setEditingPricing(null);
      setIsDefaultCheckbox(forceDefault);
      setPricingState('SP');
      setPricingCity('');
      setPriceBaseLite('99.00');
      setPriceBasePremium('199.00');
      setTaxExtraLite('29.00');
      setTaxExtraPremium('49.00');
    }
    setPricingModalOpen(true);
  };

  const handleSavePricing = async () => {
    if (!isDefaultCheckbox) {
      if (!pricingCity || !pricingCity.trim()) {
        error('Por favor, informe o nome da cidade.');
        return;
      }
      if (!pricingState) {
        error('Por favor, selecione o estado (UF).');
        return;
      }
    }

    const liteVal = Math.round(parseFloat(priceBaseLite || '0') * 100);
    const premVal = Math.round(parseFloat(priceBasePremium || '0') * 100);
    const extraLiteVal = Math.round(parseFloat(taxExtraLite || '0') * 100);
    const extraPremVal = Math.round(parseFloat(taxExtraPremium || '0') * 100);

    const saved = await monetizationHook.saveCityPricing({
      id: editingPricing?.id,
      is_default: isDefaultCheckbox,
      city_name: isDefaultCheckbox ? 'DEFAULT' : pricingCity,
      state: isDefaultCheckbox ? 'ALL' : pricingState,
      price_lite: liteVal,
      price_premium: premVal,
      tax_extra_lite: extraLiteVal,
      tax_extra_premium: extraPremVal
    });

    if (saved) {
      setPricingModalOpen(false);
    }
  };

  const openDiscountModal = (discount?: CityVolumeDiscount | null) => {
    if (discount) {
      setEditingDiscount(discount);
      setMinCitiesInput(String(discount.min_distinct_cities));
      setDiscountPctInput(String(discount.discount_percentage));
      setDiscountActiveInput(discount.is_active);
    } else {
      setEditingDiscount(null);
      setMinCitiesInput('2');
      setDiscountPctInput('10.00');
      setDiscountActiveInput(true);
    }
    setDiscountModalOpen(true);
  };

  const handleSaveDiscount = async () => {
    const minCities = parseInt(minCitiesInput, 10);
    const pct = parseFloat(discountPctInput);

    if (isNaN(minCities) || minCities < 2) {
      error('A quantidade mínima de cidades distintas deve ser um inteiro maior ou igual a 2.');
      return;
    }

    if (isNaN(pct) || pct <= 0 || pct > 100) {
      error('O percentual de desconto deve ser entre 0.01% e 100%.');
      return;
    }

    const saved = await monetizationHook.saveVolumeDiscount({
      id: editingDiscount?.id,
      min_distinct_cities: minCities,
      discount_percentage: pct,
      is_active: discountActiveInput
    });

    if (saved) {
      setDiscountModalOpen(false);
    }
  };

  const filteredRegionals = monetizationHook.regionalRules.filter(r => {
    if (!regionalSearch) return true;
    const term = regionalSearch.toLowerCase();
    return r.city_name.toLowerCase().includes(term) || r.state.toLowerCase().includes(term);
  });

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
          className={`btn ${settingsSubTab === 'monetization' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSettingsSubTab('monetization')}
          style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Building2 size={16} /> Monetização de Empresas
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

      {/* Sub-tab: Monetização de Empresas */}
      {settingsSubTab === 'monetization' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {!isMasterAdmin && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              color: 'var(--danger)',
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <ShieldAlert size={22} />
              <div>
                <h4 style={{ margin: 0, fontWeight: 700, fontSize: '15px' }}>Modo de Leitura (Restrito a Admin Master)</h4>
                <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-main)' }}>
                  Você está visualizando a precificação em modo somente leitura. Alterações exigem privilégio de Administrador Master (`admin_master`).
                </p>
              </div>
            </div>
          )}
          
          {/* Card 1: Fallback Global Nacional */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              padding: '24px',
              borderRadius: 'var(--radius-md)',
              border: '2px solid var(--primary)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.08)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Globe size={20} style={{ color: 'var(--primary)' }} />
                  Fallback Global Nacional (Regra Padrão)
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                  Aplica-se a qualquer estabelecimento cadastrado em cidades sem tarifa regional customizada.
                </p>
              </div>
              {isMasterAdmin && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => openPricingModal(monetizationHook.fallbackRule, true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Edit2 size={14} /> Editar Preço Padrão
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', backgroundColor: 'var(--bg-app)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Plano Base Lite</span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                  {formatCurrency(monetizationHook.fallbackRule?.price_lite || 9900)} <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>/ano</span>
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Extra Lite (Filial Extra)</span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                  {formatCurrency(monetizationHook.fallbackRule?.tax_extra_lite || 2900)} <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>/ano</span>
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Plano Base Premium</span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#f59e0b', marginTop: '2px' }}>
                  {formatCurrency(monetizationHook.fallbackRule?.price_premium || 19900)} <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>/ano</span>
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Extra Premium (Filial Extra)</span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#f59e0b', marginTop: '2px' }}>
                  {formatCurrency(monetizationHook.fallbackRule?.tax_extra_premium || 4900)} <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>/ano</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Tarifas Customizadas Regionais */}
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={20} /> Tarifas Customizadas Regionais
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>
                  Defina valores de anúncio diferenciados por município e estado.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', width: '220px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Buscar cidade..."
                    value={regionalSearch}
                    onChange={(e) => setRegionalSearch(e.target.value)}
                    style={{ paddingLeft: '32px', fontSize: '13px' }}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => openPricingModal(null, false)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                >
                  <Plus size={16} /> Nova Exceção
                </button>
              </div>
            </div>

            <div className="table-container">
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Cidade</th>
                      <th>Estado</th>
                      <th>Base Lite</th>
                      <th>Base Premium</th>
                      <th>Extra Lite</th>
                      <th>Extra Premium</th>
                      <th style={{ textAlign: 'right' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monetizationHook.loading ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                          Carregando tarifas regionais...
                        </td>
                      </tr>
                    ) : filteredRegionals.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                          Nenhuma exceção regional cadastrada.
                        </td>
                      </tr>
                    ) : (
                      filteredRegionals.map((pricing) => (
                        <tr key={pricing.id}>
                          <td><strong style={{ fontSize: '14px' }}>{pricing.city_name}</strong></td>
                          <td><span className="badge badge-secondary">{pricing.state}</span></td>
                          <td>{formatCurrency(pricing.price_lite)}</td>
                          <td><span style={{ color: '#f59e0b', fontWeight: 600 }}>{formatCurrency(pricing.price_premium)}</span></td>
                          <td>{formatCurrency(pricing.tax_extra_lite)}</td>
                          <td><span style={{ color: '#f59e0b', fontWeight: 600 }}>{formatCurrency(pricing.tax_extra_premium)}</span></td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => openPricingModal(pricing, false)}
                                title="Editar"
                                style={{ padding: '6px' }}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => monetizationHook.deleteCityPricing(pricing.id)}
                                title="Excluir"
                                style={{ padding: '6px' }}
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
            </div>
          </div>

          {/* Section 3: Descontos por Cidades Distintas */}
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Tag size={20} style={{ color: 'var(--success)' }} />
                  Descontos por Cidades Distintas (`city_volume_discounts`)
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>
                  Configure faixas de desconto progressivo para empresas com filiais distribuídas em múltiplos municípios.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => openDiscountModal(null)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
              >
                <Plus size={16} /> Novo Desconto
              </button>
            </div>

            <div className="table-container">
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Qtd. Mínima de Cidades Distintas</th>
                      <th>Desconto (%)</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monetizationHook.loading ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                          Carregando regras de desconto...
                        </td>
                      </tr>
                    ) : monetizationHook.discounts.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                          Nenhuma regra de desconto cadastrada.
                        </td>
                      </tr>
                    ) : (
                      monetizationHook.discounts.map((disc) => (
                        <tr key={disc.id}>
                          <td>
                            <strong style={{ fontSize: '14px' }}>A partir de {disc.min_distinct_cities} Cidades</strong>
                          </td>
                          <td>
                            <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '13px', fontWeight: 700, padding: '4px 8px' }}>
                              {disc.discount_percentage.toFixed(2)}% OFF
                            </span>
                          </td>
                          <td>
                            {disc.is_active ? (
                              <span className="badge badge-success">Ativo</span>
                            ) : (
                              <span className="badge badge-secondary">Inativo</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => openDiscountModal(disc)}
                                title="Editar"
                                style={{ padding: '6px' }}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => monetizationHook.deleteVolumeDiscount(disc.id)}
                                title="Excluir"
                                style={{ padding: '6px' }}
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
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Formulário de Preço (Regional ou Padrão) */}
      {pricingModalOpen && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '28px', borderRadius: 'var(--radius-md)', maxWidth: '580px', width: '100%', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>
                {editingPricing ? 'Editar Tarifa de Anúncio' : 'Cadastrar Tarifa de Anúncio'}
              </h3>
              <button type="button" onClick={() => setPricingModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              {/* Checkbox Preço Padrão */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', backgroundColor: 'var(--bg-app)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <input
                  type="checkbox"
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                  checked={isDefaultCheckbox}
                  onChange={(e) => {
                    setIsDefaultCheckbox(e.target.checked);
                    if (e.target.checked) {
                      setPricingCity('');
                    }
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>Preço Padrão Nacional (Fallback)</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Desativa os campos Estado e Cidade e assume a regra global do sistema.
                  </span>
                </div>
              </label>

              {/* State & City fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: 600 }}>Estado (UF) *</label>
                  <select
                    className="select-field"
                    value={pricingState}
                    disabled={isDefaultCheckbox}
                    onChange={(e) => setPricingState(e.target.value)}
                  >
                    {ESTADOS_BRASIL.map(est => (
                      <option key={est.value} value={est.value}>{est.value} - {est.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: 600 }}>Cidade *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder={isDefaultCheckbox ? 'DEFAULT (Global)' : 'Ex: São Paulo'}
                    disabled={isDefaultCheckbox}
                    value={isDefaultCheckbox ? 'DEFAULT' : pricingCity}
                    onChange={(e) => setPricingCity(e.target.value)}
                  />
                </div>
              </div>

              {/* LITE Values */}
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '14px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)', display: 'block', marginBottom: '8px' }}>
                  VALORES PLANO LITE (Anual)
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '12px' }}>Preço Base Lite (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input-field"
                      value={priceBaseLite}
                      onChange={(e) => setPriceBaseLite(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '12px' }}>Taxa Endereço Extra Lite (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input-field"
                      value={taxExtraLite}
                      onChange={(e) => setTaxExtraLite(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* PREMIUM Values */}
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '14px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#f59e0b', display: 'block', marginBottom: '8px' }}>
                  VALORES PLANO PREMIUM (Anual)
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '12px' }}>Preço Base Premium (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input-field"
                      value={priceBasePremium}
                      onChange={(e) => setPriceBasePremium(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '12px' }}>Taxa Endereço Extra Premium (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input-field"
                      value={taxExtraPremium}
                      onChange={(e) => setTaxExtraPremium(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPricingModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSavePricing}
                disabled={monetizationHook.saving}
              >
                {monetizationHook.saving ? 'Salvando...' : 'Salvar Regra'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Formulário de Regra de Desconto por Cidades */}
      {discountModalOpen && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '28px', borderRadius: 'var(--radius-md)', maxWidth: '480px', width: '100%', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>
                {editingDiscount ? 'Editar Regra de Desconto' : 'Nova Regra de Desconto por Cidades'}
              </h3>
              <button type="button" onClick={() => setDiscountModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: 600 }}>Qtd. Mínima de Cidades Distintas *</label>
                <input
                  type="number"
                  min="2"
                  step="1"
                  className="input-field"
                  value={minCitiesInput}
                  onChange={(e) => setMinCitiesInput(e.target.value)}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Número de municípios diferentes onde a empresa possui filiais para acionar o desconto.
                </span>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: 600 }}>Percentual de Desconto (%) *</label>
                <input
                  type="number"
                  min="0.1"
                  max="100"
                  step="0.01"
                  className="input-field"
                  value={discountPctInput}
                  onChange={(e) => setDiscountPctInput(e.target.value)}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                  checked={discountActiveInput}
                  onChange={(e) => setDiscountActiveInput(e.target.checked)}
                />
                <span style={{ fontWeight: 600, fontSize: '14px' }}>Regra Ativa</span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDiscountModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveDiscount}
                disabled={monetizationHook.saving}
              >
                {monetizationHook.saving ? 'Salvando...' : 'Salvar Desconto'}
              </button>
            </div>
          </div>
        </div>
      )}

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
          {!isMasterAdmin && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              color: 'var(--danger)',
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <ShieldAlert size={22} />
              <div>
                <h4 style={{ margin: 0, fontWeight: 700, fontSize: '15px' }}>Gestão Restrita a Administrador Master</h4>
                <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-main)' }}>
                  A criação, edição e exclusão de credenciais de administradores exige privilégio de Administrador Master (`admin_master`).
                </p>
              </div>
            </div>
          )}

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
            {isMasterAdmin && (
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
            )}
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
                          {isMasterAdmin ? (
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
                                  gap: '4px',
                                  padding: '6px 12px'
                                }}
                                title={admin.username === adminUsername ? 'Não é possível excluir a própria conta' : 'Excluir Administrador'}
                              >
                                <Trash2 size={14} /> Excluir
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Somente Leitura</span>
                          )}
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
