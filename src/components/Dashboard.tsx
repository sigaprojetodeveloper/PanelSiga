"use client";

import React, { useState, useEffect } from 'react';
import { useUsers } from '../hooks/useUsers';
import { useReports } from '../hooks/useReports';
import { useStories } from '../hooks/useStories';
import { useBanners } from '../hooks/useBanners';
import { uploadToR2 } from '../services/storageService';
import { supabase } from '../lib/supabase';
import { storiesService } from '../services/storiesService';
import {
  LayoutDashboard,
  Users,
  Film,
  AlertTriangle,
  Settings,
  LogOut,
  Search,
  Plus,
  Trash2,
  X,
  UserX,
  FileText,
  MapPin,
  Eye,
  Calendar,
  Image as ImageIcon,
  UploadCloud,
  Edit2,
  Link as LinkIcon
} from 'lucide-react';

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

// Link helpers
const formatWhatsAppNumber = (val: string) => {
  const digits = val.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

interface ParsedLink {
  type: 'none' | 'whatsapp' | 'external' | 'internal';
  rawValue: string;
  customRoute: string;
}

const parseLinkUrl = (url: string | null): ParsedLink => {
  if (!url) {
    return { type: 'none', rawValue: '', customRoute: '' };
  }
  if (url.startsWith('https://wa.me/')) {
    const digits = url.replace('https://wa.me/55', '').replace('https://wa.me/', '');
    return { type: 'whatsapp', rawValue: formatWhatsAppNumber(digits), customRoute: '' };
  }
  if (url.startsWith('/public-profile?id=')) {
    const userId = url.split('=')[1] || '';
    return { type: 'internal', rawValue: userId, customRoute: '' };
  }
  if (url.startsWith('/')) {
    return { type: 'internal', rawValue: 'custom', customRoute: url };
  }
  return { type: 'external', rawValue: url, customRoute: '' };
};

const assembleLinkUrl = (
  type: 'none' | 'whatsapp' | 'external' | 'internal',
  rawValue: string,
  customRoute: string
): string | null => {
  if (type === 'none') return null;
  if (type === 'whatsapp') {
    const digits = rawValue.replace(/\D/g, '');
    return `https://wa.me/55${digits}`;
  }
  if (type === 'external') {
    return rawValue;
  }
  if (type === 'internal') {
    if (rawValue === 'custom') {
      return customRoute;
    }
    return `/public-profile?id=${rawValue}`;
  }
  return null;
};

// Reusable Drag & Drop zone component
interface FileUploadZoneProps {
  mediaUrl: string;
  setMediaUrl: (url: string) => void;
  mediaType?: 'image' | 'video';
  setMediaType?: (type: 'image' | 'video') => void;
  setAspectRatioWarning?: (warn: boolean) => void;
  allowedTypes: string[];
  folder: string;
}

function FileUploadZone({
  mediaUrl,
  setMediaUrl,
  mediaType,
  setMediaType,
  setAspectRatioWarning,
  allowedTypes,
  folder
}: FileUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (selectedFile: File) => {
    if (!allowedTypes.includes(selectedFile.type)) {
      alert(`Formato de arquivo inválido. Apenas os formatos ${allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')} são aceitos.`);
      return;
    }

    if (selectedFile.type.startsWith('video/')) {
      if (setMediaType) setMediaType('video');
    } else {
      if (setMediaType) setMediaType('image');
    }

    if (setAspectRatioWarning && selectedFile.type.startsWith('image/')) {
      const img = new Image();
      img.onload = () => {
        const aspect = img.width / img.height;
        if (aspect < 1.6 || aspect > 1.9) {
          setAspectRatioWarning(true);
        } else {
          setAspectRatioWarning(false);
        }
      };
      img.src = URL.createObjectURL(selectedFile);
    } else if (setAspectRatioWarning) {
      setAspectRatioWarning(false);
    }

    setUploading(true);
    try {
      const filename = `${Date.now()}-${selectedFile.name.replace(/\s+/g, '_')}`;
      const contentType = selectedFile.type;
      const res = await uploadToR2(selectedFile, filename, contentType, folder);
      setMediaUrl(res.publicUrl);
    } catch (err: any) {
      console.error(err);
      alert('Falha ao enviar arquivo: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const inputId = `file-input-${folder}-${mediaType || 'banner'}`;

  return (
    <div
      className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={() => document.getElementById(inputId)?.click()}
    >
      <input
        type="file"
        id={inputId}
        style={{ display: 'none' }}
        accept={allowedTypes.join(',')}
        onChange={handleFileChange}
      />
      {uploading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            border: '2px solid var(--border-light)',
            borderTopColor: 'var(--primary)',
            animation: 'spin 1s linear infinite',
          }} />
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Enviando arquivo...</p>
        </div>
      ) : mediaUrl ? (
        <div className="upload-preview-container" onClick={(e) => e.stopPropagation()}>
          {mediaType === 'video' ? (
            <video src={mediaUrl} className="upload-preview" controls style={{ maxHeight: '100px' }} />
          ) : (
            <img src={mediaUrl} className="upload-preview" alt="Preview" style={{ maxHeight: '100px' }} />
          )}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => document.getElementById(inputId)?.click()}
            >
              Substituir
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => {
                setMediaUrl('');
                if (setAspectRatioWarning) setAspectRatioWarning(false);
              }}
            >
              Remover
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <UploadCloud size={28} style={{ color: 'var(--text-muted)' }} />
          <p style={{ fontWeight: 600, fontSize: '13px' }}>
            Arraste e solte o arquivo ou clique para selecionar
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Aceitos: {allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}

interface DashboardProps {
  onLogout: () => void;
  adminUsername: string;
}

export default function Dashboard({ onLogout, adminUsername }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'stories' | 'reports' | 'settings' | 'banners'>('overview');

  // Custom Hooks
  const userHook = useUsers();
  const reportHook = useReports();
  const storyHook = useStories();
  const bannersHook = useBanners();

  const currentUserEmail = adminUsername;

  // Modals state
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [addChannelModalOpen, setAddChannelModalOpen] = useState(false);
  const [addStoryModalOpen, setAddStoryModalOpen] = useState(false);
  const [addBannerModalOpen, setAddBannerModalOpen] = useState(false);

  // Edit user state
  const [editUserId, setEditUserId] = useState('');
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserPhone, setEditUserPhone] = useState('');
  const [editUserBio, setEditUserBio] = useState('');

  // Add channel state
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelAvatar, setNewChannelAvatar] = useState('');
  const [newChannelDestaque, setNewChannelDestaque] = useState(false);
  const [newChannelScope, setNewChannelScope] = useState<'national' | 'state' | 'city'>('national');
  const [newChannelState, setNewChannelState] = useState('');
  const [newChannelCity, setNewChannelCity] = useState('');

  // Add/Edit story item state
  const [editStoryId, setEditStoryId] = useState('');
  const [newStoryChannelId, setNewStoryChannelId] = useState('');
  const [newStoryMediaUrl, setNewStoryMediaUrl] = useState('');
  const [newStoryMediaType, setNewStoryMediaType] = useState<'image' | 'video'>('image');
  const [newStoryLinkType, setNewStoryLinkType] = useState<'none' | 'whatsapp' | 'external' | 'internal'>('none');
  const [newStoryLinkRawValue, setNewStoryLinkRawValue] = useState('');
  const [newStoryLinkCustomRoute, setNewStoryLinkCustomRoute] = useState('');
  const [newStoryLinkLabel, setNewStoryLinkLabel] = useState('');
  const [newStoryExpiration, setNewStoryExpiration] = useState('');

  // Add/Edit banner state
  const [editBannerId, setEditBannerId] = useState('');
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [bannerLinkType, setBannerLinkType] = useState<'none' | 'whatsapp' | 'external' | 'internal'>('none');
  const [bannerLinkRawValue, setBannerLinkRawValue] = useState('');
  const [bannerLinkCustomRoute, setBannerLinkCustomRoute] = useState('');
  const [bannerLinkLabel, setBannerLinkLabel] = useState('');
  const [bannerExpiration, setBannerExpiration] = useState('');
  const [bannerAspectWarning, setBannerAspectWarning] = useState(false);

  // Users list for redirection
  const [linkUsersList, setLinkUsersList] = useState<{ id: string; name: string | null }[]>([]);

  useEffect(() => {
    async function loadLinkUsers() {
      try {
        const { data } = await supabase.from('users').select('id, name').order('name');
        if (data) {
          setLinkUsersList(data);
        }
      } catch (err) {
        console.error('Erro ao carregar usuários para links:', err);
      }
    }
    loadLinkUsers();
  }, []);

  // Selected report detail state
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [reportNotes, setReportNotes] = useState('');

  // Overview calculated statistics
  const totalUsersCount = userHook.totalCount || 0;
  const blockedUsersCount = userHook.users.filter(u => u.status === 'blocked').length;
  const pendingReportsCount = reportHook.reports.filter(r => r.status === 'new').length;
  const activeChannelsCount = storyHook.channels.filter(c => c.is_active).length;
  const selectedChannel = storyHook.channels.find((c: any) => c.id === storyHook.selectedChannelId);

  const handleEditUserClick = (u: any) => {
    setEditUserId(u.id);
    setEditUserName(u.name || '');
    setEditUserEmail(u.email || '');
    setEditUserPhone(u.phone || '');
    setEditUserBio(u.user_profiles?.[0]?.bio || '');
    setEditUserModalOpen(true);
  };

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    await userHook.editUserProfile(editUserId, {
      name: editUserName,
      email: editUserEmail,
      phone: editUserPhone,
      bio: editUserBio
    });
    setEditUserModalOpen(false);
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName) return;
    await storyHook.createChannel({
      name: newChannelName,
      avatar_url: newChannelAvatar || null,
      is_destaque: newChannelDestaque,
      is_active: true,
      state: newChannelScope !== 'national' ? newChannelState || null : null,
      city: newChannelScope === 'city' ? newChannelCity || null : null
    });
    setNewChannelName('');
    setNewChannelAvatar('');
    setNewChannelDestaque(false);
    setNewChannelScope('national');
    setNewChannelState('');
    setNewChannelCity('');
    setAddChannelModalOpen(false);
  };

  const handleOpenAddStory = () => {
    setEditStoryId('');
    setNewStoryChannelId(storyHook.selectedChannelId || '');
    setNewStoryMediaUrl('');
    setNewStoryMediaType('image');
    setNewStoryLinkType('none');
    setNewStoryLinkRawValue('');
    setNewStoryLinkCustomRoute('');
    setNewStoryLinkLabel('');
    setNewStoryExpiration('');
    setAddStoryModalOpen(true);
  };

  const handleOpenEditStory = (item: any) => {
    setEditStoryId(item.id);
    setNewStoryChannelId(item.channel_id);
    setNewStoryMediaUrl(item.media_url);
    setNewStoryMediaType(item.media_type);

    const parsed = parseLinkUrl(item.link_url);
    setNewStoryLinkType(parsed.type);
    setNewStoryLinkRawValue(parsed.rawValue);
    setNewStoryLinkCustomRoute(parsed.customRoute);

    setNewStoryLinkLabel(item.link_label || '');
    setNewStoryExpiration(item.data_expiracao);
    setAddStoryModalOpen(true);
  };

  const handleSaveStoryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoryChannelId || !newStoryMediaUrl || !newStoryExpiration) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    const assembledLink = assembleLinkUrl(newStoryLinkType, newStoryLinkRawValue, newStoryLinkCustomRoute);
    let finalLabel = newStoryLinkLabel || null;
    if (newStoryLinkType === 'whatsapp' && !finalLabel) finalLabel = 'Falar no WhatsApp';
    if (newStoryLinkType === 'external' && !finalLabel) finalLabel = 'Acessar Link';
    if (newStoryLinkType === 'internal') {
      if (!finalLabel) {
        finalLabel = newStoryLinkRawValue === 'custom' ? 'Ver Mais' : 'Ver Perfil';
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const itemData = {
      channel_id: newStoryChannelId,
      media_url: newStoryMediaUrl,
      media_type: newStoryMediaType,
      link_url: assembledLink,
      link_label: finalLabel,
      status: (newStoryExpiration < todayStr ? 'expired' : 'active') as 'active' | 'expired',
      data_expiracao: newStoryExpiration
    };

    try {
      if (editStoryId) {
        await storiesService.updateStoryItem(editStoryId, itemData);
        await storyHook.refetch();
        alert('Story atualizado com sucesso!');
      } else {
        await storyHook.createItem(itemData);
        alert('Story publicado com sucesso!');
      }
      setAddStoryModalOpen(false);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleOpenAddBanner = () => {
    setEditBannerId('');
    setBannerTitle('');
    setBannerSubtitle('');
    setBannerImageUrl('');
    setBannerLinkType('none');
    setBannerLinkRawValue('');
    setBannerLinkCustomRoute('');
    setBannerLinkLabel('');
    setBannerExpiration('');
    setBannerAspectWarning(false);
    setAddBannerModalOpen(true);
  };

  const handleOpenEditBanner = (banner: any) => {
    setEditBannerId(banner.id);
    setBannerTitle(banner.title || '');
    setBannerSubtitle(banner.subtitle || '');
    setBannerImageUrl(banner.image_url);

    const parsed = parseLinkUrl(banner.link_url);
    setBannerLinkType(parsed.type);
    setBannerLinkRawValue(parsed.rawValue);
    setBannerLinkCustomRoute(parsed.customRoute);

    setBannerLinkLabel(banner.link_label || '');
    setBannerExpiration(banner.data_expiracao);
    setBannerAspectWarning(false);
    setAddBannerModalOpen(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerImageUrl || !bannerExpiration) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    const assembledLink = assembleLinkUrl(bannerLinkType, bannerLinkRawValue, bannerLinkCustomRoute);
    let finalLabel = bannerLinkLabel || null;
    if (bannerLinkType === 'whatsapp' && !finalLabel) finalLabel = 'Falar no WhatsApp';
    if (bannerLinkType === 'external' && !finalLabel) finalLabel = 'Acessar Link';
    if (bannerLinkType === 'internal') {
      if (!finalLabel) {
        finalLabel = bannerLinkRawValue === 'custom' ? 'Ver Mais' : 'Ver Perfil';
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const bannerData = {
      image_url: bannerImageUrl,
      title: bannerTitle || null,
      subtitle: bannerSubtitle || null,
      link_url: assembledLink,
      link_label: finalLabel,
      status: (bannerExpiration < todayStr ? 'expired' : 'active') as 'active' | 'expired',
      data_expiracao: bannerExpiration
    };

    try {
      if (editBannerId) {
        await bannersHook.updateBanner(editBannerId, bannerData);
        alert('Banner atualizado com sucesso!');
      } else {
        await bannersHook.createBanner(bannerData);
        alert('Banner criado com sucesso!');
      }
      setAddBannerModalOpen(false);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleToggleBannerStatus = async (banner: any) => {
    const newStatus = banner.status === 'active' ? 'expired' : 'active';
    const updates: any = { status: newStatus };
    const todayStr = new Date().toISOString().split('T')[0];
    if (newStatus === 'active' && banner.data_expiracao < todayStr) {
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);
      updates.data_expiracao = nextMonth.toISOString().split('T')[0];
    }
    await bannersHook.updateBanner(banner.id, updates);
  };

  const handleOpenReportDetails = (report: any) => {
    setSelectedReport(report);
    setReportNotes(report.notes || '');
    setReportModalOpen(true);
  };

  const handleUpdateReportStatus = async (status: 'resolved' | 'ignored' | 'in_review') => {
    if (!selectedReport) return;
    await reportHook.updateReportStatus(selectedReport.id, status, reportNotes);
    setReportModalOpen(false);
  };

  const renderLinkConfigFields = (
    type: 'none' | 'whatsapp' | 'external' | 'internal',
    setType: (t: any) => void,
    rawValue: string,
    setRawValue: (v: string) => void,
    customRoute: string,
    setCustomRoute: (v: string) => void,
    linkLabel: string,
    setLinkLabel: (v: string) => void
  ) => {
    return (
      <>
        <div className="grid-2">
          <div className="form-group">
            <label>Ação de Redirecionamento (Tipo)</label>
            <select
              className="select-field"
              value={type}
              onChange={(e) => {
                setType(e.target.value as any);
                setRawValue('');
                setCustomRoute('');
              }}
            >
              <option value="none">Nenhum</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="external">Link Externo</option>
              <option value="internal">Link Interno (App)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Texto do Botão / Label (Opcional)</label>
            <input
              type="text"
              className="input-field"
              value={linkLabel}
              onChange={(e) => setLinkLabel(e.target.value)}
              placeholder="Ex: Saiba Mais, Falar Conosco"
            />
          </div>
        </div>

        {type === 'whatsapp' && (
          <div className="form-group">
            <label>Número do WhatsApp</label>
            <input
              type="text"
              className="input-field"
              value={rawValue}
              onChange={(e) => setRawValue(formatWhatsAppNumber(e.target.value))}
              placeholder="(11) 99999-9999"
              required
            />
          </div>
        )}

        {type === 'external' && (
          <div className="form-group">
            <label>URL Externa (http/https)</label>
            <input
              type="text"
              className="input-field"
              value={rawValue}
              onChange={(e) => setRawValue(e.target.value)}
              placeholder="https://exemplo.com/pagina"
              required
              onBlur={() => {
                if (rawValue && !rawValue.startsWith('http://') && !rawValue.startsWith('https://')) {
                  alert('Atenção: Links externos devem começar com http:// ou https://');
                }
              }}
            />
          </div>
        )}

        {type === 'internal' && (
          <div className="grid-2">
            <div className="form-group">
              <label>Tipo de Link Interno</label>
              <select
                className="select-field"
                value={rawValue === 'custom' ? 'custom' : 'profile'}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setRawValue('custom');
                    setCustomRoute('/');
                  } else {
                    setRawValue('');
                    setCustomRoute('');
                  }
                }}
              >
                <option value="profile">Perfil de Profissional/Cliente</option>
                <option value="custom">Rota Personalizada do App</option>
              </select>
            </div>

            {rawValue === 'custom' ? (
              <div className="form-group">
                <label>Rota do App (ID ou Caminho)</label>
                <input
                  type="text"
                  className="input-field"
                  value={customRoute}
                  onChange={(e) => setCustomRoute(e.target.value)}
                  placeholder="Ex: /search?tab=professionals"
                  required
                />
              </div>
            ) : (
              <div className="form-group">
                <label>Selecionar Perfil Destino</label>
                <select
                  className="select-field"
                  value={rawValue}
                  onChange={(e) => setRawValue(e.target.value)}
                  required
                >
                  <option value="">Selecione um perfil</option>
                  {linkUsersList.map((usr) => (
                    <option key={usr.id} value={usr.id}>
                      {usr.name || 'Sem nome'} ({usr.id.slice(0, 8)}...)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <AlertTriangle color="var(--primary)" size={28} />
          <h2>Painel Siga</h2>
        </div>

        <nav className="sidebar-nav">
          <a
            onClick={() => setActiveTab('overview')}
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} />
            Visão Geral
          </a>
          <a
            onClick={() => setActiveTab('users')}
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
          >
            <Users size={18} />
            Usuários
          </a>
          <a
            onClick={() => setActiveTab('stories')}
            className={`nav-item ${activeTab === 'stories' ? 'active' : ''}`}
          >
            <Film size={18} />
            Stories
          </a>
          <a
            onClick={() => setActiveTab('banners')}
            className={`nav-item ${activeTab === 'banners' ? 'active' : ''}`}
          >
            <ImageIcon size={18} />
            Banners
          </a>
          <a
            onClick={() => setActiveTab('reports')}
            className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
          >
            <AlertTriangle size={18} />
            Denúncias
            {pendingReportsCount > 0 && (
              <span className="badge badge-danger" style={{ marginLeft: 'auto', padding: '2px 6px', fontSize: '10px' }}>
                {pendingReportsCount}
              </span>
            )}
          </a>
          <a
            onClick={() => setActiveTab('settings')}
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          >
            <Settings size={18} />
            Configurações
          </a>
        </nav>

        <div className="sidebar-footer">
          <div className="admin-badge">
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Administrador</span>
            <span className="admin-email">{currentUserEmail || 'admin@siga.com.br'}</span>
          </div>
          <button className="btn-logout" onClick={onLogout} title="Sair">
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="main-content">
        <header className="header-main">
          <div className="header-title">
            <h2>
              {activeTab === 'overview' && 'Visão Geral'}
              {activeTab === 'users' && 'Gerenciamento de Usuários'}
              {activeTab === 'stories' && 'Publicações e Stories'}
              {activeTab === 'banners' && 'Gerenciamento de Banners'}
              {activeTab === 'reports' && 'Painel de Denúncias e Moderação'}
              {activeTab === 'settings' && 'Configurações do Sistema'}
            </h2>
          </div>
        </header>

        <div className="content-body">
          {/* ================= TAB: OVERVIEW ================= */}
          {activeTab === 'overview' && (
            <div>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-info">
                    <h3>Total Usuários</h3>
                    <div className="stat-value">{totalUsersCount}</div>
                  </div>
                  <div className="stat-icon-wrapper blue">
                    <Users size={24} />
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-info">
                    <h3>Usuários Bloqueados</h3>
                    <div className="stat-value">{blockedUsersCount}</div>
                  </div>
                  <div className="stat-icon-wrapper red">
                    <UserX size={24} />
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-info">
                    <h3>Novas Denúncias</h3>
                    <div className="stat-value">{pendingReportsCount}</div>
                  </div>
                  <div className="stat-icon-wrapper orange">
                    <AlertTriangle size={24} />
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-info">
                    <h3>Canais de Stories</h3>
                    <div className="stat-value">{activeChannelsCount}</div>
                  </div>
                  <div className="stat-icon-wrapper purple">
                    <Film size={24} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
                {/* Recent Reports */}
                <div style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={18} color="var(--warning)" /> Denúncias Recentes
                  </h3>
                  {reportHook.reports.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>Nenhuma denúncia registrada.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {reportHook.reports.slice(0, 5).map((rep) => (
                        <div
                          key={rep.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 16px',
                            backgroundColor: 'var(--bg-app)',
                            borderRadius: 'var(--radius-sm)',
                            borderLeft: `4px solid ${rep.status === 'new' ? 'var(--danger)' : 'var(--text-muted)'}`
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 600, textTransform: 'capitalize', fontSize: '14px' }}>
                              Alvo: {rep.target_type}
                            </span>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              Motivo: {rep.reason} • {new Date(rep.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`badge ${rep.status === 'new' ? 'badge-danger' : rep.status === 'in_review' ? 'badge-warning' : 'badge-success'}`}>
                            {rep.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Atalhos de Moderação</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => setActiveTab('users')}>
                      <Users size={16} /> Ir para Gestão de Usuários
                    </button>
                    <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => setActiveTab('stories')}>
                      <Plus size={16} /> Adicionar Novo Canal de Stories
                    </button>
                    <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => setActiveTab('reports')}>
                      <AlertTriangle size={16} /> Moderar Denúncias Pendentes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB: USERS ================= */}
          {activeTab === 'users' && (
            <div>
              {/* Search & Filter Bar */}
              <div className="filters-bar">
                <div className="filters-group">
                  <div className="search-input-wrapper">
                    <Search size={16} className="search-icon" />
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Buscar por nome, email, CPF..."
                      value={userHook.search}
                      onChange={(e) => {
                        userHook.setSearch(e.target.value);
                        userHook.setPage(1);
                      }}
                    />
                  </div>

                  <div className="filter-control">
                    <label>Status</label>
                    <select
                      className="select-field"
                      value={userHook.statusFilter || ''}
                      onChange={(e) => {
                        userHook.setStatusFilter((e.target.value as any) || undefined);
                        userHook.setPage(1);
                      }}
                    >
                      <option value="">Todos</option>
                      <option value="active">Ativos</option>
                      <option value="blocked">Bloqueados</option>
                      <option value="deleted">Excluídos</option>
                    </select>
                  </div>

                  <div className="filter-control">
                    <label>Papel</label>
                    <select
                      className="select-field"
                      value={userHook.roleFilter || ''}
                      onChange={(e) => {
                        userHook.setRoleFilter((e.target.value as any) || undefined);
                        userHook.setPage(1);
                      }}
                    >
                      <option value="">Todos</option>
                      <option value="cliente">Cliente</option>
                      <option value="profissional">Profissional</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Users Table */}
              <div className="table-container">
                <div className="table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>Telefone</th>
                        <th>Papel</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userHook.loading ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                            Carregando usuários...
                          </td>
                        </tr>
                      ) : userHook.users.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                            Nenhum usuário encontrado.
                          </td>
                        </tr>
                      ) : (
                        userHook.users.map((u) => (
                          <tr key={u.id}>
                            <td>{u.name || 'Sem nome'}</td>
                            <td>{u.email || 'Sem email'}</td>
                            <td>{u.phone || 'Sem telefone'}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                {u.role_flags?.map((r: string) => (
                                  <span key={r} className="badge badge-info" style={{ fontSize: '9px' }}>
                                    {r}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${u.status === 'active' ? 'badge-success' : u.status === 'blocked' ? 'badge-danger' : 'badge-warning'}`}>
                                {u.status}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '8px' }}>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={async () => {
                                    await userHook.loadUserDetails(u.id);
                                    setUserModalOpen(true);
                                  }}
                                  title="Ver Detalhes"
                                >
                                  <Eye size={14} /> Detalhes
                                </button>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleEditUserClick(u)}
                                >
                                  Editar
                                </button>
                                {u.status === 'active' ? (
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => userHook.updateUserStatus(u.id, 'blocked')}
                                    title="Bloquear Usuário"
                                  >
                                    Bloquear
                                  </button>
                                ) : (
                                  <button
                                    className="btn btn-primary btn-sm"
                                    style={{ backgroundColor: 'var(--success)', color: 'white' }}
                                    onClick={() => userHook.updateUserStatus(u.id, 'active')}
                                    title="Desbloquear Usuário"
                                  >
                                    Ativar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="pagination">
                  <div className="pagination-info">
                    Total de {userHook.totalCount} usuários
                  </div>
                  <div className="pagination-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={userHook.page === 1}
                      onClick={() => userHook.setPage(p => p - 1)}
                    >
                      Anterior
                    </button>
                    <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center' }}>
                      Página {userHook.page}
                    </span>
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={userHook.users.length < 20}
                      onClick={() => userHook.setPage(p => p + 1)}
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB: STORIES ================= */}
          {activeTab === 'stories' && (
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
                    <label>Filtrar por UF</label>
                    <select
                      className="select-field"
                      value={storyHook.stateFilter}
                      onChange={(e) => {
                        storyHook.setStateFilter(e.target.value);
                        storyHook.setPage(1);
                      }}
                    >
                      <option value="all">Todos (Nacional/UF)</option>
                      <option value="national">Apenas Nacional</option>
                      {ESTADOS_BRASIL.map(uf => (
                        <option key={uf.value} value={uf.value}>{uf.value} - {uf.label}</option>
                      ))}
                    </select>
                  </div>
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

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-secondary" onClick={() => setAddChannelModalOpen(true)}>
                    <Plus size={16} /> Novo Canal
                  </button>
                  <button className="btn btn-primary" onClick={handleOpenAddStory}>
                    <Plus size={16} /> Novo Story Item
                  </button>
                </div>
              </div>

              {/* Split screen: channels on left, stories on right */}
              <div style={{ display: 'grid', gridTemplateColumns: '0.85fr 1.15fr', gap: '24px' }}>
                {/* Channels List */}
                <div style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Canais de Stories</h3>
                  {storyHook.channels.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>Nenhum canal criado.</p>
                  ) : (
                    <div style={{ display: 'flex', overflowX: 'hidden', flexDirection: 'column', gap: '12px', flex: 1 }}>
                      {storyHook.channels.map((ch) => {
                        const activeCount = (ch.story_items || []).filter((item: any) => 
                          item.status === 'active' && 
                          item.data_expiracao >= new Date().toISOString().split('T')[0]
                        ).length;
                        const isSelected = ch.id === storyHook.selectedChannelId;

                        return (
                          <div
                            key={ch.id}
                            onClick={() => storyHook.setSelectedChannelId(ch.id)}
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
                                  {ch.name[0]}
                                </div>
                              )}
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                                  <span style={{ fontWeight: 600, fontSize: '14px', color: isSelected ? 'var(--primary)' : 'inherit' }}>{ch.name}</span>
                                  {ch.state ? (
                                    <span 
                                      style={{ 
                                        fontSize: '9px', 
                                        padding: '2px 6px', 
                                        borderRadius: '4px',
                                        backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                                        color: 'var(--primary)',
                                        fontWeight: 600
                                      }}
                                    >
                                      {ch.city ? `${ch.city}/${ch.state}` : ch.state}
                                    </span>
                                  ) : (
                                    <span 
                                      style={{ 
                                        fontSize: '9px', 
                                        padding: '2px 6px', 
                                        borderRadius: '4px',
                                        backgroundColor: 'var(--bg-app)', 
                                        color: 'var(--text-muted)',
                                        border: '1px solid var(--border-light)',
                                        fontWeight: 600
                                      }}
                                    >
                                      Nacional
                                    </span>
                                  )}
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
                                  onClick={() => storyHook.updateChannel(ch.id, { is_destaque: !ch.is_destaque })}
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
                                  onClick={() => storyHook.updateChannel(ch.id, { is_active: !ch.is_active })}
                                >
                                  {ch.is_active ? 'Desativar' : 'Ativar'}
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  style={{ padding: '4px 8px', color: 'var(--danger)', background: 'transparent' }}
                                  onClick={() => storyHook.deleteChannel(ch.id)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
                            storyHook.setPage(p => p - 1);
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
                            storyHook.setPage(p => p + 1);
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
                <div style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Stories Publicados</h3>
                  {storyHook.items.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>Nenhum story publicado neste filtro.</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
                      {storyHook.items.map((item: any) => {
                        const todayStr = new Date().toISOString().split('T')[0];
                        const isExpired = item.data_expiracao < todayStr;

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
                            <div style={{ height: '180px', backgroundColor: 'black', position: 'relative' }}>
                              {item.media_type === 'image' ? (
                                <img src={item.media_url} alt="Story" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                              ) : (
                                <video src={item.media_url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} controls={false} />
                              )}
                              <span
                                className={`badge ${isExpired ? 'badge-danger' : 'badge-success'}`}
                                style={{ 
                                  position: 'absolute', 
                                  top: '8px', 
                                  right: '8px', 
                                  backgroundColor: isExpired ? '#6b7280' : undefined 
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
                                <Calendar size={10} /> Expira em: {new Date(item.data_expiracao).toLocaleDateString()}
                              </span>
                            </div>

                            <div style={{ display: 'flex', borderTop: '1px solid var(--border-light)' }}>
                              <button
                                onClick={() => storyHook.updateItemStatus(item.id, item.status === 'active' ? 'expired' : 'active')}
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
                                onClick={() => handleOpenEditStory(item)}
                                style={{
                                  padding: '8px 10px',
                                  background: 'none',
                                  border: 'none',
                                  borderRight: '1px solid var(--border-light)',
                                  cursor: 'pointer',
                                  color: 'var(--text-muted)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                title="Editar"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() => storyHook.deleteItem(item.id)}
                                style={{
                                  padding: '8px 10px',
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
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB: REPORTS ================= */}
          {activeTab === 'reports' && (
            <div>
              {/* Filters Bar */}
              <div className="filters-bar">
                <div className="filters-group">
                  <div className="filter-control">
                    <label>Filtrar Status</label>
                    <select
                      className="select-field"
                      value={reportHook.statusFilter || ''}
                      onChange={(e) => {
                        reportHook.setStatusFilter((e.target.value as any) || undefined);
                        reportHook.setPage(1);
                      }}
                    >
                      <option value="">Todos</option>
                      <option value="new">Novas</option>
                      <option value="in_review">Em Análise</option>
                      <option value="resolved">Resolvidas</option>
                      <option value="ignored">Ignoradas</option>
                    </select>
                  </div>

                  <div className="filter-control">
                    <label>Tipo de Alvo</label>
                    <select
                      className="select-field"
                      value={reportHook.targetTypeFilter || ''}
                      onChange={(e) => {
                        reportHook.setTargetTypeFilter((e.target.value as any) || undefined);
                        reportHook.setPage(1);
                      }}
                    >
                      <option value="">Todos</option>
                      <option value="user">Usuário</option>
                      <option value="work">Obra</option>
                      <option value="proposal">Proposta</option>
                      <option value="budget">Orçamento</option>
                      <option value="content">Conteúdo</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Reports Table */}
              <div className="table-container">
                <div className="table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Alvo</th>
                        <th>Categoria / Motivo</th>
                        <th>Descrição</th>
                        <th>Data</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportHook.loading ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                            Carregando denúncias...
                          </td>
                        </tr>
                      ) : reportHook.reports.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                            Nenhuma denúncia cadastrada.
                          </td>
                        </tr>
                      ) : (
                        reportHook.reports.map((rep) => (
                          <tr key={rep.id}>
                            <td>
                              <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{rep.target_type}</span>
                              <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)' }}>{rep.target_id.slice(0, 8)}...</span>
                            </td>
                            <td>{rep.reason}</td>
                            <td style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {rep.description || 'Sem descrição'}
                            </td>
                            <td>{new Date(rep.created_at).toLocaleDateString()}</td>
                            <td>
                              <span className={`badge ${rep.status === 'new' ? 'badge-danger' : rep.status === 'in_review' ? 'badge-warning' : rep.status === 'resolved' ? 'badge-success' : 'badge-secondary'}`}>
                                {rep.status}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleOpenReportDetails(rep)}
                              >
                                Analisar
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="pagination">
                  <div className="pagination-info">
                    Total de {reportHook.totalCount} denúncias
                  </div>
                  <div className="pagination-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={reportHook.page === 1}
                      onClick={() => reportHook.setPage(p => p - 1)}
                    >
                      Anterior
                    </button>
                    <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center' }}>
                      Página {reportHook.page}
                    </span>
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={reportHook.reports.length < 20}
                      onClick={() => reportHook.setPage(p => p + 1)}
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB: SETTINGS ================= */}
          {activeTab === 'settings' && (
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
                <button className="btn btn-primary" style={{ width: 'fit-content' }} onClick={() => alert('Configurações salvas.')}>
                  Salvar Alterações
                </button>
              </div>
            </div>
          )}

          {/* ================= TAB: BANNERS ================= */}
          {activeTab === 'banners' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                  Gerencie os banners do carrossel principal do aplicativo móvel. O app exibe no máximo os 5 banners ativos mais recentes.
                </p>
                <button className="btn btn-primary" onClick={handleOpenAddBanner}>
                  <Plus size={16} /> Novo Banner
                </button>
              </div>

              {/* Banners em Exibição (Máx 5) */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)' }}></span>
                  Banners em Exibição no App (Máx 5 ativos mais recentes)
                </h3>
                {(() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const activeBanners = bannersHook.banners
                    .filter(b => b.status === 'active' && b.data_expiracao >= todayStr)
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
                      {activeBanners.map((banner) => (
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
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Calendar size={12} /> Expira em: {new Date(banner.data_expiracao).toLocaleDateString()}
                            </div>
                          </div>
                          <div style={{ display: 'flex', borderTop: '1px solid var(--border-light)' }}>
                            <button
                              onClick={() => handleToggleBannerStatus(banner)}
                              style={{ flex: 1, padding: '10px', background: 'none', border: 'none', borderRight: '1px solid var(--border-light)', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                            >
                              Expirar
                            </button>
                            <button
                              onClick={() => handleOpenEditBanner(banner)}
                              style={{ padding: '10px 16px', background: 'none', border: 'none', borderRight: '1px solid var(--border-light)', cursor: 'pointer', color: 'var(--text-muted)' }}
                              title="Editar"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => bannersHook.deleteBanner(banner.id)}
                              style={{ padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
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

              {/* Histórico de Banners / Banners Expirados */}
              <div>
                <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--text-muted)' }}></span>
                  Histórico de Banners / Não Exibidos (Expirados ou Inativos)
                </h3>
                {(() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  // Top 5 active banners IDs
                  const activeBannersIds = bannersHook.banners
                    .filter(b => b.status === 'active' && b.data_expiracao >= todayStr)
                    .slice(0, 5)
                    .map(b => b.id);

                  const historicalBanners = bannersHook.banners.filter(b => !activeBannersIds.includes(b.id));

                  if (historicalBanners.length === 0) {
                    return (
                      <div style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', color: 'var(--text-muted)', textAlign: 'center' }}>
                        Nenhum banner no histórico.
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                      {historicalBanners.map((banner) => {
                        const isExpired = banner.status === 'expired' || banner.data_expiracao < todayStr;
                        return (
                          <div
                            key={banner.id}
                            style={{
                              backgroundColor: 'var(--bg-card)',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--border-light)',
                              overflow: 'hidden',
                              display: 'flex',
                              flexDirection: 'column',
                              opacity: 0.75
                            }}
                          >
                            <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', backgroundColor: '#f0f0f0' }}>
                              <img
                                src={banner.image_url}
                                alt={banner.title || 'Banner'}
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                              <span className={`badge ${isExpired ? 'badge-danger' : 'badge-warning'}`} style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: isExpired ? '#6b7280' : undefined }}>
                                {isExpired ? 'Expirado' : 'Inativo (Fora do Top 5)'}
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
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Calendar size={12} /> Expira em: {new Date(banner.data_expiracao).toLocaleDateString()}
                              </div>
                            </div>
                            <div style={{ display: 'flex', borderTop: '1px solid var(--border-light)' }}>
                              <button
                                onClick={() => handleToggleBannerStatus(banner)}
                                style={{ flex: 1, padding: '10px', background: 'none', border: 'none', borderRight: '1px solid var(--border-light)', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                              >
                                {banner.status === 'active' ? 'Desativar' : 'Reativar'}
                              </button>
                              <button
                                onClick={() => handleOpenEditBanner(banner)}
                                style={{ padding: '10px 16px', background: 'none', border: 'none', borderRight: '1px solid var(--border-light)', cursor: 'pointer', color: 'var(--text-muted)' }}
                                title="Editar"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => bannersHook.deleteBanner(banner.id)}
                                style={{ padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
                                title="Excluir"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ================= MODAL: USER DETAILS ================= */}
      {userModalOpen && userHook.selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setUserModalOpen(false)}>
              <X size={20} />
            </button>
            <h3 className="modal-title">Detalhes do Usuário</h3>

            <div className="modal-grid-2">
              <div className="modal-field">
                <span className="label">Nome Completo</span>
                <span className="value">{userHook.selectedUser.name || 'Não fornecido'}</span>
              </div>
              <div className="modal-field">
                <span className="label">E-mail</span>
                <span className="value">{userHook.selectedUser.email || 'Não fornecido'}</span>
              </div>
              <div className="modal-field">
                <span className="label">Telefone</span>
                <span className="value">{userHook.selectedUser.phone || 'Não fornecido'}</span>
              </div>
              <div className="modal-field">
                <span className="label">Tipo de Documento</span>
                <span className="value" style={{ textTransform: 'uppercase' }}>
                  {userHook.selectedUser.document_type || 'Nenhum'}
                </span>
              </div>
              <div className="modal-field">
                <span className="label">Nacionalidade</span>
                <span className="value">{userHook.selectedUser.nationality || 'Não informado'}</span>
              </div>
              <div className="modal-field">
                <span className="label">Estado Civil</span>
                <span className="value">{userHook.selectedUser.marital_status || 'Não informado'}</span>
              </div>
              <div className="modal-field">
                <span className="label">Status</span>
                <span className="value">
                  <span className={`badge ${userHook.selectedUser.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                    {userHook.selectedUser.status}
                  </span>
                </span>
              </div>
              <div className="modal-field">
                <span className="label">Papéis</span>
                <span className="value">
                  {userHook.selectedUser.role_flags?.join(' & ') || 'Nenhum'}
                </span>
              </div>
            </div>

            {/* Profile Bio */}
            <div style={{ marginBottom: '24px' }}>
              <span className="label" style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Bio / Apresentação</span>
              <p style={{ fontSize: '14px', marginTop: '6px', padding: '12px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)' }}>
                {userHook.selectedUser.user_profiles?.[0]?.bio || 'Sem biografia cadastrada.'}
              </p>
            </div>

            {/* Base address */}
            <div style={{ marginBottom: '24px' }}>
              <span className="label" style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Endereço Base</span>
              {userHook.selectedUser.addresses?.filter((a: any) => a.type === 'base').map((addr: any) => (
                <div key={addr.id} style={{ fontSize: '14px', marginTop: '6px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <MapPin size={14} color="var(--primary)" />
                  <span>{addr.street}, {addr.number} - {addr.district}, {addr.city} - {addr.state}</span>
                </div>
              )) || <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Nenhum endereço cadastrado.</p>}
            </div>

            {/* Coverage Areas */}
            {userHook.selectedUser.role_flags?.includes('profissional') && (
              <div style={{ marginBottom: '24px' }}>
                <span className="label" style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Área de Cobertura</span>
                {userHook.selectedUser.professional_coverages?.[0]?.nationwide ? (
                  <p style={{ fontSize: '14px', marginTop: '6px' }}>Atua em todo o Brasil</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                    {userHook.selectedUser.professional_coverages?.[0]?.states?.map((st: string) => (
                      <span key={st} className="badge badge-info" style={{ textTransform: 'none' }}>
                        Estado: {st}
                      </span>
                    ))}
                    {userHook.selectedUser.professional_coverages?.[0]?.cities?.map((ct: any) => (
                      <span key={ct.city_id} className="badge badge-info" style={{ textTransform: 'none' }}>
                        {ct.city_name} ({ct.state})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT USER ================= */}
      {editUserModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setEditUserModalOpen(false)}>
              <X size={20} />
            </button>
            <h3 className="modal-title">Editar Cadastro</h3>

            <form onSubmit={handleSaveUserEdit}>
              <div className="form-group">
                <label>Nome Completo</label>
                <input type="text" className="input-field" value={editUserName} onChange={(e) => setEditUserName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" className="input-field" value={editUserEmail} onChange={(e) => setEditUserEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Telefone</label>
                <input type="text" className="input-field" value={editUserPhone} onChange={(e) => setEditUserPhone(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Apresentação / Bio</label>
                <textarea className="textarea-field" style={{ minHeight: '80px', width: '100%' }} value={editUserBio} onChange={(e) => setEditUserBio(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditUserModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD CHANNEL ================= */}
      {addChannelModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setAddChannelModalOpen(false)}>
              <X size={20} />
            </button>
            <h3 className="modal-title">Novo Canal de Stories</h3>

            <form onSubmit={handleCreateChannel}>
              <div className="form-group">
                <label>Nome do Canal</label>
                <input type="text" className="input-field" value={newChannelName} onChange={(e) => setNewChannelName(e.target.value)} placeholder="Ex: Siga Construtora" required />
              </div>
              <div className="form-group">
                <label>URL do Avatar</label>
                <input type="text" className="input-field" value={newChannelAvatar} onChange={(e) => setNewChannelAvatar(e.target.value)} placeholder="https://exemplo.com/avatar.jpg" />
              </div>
              
              <div className="form-group">
                <label>Abrangência do Canal</label>
                <select 
                  className="select-field" 
                  value={newChannelScope} 
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setNewChannelScope(val);
                    if (val === 'national') {
                      setNewChannelState('');
                      setNewChannelCity('');
                    } else if (val === 'state') {
                      setNewChannelCity('');
                    }
                  }}
                >
                  <option value="national">Nacional</option>
                  <option value="state">Estadual (Apenas um Estado)</option>
                  <option value="city">Municipal (Uma Cidade Específica)</option>
                </select>
              </div>

              {newChannelScope !== 'national' && (
                <div className="form-group">
                  <label>Estado (UF)</label>
                  <select 
                    className="select-field" 
                    value={newChannelState} 
                    onChange={(e) => setNewChannelState(e.target.value)}
                    required
                  >
                    <option value="">Selecione o Estado</option>
                    {ESTADOS_BRASIL.map(uf => (
                      <option key={uf.value} value={uf.value}>{uf.value} - {uf.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {newChannelScope === 'city' && (
                <div className="form-group">
                  <label>Nome da Cidade</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={newChannelCity} 
                    onChange={(e) => setNewChannelCity(e.target.value)} 
                    placeholder="Ex: São Paulo" 
                    required 
                  />
                </div>
              )}
              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="destaque" checked={newChannelDestaque} onChange={(e) => setNewChannelDestaque(e.target.checked)} />
                <label htmlFor="destaque">Destaque (Aparece em primeiro no app)</label>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setAddChannelModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Criar Canal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD STORY ITEM ================= */}
      {addStoryModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setAddStoryModalOpen(false)}>
              <X size={20} />
            </button>
            <h3 className="modal-title">{editStoryId ? 'Editar Story Item' : 'Publicar Novo Story'}</h3>

            <form onSubmit={handleSaveStoryItem}>
              <div className="form-group">
                <label>Canal Vinculado</label>
                <select className="select-field" value={newStoryChannelId} onChange={(e) => setNewStoryChannelId(e.target.value)} required>
                  <option value="">Selecione o canal</option>
                  {storyHook.channels.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Tipo de Mídia Detectado</label>
                  <select className="select-field" value={newStoryMediaType} onChange={(e) => setNewStoryMediaType(e.target.value as any)} disabled>
                    <option value="image">Imagem</option>
                    <option value="video">Vídeo</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Data de Expiração</label>
                  <input type="date" className="input-field" value={newStoryExpiration} onChange={(e) => setNewStoryExpiration(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label>Mídia (Arraste imagem ou vídeo ou selecione o arquivo)</label>
                <FileUploadZone
                  mediaUrl={newStoryMediaUrl}
                  setMediaUrl={setNewStoryMediaUrl}
                  mediaType={newStoryMediaType}
                  setMediaType={setNewStoryMediaType}
                  allowedTypes={[
                    'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif',
                    'video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska', 'video/ogg'
                  ]}
                  folder="stories"
                />
              </div>

              {renderLinkConfigFields(
                newStoryLinkType,
                setNewStoryLinkType,
                newStoryLinkRawValue,
                setNewStoryLinkRawValue,
                newStoryLinkCustomRoute,
                setNewStoryLinkCustomRoute,
                newStoryLinkLabel,
                setNewStoryLinkLabel
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setAddStoryModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editStoryId ? 'Salvar Alterações' : 'Publicar Story'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: REPORT DETAILS ================= */}
      {reportModalOpen && selectedReport && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <button className="modal-close" onClick={() => setReportModalOpen(false)}>
              <X size={20} />
            </button>
            <h3 className="modal-title">Detalhes da Denúncia</h3>

            <div className="modal-grid-2">
              <div className="modal-field">
                <span className="label">Categoria / Motivo</span>
                <span className="value">{selectedReport.reason}</span>
              </div>
              <div className="modal-field">
                <span className="label">Data de Envio</span>
                <span className="value">{new Date(selectedReport.created_at).toLocaleDateString()}</span>
              </div>
              <div className="modal-field">
                <span className="label">Tipo do Alvo</span>
                <span className="value" style={{ textTransform: 'capitalize' }}>{selectedReport.target_type}</span>
              </div>
              <div className="modal-field">
                <span className="label">ID do Alvo</span>
                <span className="value">{selectedReport.target_id}</span>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <span className="label" style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Descrição do Relato</span>
              <p style={{ fontSize: '14px', marginTop: '6px', padding: '12px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)' }}>
                {selectedReport.description || 'Sem descrição fornecida pelo denunciante.'}
              </p>
            </div>

            {selectedReport.attachment_urls && selectedReport.attachment_urls.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <span className="label" style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Anexos</span>
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  {selectedReport.attachment_urls.map((url: string, index: number) => (
                    <a key={index} href={url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={14} /> Anexo {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label>Observações Internas (Admin)</label>
              <textarea
                className="textarea-field"
                style={{ width: '100%', minHeight: '80px' }}
                placeholder="Adicione notas sobre a investigação ou providências tomadas..."
                value={reportNotes}
                onChange={(e) => setReportNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
              <div>
                {selectedReport.status === 'new' && (
                  <button className="btn btn-secondary" onClick={() => handleUpdateReportStatus('in_review')}>
                    Marcar Em Análise
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-danger" onClick={() => handleUpdateReportStatus('ignored')}>
                  Ignorar / Sem Sanção
                </button>
                <button className="btn btn-primary" style={{ backgroundColor: 'var(--success)' }} onClick={() => handleUpdateReportStatus('resolved')}>
                  Resolver / Aplicar Ação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD BANNER ================= */}
      {addBannerModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setAddBannerModalOpen(false)}>
              <X size={20} />
            </button>
            <h3 className="modal-title">{editBannerId ? 'Editar Banner' : 'Criar Novo Banner'}</h3>

            <form onSubmit={handleSaveBanner}>
              <div className="grid-2">
                <div className="form-group">
                  <label>Título do Banner (Opcional)</label>
                  <input
                    type="text"
                    className="input-field"
                    value={bannerTitle}
                    onChange={(e) => setBannerTitle(e.target.value)}
                    placeholder="Ex: Oferta Especial de Junho"
                  />
                </div>
                <div className="form-group">
                  <label>Subtítulo do Banner (Opcional)</label>
                  <input
                    type="text"
                    className="input-field"
                    value={bannerSubtitle}
                    onChange={(e) => setBannerSubtitle(e.target.value)}
                    placeholder="Ex: Descontos de até 30% em serviços"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Data de Expiração</label>
                <input
                  type="date"
                  className="input-field"
                  value={bannerExpiration}
                  onChange={(e) => setBannerExpiration(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Imagem do Banner (Relação de Aspecto Recomendada: 16:9)</label>
                <FileUploadZone
                  mediaUrl={bannerImageUrl}
                  setMediaUrl={setBannerImageUrl}
                  mediaType="image"
                  setAspectRatioWarning={setBannerAspectWarning}
                  allowedTypes={['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']}
                  folder="banners"
                />
                {bannerAspectWarning && (
                  <div className="banner-aspect-ratio-warning">
                    <AlertTriangle size={16} />
                    <span>A imagem enviada não possui a proporção ideal de 16:9. Ela pode ficar distorcida ou cortada no carrossel do aplicativo.</span>
                  </div>
                )}
              </div>

              {renderLinkConfigFields(
                bannerLinkType,
                setBannerLinkType,
                bannerLinkRawValue,
                setBannerLinkRawValue,
                bannerLinkCustomRoute,
                setBannerLinkCustomRoute,
                bannerLinkLabel,
                setBannerLinkLabel
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setAddBannerModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editBannerId ? 'Salvar Alterações' : 'Criar Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
