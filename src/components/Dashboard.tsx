/* eslint-disable complexity */
"use client";

import React, { useState, useEffect } from 'react';
import { useUsers } from '../hooks/useUsers';
import { useReports } from '../hooks/useReports';
import { useStories } from '../hooks/useStories';
import { useBanners } from '../hooks/useBanners';
import { uploadToR2 } from '../services/storageService';
import { supabase } from '../lib/supabase';
import { storiesService } from '../services/storiesService';
import { notificationsService } from '../services/notificationsService';
import { useToast } from '../hooks/useToast';
import { Country, State, City } from 'country-state-city';
import logoImg from '../assets/logo.png';
import ImageCropperModal from './ImageCropperModal';
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
  Link as LinkIcon,
  Menu,
  Bell,
  Star,
  Mail,
  Globe,
  Send,
  MessageSquare,
  Phone,
  Award
} from 'lucide-react';

const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const decodeBase64 = (str: string): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let decoded = '';
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '=') break;
    const value = chars.indexOf(char);
    if (value === -1) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      decoded += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return decoded;
};

const decodeDocumentHash = (docHash: string | null | undefined): string => {
  if (!docHash) return '';
  const parts = docHash.split(':');
  if (parts.length < 3) return '';
  try {
    const unmasked = decodeBase64(parts[2]);
    if (unmasked.length === 11) {
      return unmasked.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (unmasked.length === 14) {
      return unmasked.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return unmasked;
  } catch {
    return '';
  }
};

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
  if (url.startsWith('/works/')) {
    const workId = url.split('/works/')[1] || '';
    return { type: 'internal', rawValue: 'work', customRoute: workId };
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
    if (rawValue === 'work') {
      return `/works/${customRoute}`;
    }
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
  forceCrop?: boolean;
  aspectRatio?: '9:16' | '1:1' | '16:9';
}

function FileUploadZone({
  mediaUrl,
  setMediaUrl,
  mediaType,
  setMediaType,
  setAspectRatioWarning,
  allowedTypes,
  folder,
  forceCrop,
  aspectRatio
}: FileUploadZoneProps) {
  const { error } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState('Enviando arquivo...');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const trimVideoTo15Seconds = (file: File): Promise<Blob | File> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = () => {
        if (video.duration <= 15.5) {
          resolve(file);
          return;
        }

        const stream = (video as any).captureStream ? (video as any).captureStream() : null;
        if (!stream) {
          resolve(file);
          return;
        }

        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        const chunks: BlobPart[] = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const trimmedBlob = new Blob(chunks, { type: 'video/webm' });
          resolve(trimmedBlob);
        };

        video.play().then(() => {
          mediaRecorder.start();
          setTimeout(() => {
            mediaRecorder.stop();
            video.pause();
            URL.revokeObjectURL(video.src);
          }, 15000); // Para a gravação exatamente em 15 segundos
        }).catch(() => {
          resolve(file);
        });
      };

      video.onerror = () => {
        resolve(file);
      };
    });
  };

  const uploadProcessedFile = async (fileToUpload: File) => {
    setUploading(true);
    setUploadStatus('Preparando arquivo...');
    try {
      let fileToSend: File | Blob = fileToUpload;
      if (fileToUpload.type.startsWith('video/')) {
        setUploadStatus('Cortando vídeo para 15 segundos (aguarde)...');
        fileToSend = await trimVideoTo15Seconds(fileToUpload);
      }
      setUploadStatus('Enviando arquivo...');
      const filename = `${Date.now()}-${fileToUpload.name.replace(/\s+/g, '_')}`;
      const contentType = fileToSend.type || fileToUpload.type;
      const res = await uploadToR2(fileToSend, filename, contentType, folder);
      setMediaUrl(res.publicUrl);
    } catch (err: any) {
      console.error(err);
      error('Falha ao enviar arquivo: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const processFile = async (selectedFile: File) => {
    if (!allowedTypes.includes(selectedFile.type)) {
      error(`Formato de arquivo inválido. Apenas os formatos ${allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')} são aceitos.`);
      return;
    }

    if (selectedFile.type.startsWith('video/')) {
      if (setMediaType) setMediaType('video');
    } else {
      if (setMediaType) setMediaType('image');
    }

    if (!forceCrop && setAspectRatioWarning && selectedFile.type.startsWith('image/')) {
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

    if (forceCrop && selectedFile.type.startsWith('image/')) {
      setCropFile(selectedFile);
    } else {
      await uploadProcessedFile(selectedFile);
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
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{uploadStatus}</p>
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

      {cropFile && (
        <ImageCropperModal
          file={cropFile}
          aspectRatio={aspectRatio}
          onCrop={async (cropped) => {
            setCropFile(null);
            await uploadProcessedFile(cropped);
          }}
          onClose={() => setCropFile(null)}
        />
      )}
    </div>
  );
}

interface HistoricalBannerCardProps {
  banner: any;
  todayStr: string;
  onToggleStatus: (banner: any) => void;
  onDelete: (banner: any) => void;
}

function HistoricalBannerCard({
  banner,
  todayStr,
  onToggleStatus,
  onDelete
}: HistoricalBannerCardProps) {
  const title = banner.title || 'Sem título';
  const subtitle = banner.subtitle || 'Sem subtítulo';
  const linkLabel = banner.link_label || 'Ver Mais';
  const toggleText = (banner.status === 'active' || banner.status === 'scheduled') ? 'Desativar' : 'Reativar';

  let badgeClass = 'badge-warning';
  let badgeBg: string | undefined = undefined;
  let badgeText = 'Ativo (Fora do Top 5)';

  if (banner.status === 'scheduled') {
    badgeClass = 'badge-info';
    badgeBg = '#3b82f6';
    badgeText = 'Agendado';
  } else if (banner.status === 'expired') {
    badgeClass = 'badge-danger';
    badgeBg = '#6b7280';
    badgeText = 'Expirado';
  } else if (banner.status === 'deactivated') {
    badgeClass = 'badge-danger';
    badgeBg = '#ef4444';
    badgeText = 'Desativado';
  }

  return (
    <div
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
          alt={title}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <span className={`badge ${badgeClass}`} style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: badgeBg }}>
          {badgeText}
        </span>
      </div>
      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <h4 style={{ fontSize: '15px', fontWeight: 600 }}>{title}</h4>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{subtitle}</p>
        {banner.link_url && (
          <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)' }}>
            <LinkIcon size={12} />
            <a href={banner.link_url} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
              {linkLabel}
            </a>
          </div>
        )}
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={10} /> Abrangência: {banner.scope === 'global' ? 'Global' : banner.scope === 'national' ? `Nacional (${banner.country || 'Brasil'})` : banner.scope === 'state' ? `Estadual (${banner.state || ''})` : banner.scope === 'city' ? `Municipal (${banner.city || ''}/${banner.state || ''})` : banner.scope || 'Global'}
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
          onClick={() => onToggleStatus(banner)}
          style={{ flex: 1, padding: '10px', background: 'none', border: 'none', borderRight: '1px solid var(--border-light)', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
        >
          {toggleText}
        </button>
        <button
          onClick={() => onDelete(banner)}
          style={{ padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
          title="Excluir"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

interface ChannelRowProps {
  ch: any;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onToggleDestaque: (id: string, current: boolean) => void;
  onToggleActive: (id: string, current: boolean) => void;
  onEdit: (channel: any) => void;
  onDelete: (channel: any) => void;
}

function ChannelRow({
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

interface DashboardProps {
  onLogout: () => void;
  adminUsername: string;
}

export default function Dashboard({ onLogout, adminUsername }: DashboardProps) {
  const { success, error, warning, info } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'stories' | 'reports' | 'settings' | 'banners'>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Custom Hooks
  const userHook = useUsers();
  const reportHook = useReports();
  const storyHook = useStories();
  const bannersHook = useBanners();

  const currentUserEmail = adminUsername;

  // Custom Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { }
  });

  // Edit channel state
  const [editChannelId, setEditChannelId] = useState<string | null>(null);

  // Modals state
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [selectedUserTab, setSelectedUserTab] = useState<'portfolio' | 'specialties' | 'location' | 'contacts' | 'works'>('portfolio');
  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState<any | null>(null);
  const [lightboxMainImage, setLightboxMainImage] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [addChannelModalOpen, setAddChannelModalOpen] = useState(false);
  const [addStoryModalOpen, setAddStoryModalOpen] = useState(false);
  const [addBannerModalOpen, setAddBannerModalOpen] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<{ url: string, type: 'image' | 'video' } | null>(null);

  // Notification state
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [notificationUserId, setNotificationUserId] = useState('');
  const [notificationUserName, setNotificationUserName] = useState('');
  const [notificationUserEmail, setNotificationUserEmail] = useState('');
  const [notificationSubjectSelect, setNotificationSubjectSelect] = useState('Atualização cadastral pendente');
  const [notificationSubjectCustom, setNotificationSubjectCustom] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationSending, setNotificationSending] = useState(false);

  // Block user state
  const [blockUserModalOpen, setBlockUserModalOpen] = useState(false);
  const [blockUserId, setBlockUserId] = useState('');
  const [blockUserName, setBlockUserName] = useState('');
  const [blockReasonText, setBlockReasonText] = useState('');

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
  const [newChannelCountry, setNewChannelCountry] = useState('Brazil');
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
  const [savingStory, setSavingStory] = useState(false);

  // Add/Edit banner state
  const [editBannerId, setEditBannerId] = useState('');
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [bannerLinkType, setBannerLinkType] = useState<'none' | 'whatsapp' | 'external' | 'internal'>('none');
  const [bannerLinkRawValue, setBannerLinkRawValue] = useState('');
  const [bannerLinkCustomRoute, setBannerLinkCustomRoute] = useState('');
  const [bannerLinkLabel, setBannerLinkLabel] = useState('');
  const [bannerInitialization, setBannerInitialization] = useState('');
  const [bannerExpiration, setBannerExpiration] = useState('');
  const [bannerAspectWarning, setBannerAspectWarning] = useState(false);
  const [bannerScope, setBannerScope] = useState<'national' | 'state'>('national');
  const [bannerCountry, setBannerCountry] = useState('Brazil');
  const [bannerState, setBannerState] = useState('');
  const [bannerCity, setBannerCity] = useState('');

  // Users list for redirection
  const [linkUsersList, setLinkUsersList] = useState<{ id: string; name: string | null }[]>([]);

  // State for paginating scheduled banners
  const [scheduledLimit, setScheduledLimit] = useState(5);

  useEffect(() => {
    setScheduledLimit(5);
  }, [
    bannersHook.scopeFilter,
    bannersHook.countryFilter,
    bannersHook.stateFilter,
    bannersHook.cityFilter
  ]);

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

  // States for Work Selection popup
  const [workSearchModalOpen, setWorkSearchModalOpen] = useState(false);
  const [workSearchQuery, setWorkSearchQuery] = useState('');
  const [worksList, setWorksList] = useState<any[]>([]);
  const [loadingWorks, setLoadingWorks] = useState(false);
  const [onWorkSelectCallback, setOnWorkSelectCallback] = useState<((workId: string, workTitle: string) => void) | null>(null);
  const [resolvedWorksMap, setResolvedWorksMap] = useState<Record<string, string>>({});
  const fetchedWorkIdsRef = React.useRef<Set<string>>(new Set());

  // States for Profile Selection popup
  const [profileSearchModalOpen, setProfileSearchModalOpen] = useState(false);
  const [profileSearchQuery, setProfileSearchQuery] = useState('');
  const [profilesList, setProfilesList] = useState<any[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [onProfileSelectCallback, setOnProfileSelectCallback] = useState<((profileId: string, profileName: string) => void) | null>(null);
  const [resolvedProfilesMap, setResolvedProfilesMap] = useState<Record<string, string>>({});
  const fetchedProfileIdsRef = React.useRef<Set<string>>(new Set());

  // Load works list for popup search
  const loadWorksForSearch = async (queryText: string) => {
    setLoadingWorks(true);
    try {
      let q = supabase
        .from('works')
        .select('id, title, city, state, status')
        .in('status', ['available', 'in_progress'])
        .order('created_at', { ascending: false });

      if (queryText.trim()) {
        q = q.ilike('title', `%${queryText}%`);
      }

      const { data, error: err } = await q.limit(20);
      if (err) throw err;
      setWorksList(data || []);

      // Update cache map with retrieved works
      if (data) {
        setResolvedWorksMap(prev => {
          const newMap = { ...prev };
          data.forEach((w: any) => {
            newMap[w.id] = w.title;
          });
          return newMap;
        });
      }
    } catch (err) {
      console.error('Erro ao buscar obras:', err);
    } finally {
      setLoadingWorks(false);
    }
  };

  // Trigger search when query or modal state changes
  useEffect(() => {
    if (workSearchModalOpen) {
      loadWorksForSearch(workSearchQuery);
    }
  }, [workSearchQuery, workSearchModalOpen]);

  // Fetch title of specific works if they are not in cache but selected in the form
  useEffect(() => {
    const fetchSingleWorkTitle = async (workId: string) => {
      if (!workId || fetchedWorkIdsRef.current.has(workId)) return;
      fetchedWorkIdsRef.current.add(workId);
      try {
        const { data, error: err } = await supabase
          .from('works')
          .select('title')
          .eq('id', workId)
          .single();
        if (!err && data) {
          setResolvedWorksMap(prev => ({
            ...prev,
            [workId]: (data as any).title
          }));
        } else {
          setResolvedWorksMap(prev => ({
            ...prev,
            [workId]: 'Obra não encontrada'
          }));
        }
      } catch (err) {
        console.error('Erro ao carregar título de obra:', err);
      }
    };

    if (bannerLinkType === 'internal' && bannerLinkRawValue === 'work' && bannerLinkCustomRoute) {
      fetchSingleWorkTitle(bannerLinkCustomRoute);
    }
    if (newStoryLinkType === 'internal' && newStoryLinkRawValue === 'work' && newStoryLinkCustomRoute) {
      fetchSingleWorkTitle(newStoryLinkCustomRoute);
    }
  }, [bannerLinkType, bannerLinkRawValue, bannerLinkCustomRoute, newStoryLinkType, newStoryLinkRawValue, newStoryLinkCustomRoute]);

  // Load profiles list for popup search
  const loadProfilesForSearch = async (queryText: string) => {
    setLoadingProfiles(true);
    try {
      let q = supabase
        .from('users')
        .select('id, name, email, phone')
        .order('name', { ascending: true });

      if (queryText.trim()) {
        q = q.ilike('name', `%${queryText}%`);
      }

      const { data, error: err } = await q.limit(20);
      if (err) throw err;
      setProfilesList(data || []);

      // Update cache map with retrieved profiles
      if (data) {
        setResolvedProfilesMap(prev => {
          const newMap = { ...prev };
          data.forEach((p: any) => {
            newMap[p.id] = p.name || 'Sem nome';
          });
          return newMap;
        });
      }
    } catch (err) {
      console.error('Erro ao buscar perfis:', err);
    } finally {
      setLoadingProfiles(false);
    }
  };

  // Trigger profile search when query or modal state changes
  useEffect(() => {
    if (profileSearchModalOpen) {
      loadProfilesForSearch(profileSearchQuery);
    }
  }, [profileSearchQuery, profileSearchModalOpen]);

  // Fetch name of specific profiles if they are not in cache but selected in the form
  useEffect(() => {
    const fetchSingleProfileName = async (profileId: string) => {
      if (!profileId || fetchedProfileIdsRef.current.has(profileId)) return;
      fetchedProfileIdsRef.current.add(profileId);
      try {
        const { data, error: err } = await supabase
          .from('users')
          .select('name')
          .eq('id', profileId)
          .single();
        if (!err && data) {
          setResolvedProfilesMap(prev => ({
            ...prev,
            [profileId]: (data as any).name || 'Sem nome'
          }));
        } else {
          setResolvedProfilesMap(prev => ({
            ...prev,
            [profileId]: 'Perfil não encontrado'
          }));
        }
      } catch (err) {
        console.error('Erro ao carregar nome do perfil:', err);
      }
    };

    const isProfileLink = (type: string, rawVal: string) => {
      return type === 'internal' && rawVal !== 'work' && rawVal !== 'custom' && rawVal !== '';
    };

    if (isProfileLink(bannerLinkType, bannerLinkRawValue)) {
      fetchSingleProfileName(bannerLinkRawValue);
    }
    if (isProfileLink(newStoryLinkType, newStoryLinkRawValue)) {
      fetchSingleProfileName(newStoryLinkRawValue);
    }
  }, [bannerLinkType, bannerLinkRawValue, newStoryLinkType, newStoryLinkRawValue]);


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
    const profile = Array.isArray(u.user_profiles) ? u.user_profiles[0] : u.user_profiles;
    setEditUserBio(profile?.bio || '');
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

  const handleOpenNotification = (userId: string, name: string | null, email: string | null) => {
    setNotificationUserId(userId);
    setNotificationUserName(name || 'Sem nome');
    setNotificationUserEmail(email || 'Sem email');
    setNotificationSubjectSelect('Atualização cadastral pendente');
    setNotificationSubjectCustom('');
    setNotificationMessage('');
    setNotificationSending(false);
    setNotificationModalOpen(true);
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalSubject = notificationSubjectSelect === 'outro' ? notificationSubjectCustom : notificationSubjectSelect;
    if (!finalSubject.trim()) {
      warning('Por favor, informe o assunto da notificação.');
      return;
    }
    if (!notificationMessage.trim()) {
      warning('Por favor, digite a mensagem da notificação.');
      return;
    }

    setNotificationSending(true);
    try {
      await notificationsService.sendNotification({
        userId: notificationUserId,
        title: finalSubject,
        body: notificationMessage,
      });
      success('Notificação enviada com sucesso!');
      setNotificationModalOpen(false);
    } catch (err: any) {
      error('Erro ao enviar notificação: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setNotificationSending(false);
    }
  };

  const handleOpenBlockModal = (userId: string, name: string | null) => {
    setBlockUserId(userId);
    setBlockUserName(name || 'Sem nome');
    setBlockReasonText('');
    setBlockUserModalOpen(true);
  };

  const handleConfirmBlockUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockReasonText.trim()) {
      warning('Por favor, informe o motivo do bloqueio.');
      return;
    }
    await userHook.updateUserStatus(blockUserId, 'blocked', blockReasonText);
    setBlockUserModalOpen(false);
  };

  const handleDeleteChannel = (ch: any) => {
    if (ch.user_id) {
      warning('Este canal está vinculado a um usuário e não pode ser excluído.');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Excluir Canal de Stories',
      message: 'Deseja realmente excluir este canal? Todos os stories vinculados serão deletados.',
      onConfirm: async () => {
        try {
          await storyHook.deleteChannelRaw(ch.id);
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const handleEditChannelClick = (ch: any) => {
    if (ch.user_id) {
      warning('Este canal está vinculado a um usuário e não pode ser editado.');
      return;
    }

    setEditChannelId(ch.id);
    setNewChannelName(ch.name);
    setNewChannelAvatar(ch.avatar_url || '');
    setNewChannelDestaque(ch.is_destaque);
    setNewChannelScope(ch.scope);
    setNewChannelCountry(ch.country || 'Brazil');
    setNewChannelState(ch.state || '');
    setNewChannelCity(ch.city || '');
    setAddChannelModalOpen(true);
  };

  const handleDeleteStoryClick = (item: any) => {
    if (selectedChannel?.user_id) {
      warning('Este story pertence a um canal vinculado a um usuário e não pode ser removido.');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Excluir Story',
      message: 'Deseja realmente excluir este story?',
      onConfirm: async () => {
        try {
          await storyHook.deleteItemRaw(item.id);
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const handleExpireStoryClick = (item: any) => {
    if (selectedChannel?.user_id || item.user_id) {
      warning('Este story pertence a um canal vinculado a um usuário e não pode ser expirado.');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: item.status === 'active' ? 'Expirar Story' : 'Ativar Story',
      message: `Deseja realmente ${item.status === 'active' ? 'expirar' : 'ativar'} este story?`,
      onConfirm: async () => {
        try {
          await storyHook.updateItemStatus(item.id, item.status === 'active' ? 'expired' : 'active');
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const handleDeleteBannerClick = (banner: any) => {
    if (banner.user_id) {
      warning('Este banner está vinculado a um usuário e não pode ser excluído.');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Excluir Banner',
      message: 'Deseja realmente excluir este banner?',
      onConfirm: async () => {
        try {
          await bannersHook.deleteBannerRaw(banner.id);
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName) return;

    const channelData = {
      name: newChannelName,
      avatar_url: newChannelAvatar || null,
      is_destaque: newChannelDestaque,
      scope: newChannelScope,
      country: newChannelCountry || null,
      state: (newChannelScope === 'state' || newChannelScope === 'city') ? newChannelState || null : null,
      city: newChannelScope === 'city' ? newChannelCity || null : null
    } as any;

    try {
      if (editChannelId) {
        await storyHook.updateChannel(editChannelId, channelData);
        success('Canal atualizado com sucesso!');
      } else {
        await storyHook.createChannel({ ...channelData, is_active: true });
        success('Canal criado com sucesso!');
      }
    } catch (err: any) {
      console.error(err);
      error('Ocorreu um erro ao salvar o canal: ' + err.message);
    }

    setEditChannelId(null);
    setNewChannelName('');
    setNewChannelAvatar('');
    setNewChannelDestaque(false);
    setNewChannelScope('national');
    setNewChannelCountry('Brazil');
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
    setNewStoryExpiration(item.expiration_date);
    setAddStoryModalOpen(true);
  };

  const handleSaveStoryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoryChannelId || !newStoryMediaUrl || !newStoryExpiration) {
      warning('Preencha os campos obrigatórios.');
      return;
    }

    const todayStr = getTodayStr();
    if (newStoryExpiration < todayStr) {
      warning('A data de expiração não pode ser anterior à data de hoje.');
      return;
    }

    setSavingStory(true);

    const assembledLink = assembleLinkUrl(newStoryLinkType, newStoryLinkRawValue, newStoryLinkCustomRoute);
    let finalLabel = newStoryLinkLabel || null;
    if (newStoryLinkType === 'whatsapp' && !finalLabel) finalLabel = 'Falar no WhatsApp';
    if (newStoryLinkType === 'external' && !finalLabel) finalLabel = 'Acessar Link';
    if (newStoryLinkType === 'internal') {
      if (!finalLabel) {
        finalLabel = newStoryLinkRawValue === 'custom' ? 'Ver Mais' : 'Ver Perfil';
      }
    }

    const itemData = {
      channel_id: newStoryChannelId,
      media_url: newStoryMediaUrl,
      media_type: newStoryMediaType,
      link_url: assembledLink,
      link_label: finalLabel,
      status: 'active' as 'active' | 'expired',
      expiration_date: newStoryExpiration
    };

    try {
      if (editStoryId) {
        await storiesService.updateStoryItem(editStoryId, itemData);
        await storyHook.refetch();
        success('Story atualizado com sucesso!');
      } else {
        await storyHook.createItem(itemData);
        success('Story publicado com sucesso!');
      }
      setAddStoryModalOpen(false);
    } catch (err: any) {
      console.error(err);
      error('Ocorreu um erro ao salvar o story: ' + err.message);
    } finally {
      setSavingStory(false);
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
    setBannerInitialization(getTodayStr());
    setBannerExpiration('');
    setBannerAspectWarning(false);
    setBannerScope('national');
    setBannerCountry('Brazil');
    setBannerState('');
    setBannerCity('');
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
    setBannerInitialization(banner.initialization_date || getTodayStr());
    setBannerExpiration(banner.expiration_date);
    setBannerAspectWarning(false);
    setBannerScope(banner.scope || 'national');
    setBannerCountry(banner.country || 'Brazil');
    setBannerState(banner.state || '');
    setBannerCity(banner.city || '');
    setAddBannerModalOpen(true);
  };

  const getNextDay = (dateStr: string): string => {
    const date = new Date(dateStr + 'T12:00:00');
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
  };

  const formatToDDMMYYYY = (dateStr: string): string => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const checkBannerAvailability = async (
    targetBanner: {
      id?: string;
      scope: string;
      country: string | null;
      state: string | null;
      city: string | null;
      initialization_date: string;
      expiration_date: string;
    }
  ): Promise<{ allowed: boolean; message?: string }> => {
    const startStr = targetBanner.initialization_date;
    const endStr = targetBanner.expiration_date;

    const { data: activeBanners, error: queryError } = await supabase
      .from('banners')
      .select('*')
      .in('status', ['active', 'scheduled', 'awaiting_payment'])
      .lte('initialization_date', endStr)
      .gte('expiration_date', startStr);

    if (queryError) {
      throw new Error('Falha ao validar disponibilidade: ' + queryError.message);
    }

    const otherBanners = (activeBanners as any[] || []).filter((b: any) => b.id !== targetBanner.id);

    const isAncestor = (
      b1: { scope: string; country?: string | null; state?: string | null; city?: string | null },
      b2: { scope: string; country?: string | null; state?: string | null; city?: string | null }
    ) => {
      if (b1.scope === 'national') {
        return b1.country?.toLowerCase() === b2.country?.toLowerCase();
      }
      if (b1.scope === 'state') {
        return b1.country?.toLowerCase() === b2.country?.toLowerCase() &&
          b1.state?.toLowerCase() === b2.state?.toLowerCase();
      }
      return false;
    };

    const isOverlappingGeo = (b1: any, b2: any) => isAncestor(b1, b2) || isAncestor(b2, b1);

    const geoOverlapping = otherBanners.filter(b => isOverlappingGeo(b, targetBanner));

    const criticalDates = new Set<string>();
    criticalDates.add(startStr);
    for (const b of geoOverlapping) {
      if (b.initialization_date >= startStr && b.initialization_date <= endStr) {
        criticalDates.add(b.initialization_date);
      }
    }

    for (const date of Array.from(criticalDates)) {
      const activeOnDate = geoOverlapping.filter(
        b => b.initialization_date <= date && b.expiration_date >= date
      );

      const candidates = [...activeOnDate, targetBanner];

      // 1. National limit
      const nationalBanners = candidates.filter(c => c.scope === 'national' && c.country?.toLowerCase() === targetBanner.country?.toLowerCase());
      if (nationalBanners.length > 2) {
        return {
          allowed: false,
          message: `O limite de 2 banners nacionais ativos ou aguardando seria excedido no dia ${formatToDDMMYYYY(date)} para o país ${targetBanner.country}.`
        };
      }

      // 2. State limit
      if (targetBanner.scope === 'state' && targetBanner.state) {
        const stateBanners = candidates.filter(c => c.scope === 'state' && c.country?.toLowerCase() === targetBanner.country?.toLowerCase() && c.state?.toLowerCase() === targetBanner.state?.toLowerCase());
        if (stateBanners.length > 3) {
          return {
            allowed: false,
            message: `O limite de 3 banners estaduais ativos ou aguardando seria excedido no dia ${formatToDDMMYYYY(date)} para o estado ${targetBanner.state}.`
          };
        }
      }

      // 3. Total limit of 5 per state
      const states = Array.from(new Set(candidates.map(c => c.state).filter(Boolean)));
      if (targetBanner.scope === 'state' && targetBanner.state) {
        states.push(targetBanner.state);
      }

      for (const st of states) {
        const countForState = candidates.filter(c => 
          c.scope === 'national' || 
          (c.scope === 'state' && c.state?.toLowerCase() === st?.toLowerCase())
        ).length;
        if (countForState > 5) {
          return {
            allowed: false,
            message: `O limite total de 5 banners ativos ou aguardando seria excedido no dia ${formatToDDMMYYYY(date)} no estado ${st?.toUpperCase()}.`
          };
        }
      }
    }

    return { allowed: true };
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerImageUrl || !bannerInitialization || !bannerExpiration) {
      warning('Preencha os campos obrigatórios.');
      return;
    }

    if (bannerExpiration < bannerInitialization) {
      warning('A data de expiração não pode ser anterior à data de inicialização.');
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

    try {
      // Validate availability first using the same rules as the DB trigger
      const availability = await checkBannerAvailability({
        id: editBannerId || undefined,
        scope: bannerScope,
        country: bannerCountry,
        state: bannerScope === 'state' ? bannerState : null,
        city: null,
        initialization_date: bannerInitialization,
        expiration_date: bannerExpiration
      });

      if (!availability.allowed) {
        warning(availability.message || 'O limite de banners ativos seria excedido.');
        return;
      }

      const todayStr = getTodayStr();
      const initDate = new Date(bannerInitialization + 'T00:00:00');
      const todayDate = new Date(todayStr + 'T00:00:00');

      let finalStatus: 'scheduled' | 'active' = 'active';
      if (initDate > todayDate) {
        finalStatus = 'scheduled';
      } else {
        finalStatus = 'active';
      }

      const bannerData = {
        image_url: bannerImageUrl,
        title: bannerTitle || null,
        subtitle: bannerSubtitle || null,
        link_url: assembledLink,
        link_label: finalLabel,
        status: finalStatus,
        initialization_date: bannerInitialization,
        expiration_date: bannerExpiration,
        scope: bannerScope,
        country: bannerCountry || null,
        state: bannerScope === 'state' ? bannerState || null : null,
        city: null
      };

      if (editBannerId) {
        await bannersHook.updateBanner(editBannerId, bannerData);
        success('Banner atualizado com sucesso!');
      } else {
        await bannersHook.createBanner(bannerData);
        success('Banner criado com sucesso!');
      }
      setAddBannerModalOpen(false);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleToggleBannerStatus = async (banner: any) => {
    const todayStr = getTodayStr();

    if (banner.status === 'active' || banner.status === 'scheduled') {
      setConfirmModal({
        isOpen: true,
        title: 'Desativar Banner',
        message: 'Deseja realmente desativar este banner?',
        onConfirm: async () => {
          try {
            await bannersHook.updateBanner(banner.id, { status: 'deactivated' });
            success('Banner desativado com sucesso!');
          } catch (err: any) {
            console.error(err);
            error('Falha ao desativar banner: ' + err.message);
          }
        }
      });
      return;
    }

    let targetExpDate = banner.expiration_date;
    if (targetExpDate < todayStr) {
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);
      targetExpDate = nextMonth.toISOString().split('T')[0];
    }

    const targetInitDate = banner.initialization_date > todayStr ? banner.initialization_date : todayStr;

    try {
      const initDate = new Date(targetInitDate + 'T00:00:00');
      const todayDate = new Date(todayStr + 'T00:00:00');
      const expDate = new Date(targetExpDate + 'T00:00:00');

      let finalStatus: 'scheduled' | 'active' | 'expired' | 'deactivated' = 'active';
      if (initDate > todayDate) {
        finalStatus = 'scheduled';
      } else if (expDate < todayDate) {
        finalStatus = 'expired';
      } else {
        finalStatus = 'active';
      }

      await bannersHook.updateBanner(banner.id, {
        status: finalStatus,
        initialization_date: targetInitDate,
        expiration_date: targetExpDate
      });
      success('Banner reativado com sucesso!');
    } catch (err: any) {
      console.error(err);
    }
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
    setLinkLabel: (v: string) => void,
    maxLinkLabelLength: number = 50
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
              maxLength={maxLinkLabelLength}
            />
            <span style={{ display: 'block', textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {linkLabel.length}/{maxLinkLabelLength}
            </span>
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
                  warning('Atenção: Links externos devem começar com http:// ou https://');
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
                value={rawValue === 'work' ? 'work' : 'profile'}
                onChange={(e) => {
                  if (e.target.value === 'work') {
                    setRawValue('work');
                    setCustomRoute('');
                  } else {
                    setRawValue('');
                    setCustomRoute('');
                  }
                }}
              >
                <option value="profile">Perfil de Profissional/Cliente</option>
                <option value="work">Obra</option>
              </select>
            </div>

            {rawValue === 'work' ? (
              <div className="form-group">
                <label>Selecione a Obra</label>
                <input
                  type="text"
                  className="input-field"
                  style={{ cursor: 'pointer' }}
                  value={resolvedWorksMap[customRoute] || ''}
                  placeholder="Clique para selecionar uma obra..."
                  readOnly
                  onClick={() => {
                    setOnWorkSelectCallback(() => (workId: string, workTitle: string) => {
                      setCustomRoute(workId);
                      setResolvedWorksMap(prev => ({ ...prev, [workId]: workTitle }));
                      setWorkSearchModalOpen(false);
                    });
                    setWorkSearchQuery('');
                    setWorkSearchModalOpen(true);
                  }}
                  required
                />
              </div>
            ) : (
              <div className="form-group">
                <label>Selecionar Perfil Destino</label>
                <input
                  type="text"
                  className="input-field"
                  style={{ cursor: 'pointer' }}
                  value={resolvedProfilesMap[rawValue] || ''}
                  placeholder="Clique para selecionar um perfil..."
                  readOnly
                  onClick={() => {
                    setOnProfileSelectCallback(() => (profileId: string, profileName: string) => {
                      setRawValue(profileId);
                      setResolvedProfilesMap(prev => ({ ...prev, [profileId]: profileName }));
                      setProfileSearchModalOpen(false);
                    });
                    setProfileSearchQuery('');
                    setProfileSearchModalOpen(true);
                  }}
                  required
                />
              </div>
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <img src={logoImg.src} alt="Logo Siga" style={{ height: '56px', objectFit: 'contain' }} />
          <h2>Painel Siga</h2>
          {/* Close button inside sidebar on mobile */}
          <button className="btn-close-sidebar" onClick={() => setMobileSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <a
            onClick={() => {
              setActiveTab('overview');
              setMobileSidebarOpen(false);
            }}
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} />
            Visão Geral
          </a>
          <a
            onClick={() => {
              setActiveTab('users');
              setMobileSidebarOpen(false);
            }}
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
          >
            <Users size={18} />
            Usuários
          </a>
          <a
            onClick={() => {
              setActiveTab('stories');
              setMobileSidebarOpen(false);
            }}
            className={`nav-item ${activeTab === 'stories' ? 'active' : ''}`}
          >
            <Film size={18} />
            Stories
          </a>
          <a
            onClick={() => {
              setActiveTab('banners');
              setMobileSidebarOpen(false);
            }}
            className={`nav-item ${activeTab === 'banners' ? 'active' : ''}`}
          >
            <ImageIcon size={18} />
            Banners
          </a>
          <a
            onClick={() => {
              setActiveTab('reports');
              setMobileSidebarOpen(false);
            }}
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
            onClick={() => {
              setActiveTab('settings');
              setMobileSidebarOpen(false);
            }}
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
          <button className="btn-menu-mobile" onClick={() => setMobileSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <div className="header-title">
            <h2>
              {activeTab === 'overview' && 'Visão Geral'}
              {activeTab === 'users' && 'Usuários'}
              {activeTab === 'stories' && 'Stories'}
              {activeTab === 'banners' && 'Banners'}
              {activeTab === 'reports' && 'Denúncias'}
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
                        <th>Papel</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userHook.loading ? (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                            Carregando usuários...
                          </td>
                        </tr>
                      ) : userHook.users.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                            Nenhum usuário encontrado.
                          </td>
                        </tr>
                      ) : (
                        userHook.users.map((u) => (
                          <tr
                            key={u.id}
                            onClick={async () => {
                              await userHook.loadUserDetails(u.id);
                              setSelectedUserTab('portfolio');
                              setUserModalOpen(true);
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            <td>{u.name || 'Sem nome'}</td>
                            <td>{u.email || 'Sem email'}</td>
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
                      {storyHook.channels.map((ch) => (
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
                <button className="btn btn-primary" style={{ width: 'fit-content' }} onClick={() => success('Configurações salvas.')}>
                  Salvar Alterações
                </button>
              </div>
            </div>
          )}

          {/* ================= TAB: BANNERS ================= */}
          {activeTab === 'banners' && (
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
                        }}
                      >
                        <option value="all">Todos os Países</option>
                        {Country.getAllCountries().map((c) => (
                          <option key={c.isoCode} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {bannersHook.scopeFilter !== 'all' && bannersHook.scopeFilter === 'state' && bannersHook.countryFilter !== 'all' && (
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
                        .filter(b => b.status === 'active')
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
                        .filter(b => b.status === 'scheduled')
                        .sort((a, b) => a.initialization_date.localeCompare(b.initialization_date));

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
                            {scheduledBannersToShow.map((banner) => (
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
          )}
        </div>
      </main>

      {/* ================= MODAL: USER DETAILS ================= */}
      {userModalOpen && userHook.selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '950px', width: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <button className="modal-close" onClick={() => setUserModalOpen(false)}>
              <X size={20} />
            </button>
            <h3 className="modal-title">Ficha Detalhada do Usuário</h3>

            {(() => {
              const user = userHook.selectedUser;
              const profile = Array.isArray(user.user_profiles) ? user.user_profiles[0] : user.user_profiles;
              const isProfessional = user.role_flags?.includes('profissional');
              
              // Define default active tab for non-professionals if necessary
              const activeUserTab = isProfessional 
                ? selectedUserTab 
                : (['location', 'contacts'].includes(selectedUserTab) ? selectedUserTab : 'location');

              const renderDetailStars = (rating: number) => {
                const stars = [];
                for (let i = 1; i <= 5; i++) {
                  stars.push(
                    <Star
                      key={i}
                      size={14}
                      fill={i <= Math.floor(rating) ? "#FFD700" : "none"}
                      stroke={i <= Math.floor(rating) ? "#FFD700" : "var(--text-muted)"}
                    />
                  );
                }
                return stars;
              };

              const handleSocialClick = (type: 'whatsapp' | 'telegram' | 'instagram' | 'facebook' | 'email' | 'website', value?: string | null) => {
                if (!value) return;
                let url = '';
                switch (type) {
                  case 'whatsapp':
                    const cleanPhone = value.replace(/\D/g, '');
                    url = cleanPhone.startsWith('55') ? `https://wa.me/${cleanPhone}` : `https://wa.me/55${cleanPhone}`;
                    break;
                  case 'instagram':
                    url = `https://instagram.com/${value.replace('@', '')}`;
                    break;
                  case 'facebook':
                    url = `https://facebook.com/${value}`;
                    break;
                  case 'telegram':
                    url = `https://t.me/${value.replace('@', '')}`;
                    break;
                  case 'email':
                    url = `mailto:${value}`;
                    break;
                  case 'website':
                    url = value.startsWith('http') ? value : `https://${value}`;
                    break;
                }
                window.open(url, '_blank');
              };

              return (
                <div className="profile-modal-grid">
                  {/* Left Column - Hero Profile Card */}
                  <div className="profile-sidebar">
                    <div className="profile-avatar-container">
                      <div className="profile-avatar-wrapper">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} className="profile-avatar-img" alt={user.name} />
                        ) : (
                          <div className="profile-avatar-placeholder">
                            {(user.name || '?')[0]}
                          </div>
                        )}
                      </div>
                    </div>

                    <h4 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
                      {user.name || 'Sem nome'}
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', wordBreak: 'break-all' }}>
                      {user.email}
                    </p>

                    {/* Rating stars */}
                    <div className="profile-stars-row">
                      {renderDetailStars(profile?.rating_avg || 0)}
                    </div>
                    <span className="profile-rating-text">
                      {Number(profile?.rating_avg || 0).toFixed(1)} ({profile?.rating_count || 0} avaliações)
                    </span>

                    {/* Availability Card for Professionals */}
                    {isProfessional && (
                      <div className={`profile-availability-badge ${profile?.is_available ? 'available' : 'unavailable'}`}>
                        {profile?.is_available ? (
                          <>
                            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)' }} />
                            Disponível para Obras
                          </>
                        ) : (
                          <>
                            <X size={12} />
                            Indisponível no momento
                          </>
                        )}
                      </div>
                    )}

                    {/* Left Column Meta Fields */}
                    <div style={{ width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', fontSize: '13px' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 600 }}>Papel</span>
                        <strong style={{ color: 'var(--text-main)' }}>{user.role_flags?.join(' & ') || 'Nenhum'}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 600 }}>Documento ({user.document_type || 'CPF'})</span>
                        <strong style={{ color: 'var(--text-main)', fontSize: '12px' }}>{decodeDocumentHash(user.document_hash) || 'Não informado'}</strong>
                      </div>
                      {user.nationality && (
                        <div>
                          <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 600 }}>Nacionalidade</span>
                          <strong style={{ color: 'var(--text-main)' }}>{user.nationality}</strong>
                        </div>
                      )}
                      {user.marital_status && (
                        <div>
                          <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 600 }}>Estado Civil</span>
                          <strong style={{ color: 'var(--text-main)' }}>{user.marital_status}</strong>
                        </div>
                      )}
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 600 }}>Status da Conta</span>
                        <span className={`badge ${user.status === 'active' ? 'badge-success' : 'badge-danger'}`} style={{ marginTop: '4px' }}>
                          {user.status}
                        </span>
                      </div>
                    </div>

                    {/* Motivo do Bloqueio */}
                    {user.status === 'blocked' && (
                      <div style={{ width: '100%', marginTop: '12px', padding: '12px', backgroundColor: 'var(--danger-bg)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-sm)', textAlign: 'left' }}>
                        <span style={{ fontSize: '10px', color: 'var(--danger)', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={12} /> Conta Bloqueada
                        </span>
                        <p style={{ fontSize: '12px', marginTop: '4px', color: 'var(--text-main)', fontWeight: 500 }}>
                          {user.block_reason || 'Nenhum motivo informado.'}
                        </p>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="profile-sidebar-actions">

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setUserModalOpen(false);
                          handleOpenNotification(user.id, user.name, user.email);
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
                      >
                        <Bell size={14} /> Enviar Notificação
                      </button>

                      {user.status === 'active' ? (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => {
                            setUserModalOpen(false);
                            handleOpenBlockModal(user.id, user.name);
                          }}
                          style={{ justifyContent: 'center' }}
                        >
                          Bloquear Conta
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ backgroundColor: 'var(--success)', color: 'white', justifyContent: 'center' }}
                          onClick={async () => {
                            await userHook.updateUserStatus(user.id, 'active');
                          }}
                        >
                          Desbloquear Conta
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right Column - Navigation Tabs & Dynamic Content */}
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {/* Tab Navigation */}
                    <div className="profile-tabs-nav">
                      {isProfessional && (
                        <>
                          <button
                            className={`profile-tab-btn ${activeUserTab === 'portfolio' ? 'active' : ''}`}
                            onClick={() => setSelectedUserTab('portfolio')}
                          >
                            Portfólio (Obras)
                          </button>
                          <button
                            className={`profile-tab-btn ${activeUserTab === 'specialties' ? 'active' : ''}`}
                            onClick={() => setSelectedUserTab('specialties')}
                          >
                            Mestre
                          </button>
                        </>
                      )}
                      <button
                        className={`profile-tab-btn ${activeUserTab === 'location' ? 'active' : ''}`}
                        onClick={() => setSelectedUserTab('location')}
                      >
                        Localização
                      </button>
                      <button
                        className={`profile-tab-btn ${activeUserTab === 'contacts' ? 'active' : ''}`}
                        onClick={() => setSelectedUserTab('contacts')}
                      >
                        Contatos e Redes
                      </button>
                    </div>

                    {/* Tab Contents */}
                    <div className="profile-tab-content" style={{ flex: 1 }}>
                      
                      {/* TAB: PORTFOLIO */}
                      {isProfessional && activeUserTab === 'portfolio' && (
                        <div>
                          <div style={{ marginBottom: '16px' }}>
                            <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>Trabalhos Anteriores (Portfólio)</h4>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Galeria de obras executadas pelo profissional.</p>
                          </div>

                          {(() => {
                            const portfolios = user.portfolio_works || [];
                            if (portfolios.length === 0) {
                              return <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '24px', textAlign: 'center', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-md)' }}>Nenhuma obra cadastrada no portfólio.</p>;
                            }

                            return (
                              <div className="portfolio-grid">
                                {portfolios.map((item: any) => {
                                  const coverMedia = item.portfolio_media?.find((m: any) => m.media_type === 'image') || item.portfolio_media?.[0];
                                  return (
                                    <div
                                      key={item.id}
                                      className="portfolio-card"
                                      onClick={() => {
                                        setSelectedPortfolioItem(item);
                                        setLightboxMainImage(coverMedia?.url || null);
                                      }}
                                    >
                                      <div className="portfolio-card-img-wrapper">
                                        {coverMedia?.url ? (
                                          <img src={coverMedia.url} className="portfolio-card-img" alt={item.title} />
                                        ) : (
                                          <div className="portfolio-card-placeholder">
                                            <ImageIcon size={28} />
                                          </div>
                                        )}
                                      </div>
                                      <div className="portfolio-card-info">
                                        <h5 className="portfolio-card-title">{item.title}</h5>
                                        <p className="portfolio-card-desc">{item.description || 'Sem descrição cadastrada.'}</p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* TAB: SPECIALTIES */}
                      {isProfessional && activeUserTab === 'specialties' && (
                        <div>
                          <div style={{ marginBottom: '16px' }}>
                            <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>Mestre</h4>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Especializações e capacitações técnicas do profissional.</p>
                          </div>

                          {(() => {
                            const specs = user.user_specialties || [];
                            if (specs.length === 0) {
                              return <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Nenhuma especialização cadastrada.</p>;
                            }

                            return (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {specs.map((item: any, idx: number) => {
                                  const spec = Array.isArray(item.specialties) ? item.specialties[0] : item.specialties;
                                  const specName = spec?.name || 'Especialidade';
                                  return (
                                    <span
                                      key={idx}
                                      className="badge badge-info"
                                      style={{
                                        padding: '8px 16px',
                                        fontSize: '13px',
                                        backgroundColor: 'var(--primary-light)',
                                        color: 'var(--primary)',
                                        border: '1px solid rgba(239, 68, 68, 0.1)',
                                        borderRadius: 'var(--radius-sm)',
                                        textTransform: 'none',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                      }}
                                    >
                                      <Award size={14} />
                                      {specName}
                                    </span>
                                  );
                                })}
                              </div>
                            );
                          })()}

                          {profile?.bio && (
                            <div style={{ marginTop: '32px' }}>
                              <h5 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>Bio / Apresentação Pessoal</h5>
                              <p style={{ fontSize: '14px', color: 'var(--text-main)', lineHeight: '1.6', padding: '16px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)' }}>
                                {profile.bio}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* TAB: LOCATION & COVERAGE */}
                      {activeUserTab === 'location' && (
                        <div>
                          {/* Base address */}
                          <div style={{ marginBottom: '32px' }}>
                            <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>Endereço Base</h4>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>Localidade de registro principal do usuário.</p>

                            {(() => {
                              let baseAddresses = user.addresses?.filter((a: any) => a.type === 'base') || [];
                              if (baseAddresses.length === 0 && user.addresses && user.addresses.length > 0) {
                                baseAddresses = [user.addresses[0]];
                              }
                              if (baseAddresses.length === 0) {
                                return <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Nenhum endereço base cadastrado.</p>;
                              }

                              return baseAddresses.map((addr: any) => (
                                <div
                                  key={addr.id}
                                  style={{
                                    display: 'flex',
                                    gap: '12px',
                                    alignItems: 'center',
                                    padding: '16px',
                                    backgroundColor: 'var(--bg-card)',
                                    border: '1px solid var(--border-light)',
                                    borderRadius: 'var(--radius-md)'
                                  }}
                                >
                                  <MapPin size={20} style={{ color: 'var(--primary)' }} />
                                  <div style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                                    <strong style={{ display: 'block', marginBottom: '2px' }}>Residencial / Base</strong>
                                    <span>
                                      {addr.street}, {addr.number}
                                      {addr.complement ? ` (${addr.complement})` : ''} - {addr.district}, {addr.city} - {addr.state}
                                      {addr.country ? `, ${addr.country}` : ''}
                                    </span>
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>

                          {/* Coverage Areas for Professionals */}
                          {isProfessional && (
                            <div>
                              <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>Área de Cobertura para Serviços</h4>
                              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>Regiões geográficas onde o profissional está disponível para trabalhar.</p>

                              {(() => {
                                const coverage = user.professional_coverages?.[0];
                                if (!coverage) {
                                  return <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Nenhuma área de cobertura cadastrada.</p>;
                                }

                                if (coverage.nationwide) {
                                  return (
                                    <div className="coverage-nationwide-card">
                                      <Globe size={20} />
                                      <div>
                                        <strong>Cobertura Nacional</strong>
                                        <span style={{ display: 'block', fontSize: '13px', marginTop: '2px' }}>O profissional atende chamados em todo o território nacional.</span>
                                      </div>
                                    </div>
                                  );
                                }

                                const states = coverage.states || [];
                                const cities = coverage.cities || [];

                                if (states.length === 0 && cities.length === 0) {
                                  return <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Atuação restrita à cidade base.</p>;
                                }

                                return (
                                  <div>
                                    {states.map((st: string) => {
                                      const stateCities = cities.filter((c: any) => c.state === st);
                                      const isEntireState = stateCities.length === 0;

                                      return (
                                        <div key={st} className="coverage-state-group">
                                          <div className="coverage-state-header">
                                            Estado de {st} · {isEntireState ? 'Estado Inteiro' : 'Cidades Selecionadas'}
                                          </div>
                                          {!isEntireState ? (
                                            <div className="coverage-cities-row">
                                              {stateCities.map((ct: any) => (
                                                <span key={ct.city_id} className="coverage-city-chip">
                                                  {ct.city_name}
                                                </span>
                                              ))}
                                            </div>
                                          ) : (
                                            <span className="badge badge-success" style={{ textTransform: 'none' }}>Atendimento completo em todo o estado</span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      )}

                      {/* TAB: CONTACTS & SOCIALS */}
                      {activeUserTab === 'contacts' && (
                        <div>
                          <div style={{ marginBottom: '20px' }}>
                            <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>Canais de Contato e Redes Sociais</h4>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Clique em qualquer canal para abrir a conversa ou perfil correspondente.</p>
                          </div>

                          <div className="social-contacts-grid">
                            {/* WhatsApp 1 */}
                            {(profile?.whatsapp_phone || user.phone) && (
                              <button
                                className="social-contact-btn"
                                onClick={() => handleSocialClick('whatsapp', profile?.whatsapp_phone || user.phone)}
                              >
                                <span className="social-contact-icon" style={{ color: '#25D366' }}><MessageSquare size={20} /></span>
                                <div className="social-contact-info">
                                  <span className="social-contact-label">WhatsApp Principal</span>
                                  <span className="social-contact-value">{profile?.whatsapp_phone || user.phone}</span>
                                </div>
                              </button>
                            )}

                            {/* WhatsApp 2 */}
                            {profile?.whatsapp_phone_2 && (
                              <button
                                className="social-contact-btn"
                                onClick={() => handleSocialClick('whatsapp', profile.whatsapp_phone_2)}
                              >
                                <span className="social-contact-icon" style={{ color: '#25D366' }}><MessageSquare size={20} /></span>
                                <div className="social-contact-info">
                                  <span className="social-contact-label">WhatsApp 2</span>
                                  <span className="social-contact-value">{profile.whatsapp_phone_2}</span>
                                </div>
                              </button>
                            )}

                            {/* Telegram */}
                            {profile?.telegram && (
                              <button
                                className="social-contact-btn"
                                onClick={() => handleSocialClick('telegram', profile.telegram)}
                              >
                                <span className="social-contact-icon" style={{ color: '#0088cc' }}><Send size={18} /></span>
                                <div className="social-contact-info">
                                  <span className="social-contact-label">Telegram</span>
                                  <span className="social-contact-value">{profile.telegram}</span>
                                </div>
                              </button>
                            )}

                            {/* Email */}
                            {(profile?.email_contact || user.email) && (
                              <button
                                className="social-contact-btn"
                                onClick={() => handleSocialClick('email', profile?.email_contact || user.email)}
                              >
                                <span className="social-contact-icon" style={{ color: 'var(--primary)' }}><Mail size={18} /></span>
                                <div className="social-contact-info">
                                  <span className="social-contact-label">Email de Contato</span>
                                  <span className="social-contact-value">{profile?.email_contact || user.email}</span>
                                </div>
                              </button>
                            )}

                            {/* Instagram */}
                            {profile?.instagram && (
                              <button
                                className="social-contact-btn"
                                onClick={() => handleSocialClick('instagram', profile.instagram)}
                              >
                                <span className="social-contact-icon" style={{ color: '#E4405F' }}>
                                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                                </span>
                                <div className="social-contact-info">
                                  <span className="social-contact-label">Instagram</span>
                                  <span className="social-contact-value">{profile.instagram}</span>
                                </div>
                              </button>
                            )}

                            {/* Facebook */}
                            {profile?.facebook && (
                              <button
                                className="social-contact-btn"
                                onClick={() => handleSocialClick('facebook', profile.facebook)}
                              >
                                <span className="social-contact-icon" style={{ color: '#1877F2' }}>
                                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                                </span>
                                <div className="social-contact-info">
                                  <span className="social-contact-label">Facebook</span>
                                  <span className="social-contact-value">{profile.facebook}</span>
                                </div>
                              </button>
                            )}

                            {/* Website */}
                            {profile?.website && (
                              <button
                                className="social-contact-btn"
                                onClick={() => handleSocialClick('website', profile.website)}
                              >
                                <span className="social-contact-icon" style={{ color: 'var(--text-muted)' }}><Globe size={18} /></span>
                                <div className="social-contact-info">
                                  <span className="social-contact-label">Website</span>
                                  <span className="social-contact-value">{profile.website}</span>
                                </div>
                              </button>
                            )}
                          </div>

                          {(!profile?.whatsapp_phone && !user.phone && !profile?.whatsapp_phone_2 && !profile?.telegram && !profile?.email_contact && !profile?.instagram && !profile?.facebook && !profile?.website) && (
                            <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '24px' }}>Nenhum canal de contato adicional registrado.</p>
                          )}
                        </div>
                      )}


                    </div>
                  </div>
                </div>
              );
            })()}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
              <button type="button" className="btn btn-primary" onClick={() => setUserModalOpen(false)}>
                Fechar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: PORTFOLIO LIGHTBOX ================= */}
      {selectedPortfolioItem && (
        <div className="lightbox-overlay" onClick={() => setSelectedPortfolioItem(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-header">
              <h4 className="lightbox-title">{selectedPortfolioItem.title}</h4>
              <button className="modal-close" onClick={() => setSelectedPortfolioItem(null)} style={{ position: 'static' }}>
                <X size={20} />
              </button>
            </div>
            <div className="lightbox-body">
              {/* Media viewer */}
              <div className="lightbox-media-wrapper">
                {lightboxMainImage ? (
                  selectedPortfolioItem.portfolio_media?.find((m: any) => m.url === lightboxMainImage)?.media_type === 'video' ? (
                    <video src={lightboxMainImage} className="lightbox-media-main" controls autoPlay />
                  ) : (
                    <img src={lightboxMainImage} className="lightbox-media-main" alt={selectedPortfolioItem.title} />
                  )
                ) : (
                  <div className="lightbox-media-placeholder">
                    <ImageIcon size={48} />
                    <span>Nenhuma imagem ou vídeo disponível</span>
                  </div>
                )}
              </div>

              {/* Thumbnail selector */}
              {selectedPortfolioItem.portfolio_media && selectedPortfolioItem.portfolio_media.length > 1 && (
                <div className="lightbox-thumbs-scroll">
                  {selectedPortfolioItem.portfolio_media.map((media: any, index: number) => (
                    <div
                      key={index}
                      className={`lightbox-thumb ${lightboxMainImage === media.url ? 'active' : ''}`}
                      onClick={() => setLightboxMainImage(media.url)}
                    >
                      {media.media_type === 'video' ? (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#333', color: 'white' }}>
                          <Film size={20} />
                        </div>
                      ) : (
                        <img src={media.url} className="lightbox-thumb-img" alt={`Thumbnail ${index + 1}`} />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Description */}
              <div className="lightbox-description">
                <h5 className="lightbox-description-title">Descrição do Trabalho</h5>
                <p className="lightbox-description-text" style={{ whiteSpace: 'pre-wrap' }}>
                  {selectedPortfolioItem.description || 'Sem descrição detalhada.'}
                </p>
              </div>
            </div>
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
                <input type="text" className="input-field" value={editUserName} onChange={(e) => setEditUserName(e.target.value)} maxLength={50} required />
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
                <textarea className="textarea-field" style={{ minHeight: '80px', width: '100%' }} value={editUserBio} onChange={(e) => setEditUserBio(e.target.value)} maxLength={140} />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditUserModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: NOTIFY USER ================= */}
      {notificationModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setNotificationModalOpen(false)}>
              <X size={20} />
            </button>
            <h3 className="modal-title">Enviar Notificação</h3>

            <form onSubmit={handleSendNotification}>
              <div className="form-group">
                <label>Destinatário</label>
                <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', fontSize: '14px', border: '1px solid var(--border-light)' }}>
                  <strong>{notificationUserName}</strong> &lt;{notificationUserEmail}&gt;
                </div>
              </div>

              <div className="form-group">
                <label>Assunto Predefinido</label>
                <select
                  className="select-field"
                  value={notificationSubjectSelect}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNotificationSubjectSelect(val);
                    if (val !== 'outro') {
                      setNotificationSubjectCustom('');
                    }
                  }}
                >
                  <option value="Atualização cadastral pendente">Atualização cadastral pendente</option>
                  <option value="Conta bloqueada por violação de termos">Conta bloqueada por violação de termos</option>
                  <option value="Alerta de segurança">Alerta de segurança</option>
                  <option value="Aviso de manutenção">Aviso de manutenção</option>
                  <option value="outro">Outro (digitar assunto personalizado)</option>
                </select>
              </div>

              {notificationSubjectSelect === 'outro' && (
                <div className="form-group">
                  <label>Assunto Personalizado</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Digite o assunto..."
                    value={notificationSubjectCustom}
                    onChange={(e) => setNotificationSubjectCustom(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label>Mensagem</label>
                <textarea
                  className="textarea-field"
                  style={{ minHeight: '120px', width: '100%' }}
                  placeholder="Digite a mensagem da notificação..."
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setNotificationModalOpen(false)} disabled={notificationSending}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={notificationSending}>
                  {notificationSending ? 'Enviando...' : 'Enviar Notificação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: BLOCK USER ================= */}
      {blockUserModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setBlockUserModalOpen(false)}>
              <X size={20} />
            </button>
            <h3 className="modal-title" style={{ color: 'var(--danger)' }}>Bloquear Usuário</h3>

            <form onSubmit={handleConfirmBlockUser}>
              <div style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--text-muted)' }}>
                Deseja realmente bloquear a conta do usuário <strong>{blockUserName}</strong>? Ele será impedido de acessar o aplicativo móvel.
              </div>

              <div className="form-group">
                <label>Motivo do Bloqueio</label>
                <textarea
                  className="textarea-field"
                  style={{ minHeight: '100px', width: '100%' }}
                  placeholder="Informe o motivo do bloqueio (isso será exibido para o usuário no app)..."
                  value={blockReasonText}
                  onChange={(e) => setBlockReasonText(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setBlockUserModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-danger">
                  Bloquear Usuário
                </button>
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
            <h3 className="modal-title">{editChannelId ? 'Editar Canal de Stories' : 'Novo Canal de Stories'}</h3>

            <form onSubmit={handleCreateChannel}>
              <div className="form-group">
                <label>Nome do Canal</label>
                <input type="text" className="input-field" value={newChannelName} onChange={(e) => setNewChannelName(e.target.value)} placeholder="Ex: Siga Construtora" maxLength={15} required />
                <span style={{ display: 'block', textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {newChannelName.length}/15
                </span>
              </div>
              <div className="form-group">
                <label>Avatar do Canal (Recortado na proporção 1:1)</label>
                <FileUploadZone
                  mediaUrl={newChannelAvatar}
                  setMediaUrl={setNewChannelAvatar}
                  allowedTypes={['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']}
                  folder="images/channels"
                  forceCrop={true}
                  aspectRatio="1:1"
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Abrangência do Canal</label>
                  <select
                    className="select-field"
                    value={newChannelScope}
                    disabled={!!editChannelId}
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
                    <option value="state">Estadual</option>
                    <option value="city">Municipal</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>País</label>
                  <select
                    className="select-field"
                    value={newChannelCountry}
                    disabled={!!editChannelId}
                    onChange={(e) => {
                      setNewChannelCountry(e.target.value);
                      setNewChannelState('');
                      setNewChannelCity('');
                    }}
                    required
                  >
                    <option value="">Selecione o País</option>
                    {Country.getAllCountries().map((c) => (
                      <option key={c.isoCode} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {(newChannelScope === 'state' || newChannelScope === 'city') && (
                <div className="grid-2">
                  <div className="form-group">
                    <label>Estado</label>
                    <select
                      className="select-field"
                      value={newChannelState}
                      disabled={!!editChannelId}
                      onChange={(e) => {
                        setNewChannelState(e.target.value);
                        setNewChannelCity('');
                      }}
                      required
                    >
                      <option value="">Selecione o Estado</option>
                      {(() => {
                        const selectedCountryObj = Country.getAllCountries().find(c => c.name === newChannelCountry);
                        const states = selectedCountryObj ? State.getStatesOfCountry(selectedCountryObj.isoCode) : [];
                        return states.map((s) => (
                          <option key={s.isoCode} value={s.isoCode}>{s.name} ({s.isoCode})</option>
                        ));
                      })()}
                    </select>
                  </div>

                  {newChannelScope === 'city' && (
                    <div className="form-group">
                      <label>Cidade</label>
                      <select
                        className="select-field"
                        value={newChannelCity}
                        disabled={!!editChannelId}
                        onChange={(e) => setNewChannelCity(e.target.value)}
                        required
                      >
                        <option value="">Selecione a Cidade</option>
                        {(() => {
                          const selectedCountryObj = Country.getAllCountries().find(c => c.name === newChannelCountry);
                          const states = selectedCountryObj ? State.getStatesOfCountry(selectedCountryObj.isoCode) : [];
                          const selectedStateObj = states.find(s => s.isoCode === newChannelState);
                          const cities = (selectedCountryObj && selectedStateObj) ? City.getCitiesOfState(selectedCountryObj.isoCode, selectedStateObj.isoCode) : [];
                          return cities.map((c) => (
                            <option key={c.name} value={c.name}>{c.name}</option>
                          ));
                        })()}
                      </select>
                    </div>
                  )}
                </div>
              )}
              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="destaque" checked={newChannelDestaque} onChange={(e) => setNewChannelDestaque(e.target.checked)} />
                <label htmlFor="destaque">Destaque (Aparece em primeiro no app)</label>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setAddChannelModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editChannelId ? 'Salvar Alterações' : 'Criar Canal'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD STORY ITEM ================= */}
      {addStoryModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setAddStoryModalOpen(false)} disabled={savingStory}>
              <X size={20} />
            </button>
            <h3 className="modal-title">{editStoryId ? 'Editar Story Item' : 'Publicar Novo Story'}</h3>

            <form onSubmit={handleSaveStoryItem}>
              <div className="form-group">
                <label>Canal Vinculado</label>
                <select className="select-field" value={newStoryChannelId} onChange={(e) => setNewStoryChannelId(e.target.value)} required disabled>
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
                  <input
                    type="date"
                    className="input-field"
                    value={newStoryExpiration}
                    onChange={(e) => setNewStoryExpiration(e.target.value)}
                    min={getTodayStr()}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Mídia (Imagens serão recortadas na proporção 9:16)</label>
                <FileUploadZone
                  mediaUrl={newStoryMediaUrl}
                  setMediaUrl={setNewStoryMediaUrl}
                  mediaType={newStoryMediaType}
                  setMediaType={setNewStoryMediaType}
                  allowedTypes={[
                    'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif',
                    'video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska', 'video/ogg'
                  ]}
                  folder="images/stories"
                  forceCrop={true}
                  aspectRatio="9:16"
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
                setNewStoryLinkLabel,
                15
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setAddStoryModalOpen(false)} disabled={savingStory}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={savingStory}>
                  {savingStory ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        border: '2px solid var(--text-white)',
                        borderTopColor: 'transparent',
                        animation: 'spin 1s linear infinite'
                      }} />
                      {editStoryId ? 'Salvando...' : 'Publicando...'}
                    </span>
                  ) : (
                    editStoryId ? 'Salvar Alterações' : 'Publicar Story'
                  )}
                </button>
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
                    maxLength={20}
                  />
                  <span style={{ display: 'block', textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {bannerTitle.length}/20
                  </span>
                </div>
                <div className="form-group">
                  <label>Subtítulo do Banner (Opcional)</label>
                  <input
                    type="text"
                    className="input-field"
                    value={bannerSubtitle}
                    onChange={(e) => setBannerSubtitle(e.target.value)}
                    placeholder="Ex: Descontos de até 30% em serviços"
                    maxLength={40}
                  />
                  <span style={{ display: 'block', textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {bannerSubtitle.length}/40
                  </span>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Data de Inicialização</label>
                  <input
                    type="date"
                    className="input-field"
                    value={bannerInitialization}
                    onChange={(e) => setBannerInitialization(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Data de Expiração</label>
                  <input
                    type="date"
                    className="input-field"
                    value={bannerExpiration}
                    onChange={(e) => setBannerExpiration(e.target.value)}
                    min={bannerInitialization || getTodayStr()}
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Abrangência do Banner</label>
                  <select
                    className="select-field"
                    value={bannerScope}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setBannerScope(val);
                      if (val === 'national') {
                        setBannerState('');
                        setBannerCity('');
                      } else if (val === 'state') {
                        setBannerCity('');
                      }
                    }}
                  >
                    <option value="national">Nacional</option>
                    <option value="state">Estadual</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>País</label>
                  <select
                    className="select-field"
                    value={bannerCountry}
                    onChange={(e) => {
                      setBannerCountry(e.target.value);
                      setBannerState('');
                      setBannerCity('');
                    }}
                    required
                  >
                    <option value="">Selecione o País</option>
                    {Country.getAllCountries().map((c) => (
                      <option key={c.isoCode} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {bannerScope === 'state' && (
                <div className="grid-2">
                  <div className="form-group">
                    <label>Estado</label>
                    <select
                      className="select-field"
                      value={bannerState}
                      onChange={(e) => {
                        setBannerState(e.target.value);
                        setBannerCity('');
                      }}
                      required
                    >
                      <option value="">Selecione o Estado</option>
                      {(() => {
                        const selectedCountryObj = Country.getAllCountries().find(c => c.name === bannerCountry);
                        const states = selectedCountryObj ? State.getStatesOfCountry(selectedCountryObj.isoCode) : [];
                        return states.map((s) => (
                          <option key={s.isoCode} value={s.isoCode}>{s.name} ({s.isoCode})</option>
                        ));
                      })()}
                    </select>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Imagem do Banner (Recortada na proporção 16:9)</label>
                <FileUploadZone
                  mediaUrl={bannerImageUrl}
                  setMediaUrl={setBannerImageUrl}
                  mediaType="image"
                  allowedTypes={['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']}
                  folder="images/banners"
                  forceCrop={true}
                  aspectRatio="16:9"
                />
              </div>

              {renderLinkConfigFields(
                bannerLinkType,
                setBannerLinkType,
                bannerLinkRawValue,
                setBannerLinkRawValue,
                bannerLinkCustomRoute,
                setBannerLinkCustomRoute,
                bannerLinkLabel,
                setBannerLinkLabel,
                50
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

      {previewMedia && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setPreviewMedia(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '85vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#000',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewMedia(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(0, 0, 0, 0.6)',
                border: 'none',
                color: '#fff',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                zIndex: 10
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.9)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'; }}
            >
              <X size={20} />
            </button>

            {previewMedia.type === 'image' ? (
              <img
                src={previewMedia.url}
                alt="Visualização"
                style={{
                  maxWidth: '100%',
                  maxHeight: '85vh',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
            ) : (
              <video
                src={previewMedia.url}
                controls
                autoPlay
                style={{
                  maxWidth: '100%',
                  maxHeight: '85vh',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
            )}
          </div>
        </div>
      )}

      {confirmModal.isOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="modal-content" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}>
              <X size={20} />
            </button>
            <h3 className="modal-title">{confirmModal.title}</h3>
            <p style={{ margin: '16px 0', fontSize: '14px', color: 'var(--text-main)', lineHeight: '1.5' }}>
              {confirmModal.message}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={async () => {
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                  await confirmModal.onConfirm();
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ================= MODAL: WORK SEARCH/SELECT ================= */}
      {workSearchModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={() => setWorkSearchModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setWorkSearchModalOpen(false)}>
              <X size={20} />
            </button>
            <h3 className="modal-title">Selecione a Obra</h3>

            <div style={{ margin: '16px 0' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Pesquisar por título da obra..."
                value={workSearchQuery}
                onChange={(e) => setWorkSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {loadingWorks ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px' }}>Carregando obras...</p>
              ) : worksList.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px' }}>Nenhuma obra ativa encontrada.</p>
              ) : (
                worksList.map((work) => (
                  <div
                    key={work.id}
                    onClick={() => {
                      if (onWorkSelectCallback) {
                        onWorkSelectCallback(work.id, work.title);
                      }
                    }}
                    style={{
                      padding: '12px',
                      backgroundColor: 'var(--bg-app)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      border: '1px solid var(--border-light)',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--border-light)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-app)'; }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{work.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>📍 {work.city || 'Desconhecida'}/{work.state || ''}</span>
                      <span style={{ textTransform: 'uppercase', fontWeight: 600, color: 'var(--primary)' }}>
                        {work.status === 'aberta' || work.status === 'available' ? 'Aberta' : 'Em andamento'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {/* ================= MODAL: PROFILE SEARCH/SELECT ================= */}
      {profileSearchModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={() => setProfileSearchModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setProfileSearchModalOpen(false)}>
              <X size={20} />
            </button>
            <h3 className="modal-title">Selecione o Perfil</h3>

            <div style={{ margin: '16px 0' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Pesquisar por nome do perfil..."
                value={profileSearchQuery}
                onChange={(e) => setProfileSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {loadingProfiles ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px' }}>Carregando perfis...</p>
              ) : profilesList.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px' }}>Nenhum perfil encontrado.</p>
              ) : (
                profilesList.map((profile) => (
                  <div
                    key={profile.id}
                    onClick={() => {
                      if (onProfileSelectCallback) {
                        onProfileSelectCallback(profile.id, profile.name || 'Sem nome');
                      }
                    }}
                    style={{
                      padding: '12px',
                      backgroundColor: 'var(--bg-app)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      border: '1px solid var(--border-light)',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--border-light)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-app)'; }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{profile.name || 'Sem nome'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>✉️ {profile.email || 'Sem e-mail'}</span>
                      <span>ID: {profile.id.slice(0, 8)}...</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
