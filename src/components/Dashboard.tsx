/* eslint-disable complexity, @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useUsers } from '../hooks/useUsers';
import { useReports } from '../hooks/useReports';
import { useStories } from '../hooks/useStories';
import { useBanners } from '../hooks/useBanners';
import { uploadToR2 } from '../services/storageService';
import { supabase } from '../lib/supabase';
import { storiesService } from '../services/storiesService';
import { notificationsService } from '../services/notificationsService';
import { useToast } from '../hooks/useToast';
import { useModeration } from '../hooks/useModeration';
import { useWorksModeration } from '../hooks/useWorksModeration';
import { useAdPricing } from '../hooks/useAdPricing';
import { useAdminUsers } from '../hooks/useAdminUsers';
import { Country, State, City } from 'country-state-city';
import logoImg from '../assets/logo.png';
import ImageCropperModal from './ImageCropperModal';
import { Sidebar } from './dashboard/Sidebar';
import { Header } from './dashboard/Header';
import { OverviewTab } from './dashboard/tabs/OverviewTab';
import { UsersTab } from './dashboard/tabs/UsersTab';
import { WorksModerationTab } from './dashboard/tabs/WorksModerationTab';
import { StoriesTab } from './dashboard/tabs/StoriesTab';
import { ReportsTab } from './dashboard/tabs/ReportsTab';
import { BannersTab } from './dashboard/tabs/BannersTab';
import { ModerationTab } from './dashboard/tabs/ModerationTab';
import { FinancialTab } from './dashboard/tabs/FinancialTab';
import { SettingsTab } from './dashboard/tabs/SettingsTab';
import { ReportDetailsModal } from './dashboard/modals/ReportDetailsModal';
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
  Award,
  Info,
  Key
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

const calculateDaysDifference = (startStr?: string, endStr?: string) => {
  if (!startStr || !endStr) return 0;
  try {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  } catch {
    return 0;
  }
};

const getAdDates = (item: any, type: 'banner' | 'story') => {
  if (type === 'banner') {
    return {
      start: item.initialization_date,
      end: item.expiration_date
    };
  } else {
    return {
      start: item.initialization_date || item.data_inicializacao,
      end: item.expiration_date || item.data_expiracao
    };
  }
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
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'works' | 'stories' | 'reports' | 'settings' | 'banners' | 'moderation' | 'financial'>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Custom Hooks & Notification Settings
  const userHook = useUsers();
  const reportHook = useReports();
  const storyHook = useStories();
  const bannersHook = useBanners();
  const adPricingHook = useAdPricing();
  const adminUsersHook = useAdminUsers();
  const worksModerationHook = useWorksModeration();

  // Request Settings & Notification States
  const [requestDisplayOnScreen, setRequestDisplayOnScreen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('siga_req_display_on_screen');
      return saved !== 'false';
    }
    return true;
  });

  const [requestSoundAlert, setRequestSoundAlert] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('siga_req_sound_alert');
      return saved !== 'false';
    }
    return true;
  });

  const [requestQueue, setRequestQueue] = useState<Array<{ type: 'banner' | 'story'; item: any }>>([]);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const requestDisplayOnScreenRef = React.useRef(requestDisplayOnScreen);
  useEffect(() => {
    requestDisplayOnScreenRef.current = requestDisplayOnScreen;
  }, [requestDisplayOnScreen]);

  const requestSoundAlertRef = React.useRef(requestSoundAlert);
  useEffect(() => {
    requestSoundAlertRef.current = requestSoundAlert;
  }, [requestSoundAlert]);

  const playSoundAlert = React.useCallback(() => {
    try {
      const audio = new Audio('/assets/sons/opening-bell.mp3');
      audio.play().catch(err => {
        console.warn('[AudioAlert] Erro na reprodução automática:', err);
      });
    } catch (err) {
      console.warn('[AudioAlert] Erro ao instanciar áudio:', err);
    }
  }, []);

  const triggerBrowserNotification = React.useCallback((title: string, body: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body,
          icon: '/favicon.svg'
        });
        notif.onclick = () => {
          window.focus();
          setActiveTab('moderation');
        };
      } catch (err) {
        console.warn('[BrowserNotification] Erro ao disparar notificação:', err);
      }
    }
  }, []);

  const requestNotificationPermission = React.useCallback(async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        success('Permissão para notificações do navegador concedida!');
      } else if (perm === 'denied') {
        warning('Notificações do navegador bloqueadas.');
      }
    }
  }, [success, warning]);

  // Moderation state & Realtime Callback
  const [adTypeFilter, setAdTypeFilter] = useState<'banner' | 'story' | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [moderationModalOpen, setModerationModalOpen] = useState(false);
  const [selectedModerationItem, setSelectedModerationItem] = useState<any | null>(null);
  const [selectedModerationType, setSelectedModerationType] = useState<'banner' | 'story'>('banner');

  const moderationModalOpenRef = React.useRef(moderationModalOpen);
  useEffect(() => {
    moderationModalOpenRef.current = moderationModalOpen;
  }, [moderationModalOpen]);

  const handleNewRequest = React.useCallback(({ type, item }: { type: 'banner' | 'story'; item: any }) => {
    // 1. Sound Alert
    if (requestSoundAlertRef.current) {
      playSoundAlert();
    }

    // 2. Browser Notification
    const labelType = type === 'banner' ? 'Banner' : 'Story';
    const name = type === 'banner' ? (item.title || 'Sem título') : (item.story_channels?.name || item.name || 'Story');
    triggerBrowserNotification(
      'Nova Solicitação de Publicidade 🚀',
      `Chegou um novo ${labelType}: "${name}". Clique para analisar.`
    );

    // 3. Screen Display & Modal Queue
    if (requestDisplayOnScreenRef.current) {
      if (moderationModalOpenRef.current) {
        setRequestQueue(prev => [...prev, { type, item }]);
      } else {
        setSelectedModerationItem(item);
        setSelectedModerationType(type);
        setModerationModalOpen(true);
      }
    }
  }, [playSoundAlert, triggerBrowserNotification]);

  const moderationHook = useModeration({ onNewRequest: handleNewRequest });

  const handleCloseModerationModal = React.useCallback(() => {
    setRequestQueue(prevQueue => {
      if (prevQueue.length > 0) {
        const next = prevQueue[0];
        const remaining = prevQueue.slice(1);
        setTimeout(() => {
          setSelectedModerationItem(next.item);
          setSelectedModerationType(next.type);
          setModerationModalOpen(true);
        }, 0);
        return remaining;
      } else {
        setTimeout(() => {
          setModerationModalOpen(false);
          setSelectedModerationItem(null);
        }, 0);
        return [];
      }
    });
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [adTypeFilter, moderationHook.statusFilter]);

  const getFilteredModerationItems = () => {
    const banners = (moderationHook.pendingBanners || []).map((b: any) => ({ ...b, _type: 'banner' as const }));
    const stories = (moderationHook.pendingStories || []).map((s: any) => ({ ...s, _type: 'story' as const }));

    let combined = [];
    if (adTypeFilter === 'banner') {
      combined = banners;
    } else if (adTypeFilter === 'story') {
      combined = stories;
    } else {
      combined = [...banners, ...stories];
    }

    return combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const filteredModerationItems = getFilteredModerationItems();
  const moderationItemsPerPage = 10;
  const totalModerationItems = filteredModerationItems.length;
  const totalModerationPages = Math.ceil(totalModerationItems / moderationItemsPerPage);
  const startModerationIndex = (currentPage - 1) * moderationItemsPerPage;
  const paginatedModerationItems = filteredModerationItems.slice(startModerationIndex, startModerationIndex + moderationItemsPerPage);

  // Rejection modal state
  const [rejectionReasonModalOpen, setRejectionReasonModalOpen] = useState(false);
  const [rejectionOption, setRejectionOption] = useState<'low_quality' | 'errors_or_offensive' | 'invalid_link' | 'other'>('low_quality');
  const [rejectionText, setRejectionText] = useState('');

  // Settings sub-tab state
  const [settingsSubTab, setSettingsSubTab] = useState<'general' | 'banners' | 'stories' | 'contracts' | 'admins' | 'requests'>('general');

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

  // Admin users modal and form state
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAdminPasswordModalOpen, setIsAdminPasswordModalOpen] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const [selectedAdminUsername, setSelectedAdminUsername] = useState<string>('');

  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminConfirmPassword, setNewAdminConfirmPassword] = useState('');

  const [editAdminPassword, setEditAdminPassword] = useState('');
  const [editAdminConfirmPassword, setEditAdminConfirmPassword] = useState('');

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

  // Contract template modal state
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [contractTemplate, setContractTemplate] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('siga_contract_template');
      if (saved) return saved;
    }
    return `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE CONSTRUÇÃO CIVIL
`;
  });
  const [tempTemplateText, setTempTemplateText] = useState('');
  const [templatePt, setTemplatePt] = useState('');
  const [templateEn, setTemplateEn] = useState('');
  const [templateEs, setTemplateEs] = useState('');
  const [selectedLangTab, setSelectedLangTab] = useState<'pt' | 'en' | 'es'>('pt');

  const fetchContractTemplate = useCallback(async () => {
    try {
      const { data, error: tErr } = await (supabase
        .from('contract_templates') as any)
        .select('*')
        .eq('key', 'default')
        .single();
      if (tErr) throw tErr;
      if (data) {
        setTemplatePt(data.template_pt);
        setTemplateEn(data.template_en);
        setTemplateEs(data.template_es);
        setContractTemplate(data.template_pt);
      }
    } catch (err) {
      console.error('Erro ao buscar template de contrato do banco:', err);
    }
  }, []);

  const handleLangTabChange = (newLang: 'pt' | 'en' | 'es') => {
    if (selectedLangTab === 'pt') setTemplatePt(tempTemplateText);
    else if (selectedLangTab === 'en') setTemplateEn(tempTemplateText);
    else if (selectedLangTab === 'es') setTemplateEs(tempTemplateText);

    setSelectedLangTab(newLang);

    if (newLang === 'pt') setTempTemplateText(templatePt);
    else if (newLang === 'en') setTempTemplateText(templateEn);
    else if (newLang === 'es') setTempTemplateText(templateEs);
  };

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
  const [bannerScope, setBannerScope] = useState<'national' | 'state' | 'city'>('national');
  const [bannerCountry, setBannerCountry] = useState('Brazil');
  const [bannerState, setBannerState] = useState('');
  const [bannerCity, setBannerCity] = useState('');

  // Users list for redirection
  const [linkUsersList, setLinkUsersList] = useState<{ id: string; name: string | null }[]>([]);

  // State for paginating scheduled banners
  const [scheduledLimit, setScheduledLimit] = useState(5);

  const getScopePrice = (type: 'banner' | 'story', scope: 'global' | 'national' | 'state' | 'city') => {
    return adPricingHook.prices[type]?.[scope] || 0;
  };

  const handleOpenModerationDetails = (item: any, type: 'banner' | 'story') => {
    setSelectedModerationItem(item);
    setSelectedModerationType(type);
    setModerationModalOpen(true);
  };

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

  // Local state for Overview counts without filters
  const [newUsersCount, setNewUsersCount] = useState<number | null>(null);
  const [newContractsCount, setNewContractsCount] = useState<number | null>(null);
  const [contractValue, setContractValue] = useState<number>(49.90);

  useEffect(() => {
    if (adPricingHook.prices.contract.global) {
      setContractValue(adPricingHook.prices.contract.global);
    }
  }, [adPricingHook.prices.contract.global]);
  const [closedContracts, setClosedContracts] = useState<any[]>([]);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [contractPricesInput, setContractPricesInput] = useState<Record<string, number>>({});
  const [totalActiveStoriesChannelsCount, setTotalActiveStoriesChannelsCount] = useState<number | null>(null);
  const [totalActiveBannersCount, setTotalActiveBannersCount] = useState<number | null>(null);
  const [financialStartDate, setFinancialStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [financialEndDate, setFinancialEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [financialIncludeBanners, setFinancialIncludeBanners] = useState(true);
  const [financialIncludeStories, setFinancialIncludeStories] = useState(true);
  const [financialIncludeContracts, setFinancialIncludeContracts] = useState(true);

  const [financialData, setFinancialData] = useState<{
    days: { dateStr: string; dateLabel: string; banners: number; stories: number; contracts: number; total: number }[];
    grandTotal: number;
    totalBanners: number;
    totalStories: number;
    totalContracts: number;
  }>({ days: [], grandTotal: 0, totalBanners: 0, totalStories: 0, totalContracts: 0 });

  useEffect(() => {
    async function fetchFinancialData() {
      try {
        if (!financialStartDate || !financialEndDate) return;

        const start = new Date(financialStartDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(financialEndDate);
        end.setHours(23, 59, 59, 999);

        const { data, error: err } = await supabase
          .from('ad_payments')
          .select('*')
          .eq('status', 'paid')
          .gte('paid_at', start.toISOString())
          .lte('paid_at', end.toISOString());

        if (!err && data) {
          const daysMap: Record<string, { dateLabel: string; banners: number; stories: number; contracts: number; total: number }> = {};
          const dayList: string[] = [];

          let current = new Date(start);
          const limit = new Date(end);
          while (current <= limit) {
            const key = current.toISOString().split('T')[0];
            const label = current.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            daysMap[key] = { dateLabel: label, banners: 0, stories: 0, contracts: 0, total: 0 };
            dayList.push(key);
            current.setDate(current.getDate() + 1);
          }

          let grandTotalSum = 0;
          let totalBannersSum = 0;
          let totalStoriesSum = 0;
          let totalContractsSum = 0;

          data.forEach((p: any) => {
            const paidDate = new Date(p.paid_at || p.created_at);
            const key = paidDate.toISOString().split('T')[0];
            const amount = parseFloat(p.amount || 0);

            if (daysMap[key]) {
              const isBanner = !!p.banner_id;
              const isStory = !!p.story_channel_id;

              if (isBanner && financialIncludeBanners) {
                daysMap[key].banners += amount;
                daysMap[key].total += amount;
                grandTotalSum += amount;
                totalBannersSum += amount;
              } else if (isStory && financialIncludeStories) {
                daysMap[key].stories += amount;
                daysMap[key].total += amount;
                grandTotalSum += amount;
                totalStoriesSum += amount;
              }
            }
          });

          if (financialIncludeContracts) {
            const { data: contractsData, error: cErr } = await supabase
              .from('contracts')
              .select('*')
              .or('client_paid.eq.true,professional_paid.eq.true');

            if (!cErr && contractsData) {
              contractsData.forEach((contract: any) => {
                const paymentDateStr = contract.client_payment_date || contract.professional_payment_date || contract.updated_at;
                const paymentDate = new Date(paymentDateStr);
                const key = paymentDate.toISOString().split('T')[0];

                let amount = 0;
                if (contract.client_paid) {
                  amount += parseFloat(contract.client_payment_amount || 0);
                } else if (contract.professional_paid) {
                  amount += parseFloat(contract.professional_payment_amount || 0);
                }

                if (paymentDate >= start && paymentDate <= end) {
                  if (daysMap[key]) {
                    daysMap[key].contracts += amount;
                    daysMap[key].total += amount;
                    grandTotalSum += amount;
                    totalContractsSum += amount;
                  }
                }
              });
            }
          }

          const formattedDays = dayList.map(key => ({
            dateStr: key,
            ...daysMap[key]
          }));

          setFinancialData({
            days: formattedDays,
            grandTotal: grandTotalSum,
            totalBanners: totalBannersSum,
            totalStories: totalStoriesSum,
            totalContracts: totalContractsSum
          });
        }
      } catch (err) {
        console.error('Erro ao buscar dados financeiros:', err);
      }
    }
    fetchFinancialData();
  }, [activeTab, financialStartDate, financialEndDate, financialIncludeBanners, financialIncludeStories, financialIncludeContracts, contractValue]);

  useEffect(() => {
    async function fetchNewUsersCount() {
      try {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const { count, error: err } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', oneMonthAgo.toISOString());
        if (!err && count !== null) {
          setNewUsersCount(count);
        }
      } catch (err) {
        console.error('Erro ao buscar novos usuários:', err);
      }
    }
    fetchNewUsersCount();
  }, [userHook.users]);

  useEffect(() => {
    async function fetchNewContractsCount() {
      try {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const { count, error: err } = await supabase
          .from('proposals')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'aceita')
          .gte('created_at', oneMonthAgo.toISOString());
        if (!err && count !== null) {
          setNewContractsCount(count);
        }
      } catch (err) {
        console.error('Erro ao buscar novos contratos:', err);
      }
    }
    fetchNewContractsCount();
  }, []);

  useEffect(() => {
    async function fetchActiveChannelsCount() {
      try {
        const { count, error: err } = await supabase
          .from('story_channels')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
          .neq('status', 'deleted');
        if (!err && count !== null) {
          setTotalActiveStoriesChannelsCount(count);
        }
      } catch (err) {
        console.error('Erro ao buscar canais de stories ativos:', err);
      }
    }
    fetchActiveChannelsCount();
  }, [storyHook.channels]);

  useEffect(() => {
    async function fetchActiveBannersCount() {
      try {
        const { count, error: err } = await supabase
          .from('banners')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');
        if (!err && count !== null) {
          setTotalActiveBannersCount(count);
        }
      } catch (err) {
        console.error('Erro ao buscar banners ativos:', err);
      }
    }
    fetchActiveBannersCount();
  }, [bannersHook.banners]);

  const fetchClosedContracts = useCallback(async () => {
    setContractsLoading(true);
    try {
      const { data: proposalsData, error: pErr } = await (supabase
        .from('proposals')
        .select('*') as any)
        .eq('status', 'aceita');

      if (pErr) throw pErr;

      if (proposalsData && proposalsData.length > 0) {
        const workIds = proposalsData.map((p: any) => p.work_id).filter(Boolean);
        const { data: worksData } = await (supabase
          .from('works')
          .select('id, title, client_id') as any)
          .in('id', workIds);

        const budgetIds = proposalsData.map((p: any) => p.budget_id).filter(Boolean);
        let budgetsData: any[] = [];
        if (budgetIds.length > 0) {
          const { data } = await (supabase
            .from('budgets')
            .select('id, total_value') as any)
            .in('id', budgetIds);
          budgetsData = data || [];
        }

        const professionalIds = proposalsData.map((p: any) => p.professional_id).filter(Boolean);
        const clientIds = worksData?.map((w: any) => w.client_id).filter(Boolean) || [];
        const allUserIds = Array.from(new Set([...professionalIds, ...clientIds]));

        let usersData: any[] = [];
        if (allUserIds.length > 0) {
          const { data } = await (supabase
            .from('users')
            .select('id, name') as any)
            .in('id', allUserIds);
          usersData = data || [];
        }

        const mapped = proposalsData.map((prop: any) => {
          const work = worksData?.find((w: any) => w.id === prop.work_id);
          const budget = budgetsData?.find((b: any) => b.id === prop.budget_id);
          const professional = usersData?.find((u: any) => u.id === prop.professional_id);
          const client = usersData?.find((u: any) => u.id === work?.client_id);

          const savedOverride = typeof window !== 'undefined' ? localStorage.getItem(`siga_contract_val_${prop.id}`) : null;
          const currentVal = savedOverride ? parseFloat(savedOverride) : (budget?.total_value || contractValue);

          return {
            ...prop,
            workTitle: work?.title || 'Obra sem título',
            professionalName: professional?.name || 'Profissional não identificado',
            clientName: client?.name || 'Cliente não identificado',
            budgetValue: currentVal
          };
        });

        const initialInputs: Record<string, number> = {};
        mapped.forEach((c: any) => {
          initialInputs[c.id] = c.budgetValue;
        });
        setContractPricesInput(initialInputs);
        setClosedContracts(mapped);
      } else {
        setClosedContracts([]);
      }
    } catch (err) {
      console.error('Erro ao buscar contratos:', err);
    } finally {
      setContractsLoading(false);
    }
  }, [contractValue]);

  useEffect(() => {
    if (activeTab === 'settings' && settingsSubTab === 'contracts') {
      fetchClosedContracts();
      fetchContractTemplate();
    }
  }, [activeTab, settingsSubTab, fetchClosedContracts, fetchContractTemplate]);

  const handleSaveContractValue = async (contract: any) => {
    const val = contractPricesInput[contract.id];
    if (val === undefined || isNaN(val)) {
      warning('Por favor, informe um valor válido.');
      return;
    }

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`siga_contract_val_${contract.id}`, val.toString());
      }

      if (contract.budget_id) {
        const { error: bErr } = await (supabase
          .from('budgets') as any)
          .update({ total_value: val })
          .eq('id', contract.budget_id);
        if (bErr) throw bErr;
      }

      success('Valor do contrato atualizado com sucesso!');
      fetchClosedContracts();
    } catch (err: any) {
      error('Erro ao salvar valor do contrato: ' + err.message);
    }
  };

  // Overview calculated statistics
  const totalUsersCount = userHook.totalCount || 0;
  const pendingReportsCount = reportHook.reports.filter(r => r.status === 'new').length;
  const selectedChannel = storyHook.channels.find((c: any) => c.id === storyHook.selectedChannelId);
  const pendingRequestsCount = moderationHook.pendingCount;

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
      .in('status', ['active', 'scheduled', 'awaiting_payment', 'pending'])
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
        state: (bannerScope === 'state' || bannerScope === 'city') ? bannerState : null,
        city: bannerScope === 'city' ? bannerCity : null,
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
        state: (bannerScope === 'state' || bannerScope === 'city') ? bannerState || null : null,
        city: bannerScope === 'city' ? bannerCity || null : null
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

  const handleCreateAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUsername || !newAdminPassword || !newAdminConfirmPassword) {
      error('Por favor, preencha todos os campos.');
      return;
    }
    if (newAdminPassword !== newAdminConfirmPassword) {
      error('As senhas não coincidem.');
      return;
    }
    const success = await adminUsersHook.createAdmin({
      username: newAdminUsername,
      password: newAdminPassword,
    });
    if (success) {
      setIsAdminModalOpen(false);
      setNewAdminUsername('');
      setNewAdminPassword('');
      setNewAdminConfirmPassword('');
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdminId) return;
    if (!editAdminPassword || !editAdminConfirmPassword) {
      error('Por favor, preencha todos os campos.');
      return;
    }
    if (editAdminPassword !== editAdminConfirmPassword) {
      error('As senhas não coincidem.');
      return;
    }
    const success = await adminUsersHook.changePassword(selectedAdminId, editAdminPassword);
    if (success) {
      setIsAdminPasswordModalOpen(false);
      setEditAdminPassword('');
      setEditAdminConfirmPassword('');
      setSelectedAdminId(null);
    }
  };

  const handleDeleteAdminClick = (admin: any) => {
    if (admin.username === adminUsername) {
      error('Você não pode excluir sua própria conta.');
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Administrador',
      message: `Tem certeza que deseja excluir o administrador "${admin.username}"? Esta ação é irreversível e removerá o acesso desta conta ao painel.`,
      onConfirm: async () => {
        await adminUsersHook.deleteAdmin(admin.id);
      }
    });
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
      {/* Sidebar Component */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={setMobileSidebarOpen}
        pendingModerationCount={moderationHook.pendingCount}
        pendingReportsCount={pendingReportsCount}
        currentUserEmail={currentUserEmail}
        onLogout={onLogout}
      />

      {/* Main Panel Content */}
      <main className="main-content">
        <Header activeTab={activeTab} setMobileSidebarOpen={setMobileSidebarOpen} />

        <div className="content-body">
          {activeTab === 'overview' && (
            <OverviewTab
              totalUsersCount={totalUsersCount}
              newUsersCount={newUsersCount}
              newContractsCount={newContractsCount}
              pendingReportsCount={pendingReportsCount}
              totalActiveStoriesChannelsCount={totalActiveStoriesChannelsCount}
              totalActiveBannersCount={totalActiveBannersCount}
              pendingRequestsCount={pendingRequestsCount}
            />
          )}

          {activeTab === 'users' && (
            <UsersTab
              userHook={userHook}
              onSelectUser={async (u) => {
                await userHook.loadUserDetails(u.id);
                setSelectedUserTab('portfolio');
                setUserModalOpen(true);
              }}
            />
          )}

          {activeTab === 'works' && (
            <WorksModerationTab worksModerationHook={worksModerationHook} />
          )}

          {activeTab === 'stories' && (
            <StoriesTab
              storyHook={storyHook}
              setNewChannelName={setNewChannelName}
              setNewChannelAvatar={setNewChannelAvatar}
              setNewChannelDestaque={setNewChannelDestaque}
              setNewChannelScope={setNewChannelScope}
              setNewChannelState={setNewChannelState}
              setNewChannelCity={setNewChannelCity}
              setAddChannelModalOpen={setAddChannelModalOpen}
              handleOpenAddStory={handleOpenAddStory}
              handleEditChannelClick={handleEditChannelClick}
              handleDeleteChannel={handleDeleteChannel}
              setPreviewMedia={setPreviewMedia}
              handleExpireStoryClick={handleExpireStoryClick}
              handleDeleteStoryClick={handleDeleteStoryClick}
              setConfirmModal={setConfirmModal}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsTab
              reportHook={reportHook}
              onOpenReportDetails={handleOpenReportDetails}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              settingsSubTab={settingsSubTab}
              setSettingsSubTab={setSettingsSubTab}
              requestDisplayOnScreen={requestDisplayOnScreen}
              setRequestDisplayOnScreen={setRequestDisplayOnScreen}
              requestSoundAlert={requestSoundAlert}
              setRequestSoundAlert={setRequestSoundAlert}
              notificationPermission={notificationPermission}
              requestNotificationPermission={requestNotificationPermission}
              adPricingHook={adPricingHook}
              setSelectedLangTab={setSelectedLangTab}
              setTempTemplateText={setTempTemplateText}
              templatePt={templatePt}
              contractTemplate={contractTemplate}
              setIsTemplateModalOpen={setIsTemplateModalOpen}
              adminUsersHook={adminUsersHook}
              adminUsername={adminUsername}
              setNewAdminUsername={setNewAdminUsername}
              setNewAdminPassword={setNewAdminPassword}
              setNewAdminConfirmPassword={setNewAdminConfirmPassword}
              setIsAdminModalOpen={setIsAdminModalOpen}
              setSelectedAdminId={setSelectedAdminId}
              setSelectedAdminUsername={setSelectedAdminUsername}
              setEditAdminPassword={setEditAdminPassword}
              setEditAdminConfirmPassword={setEditAdminConfirmPassword}
              setIsAdminPasswordModalOpen={setIsAdminPasswordModalOpen}
              handleDeleteAdminClick={handleDeleteAdminClick}
            />
          )}

          {activeTab === 'financial' && (
            <FinancialTab
              financialData={financialData}
              financialStartDate={financialStartDate}
              setFinancialStartDate={setFinancialStartDate}
              financialEndDate={financialEndDate}
              setFinancialEndDate={setFinancialEndDate}
              financialIncludeBanners={financialIncludeBanners}
              setFinancialIncludeBanners={setFinancialIncludeBanners}
              financialIncludeStories={financialIncludeStories}
              setFinancialIncludeStories={setFinancialIncludeStories}
              financialIncludeContracts={financialIncludeContracts}
              setFinancialIncludeContracts={setFinancialIncludeContracts}
            />
          )}

          {activeTab === 'moderation' && (
            <ModerationTab
              moderationHook={moderationHook}
              adTypeFilter={adTypeFilter}
              setAdTypeFilter={setAdTypeFilter}
              totalModerationItems={totalModerationItems}
              paginatedModerationItems={paginatedModerationItems}
              handleOpenModerationDetails={handleOpenModerationDetails}
              totalModerationPages={totalModerationPages}
              startModerationIndex={startModerationIndex}
              moderationItemsPerPage={moderationItemsPerPage}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
            />
          )}

          {activeTab === 'banners' && (
            <BannersTab
              bannersHook={bannersHook}
              handleOpenAddBanner={handleOpenAddBanner}
              handleToggleBannerStatus={handleToggleBannerStatus}
              handleDeleteBannerClick={handleDeleteBannerClick}
            />
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
                                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
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
                                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
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

      {/* ================= MODAL: CONTRACT TEMPLATE ================= */}
      {isTemplateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '700px', width: '90%' }}>
            <button className="modal-close" onClick={() => setIsTemplateModalOpen(false)}>
              <X size={20} />
            </button>
            <h3 className="modal-title">Modelo do Contrato</h3>

            <div style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--text-muted)' }}>
              Altere o modelo de texto base que será gerado quando os usuários firmarem um contrato de prestação de serviços.
            </div>

            {/* Language tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
              <button
                type="button"
                className={`btn ${selectedLangTab === 'pt' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleLangTabChange('pt')}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                Português
              </button>
              <button
                type="button"
                className={`btn ${selectedLangTab === 'en' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleLangTabChange('en')}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                Inglês
              </button>
              <button
                type="button"
                className={`btn ${selectedLangTab === 'es' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleLangTabChange('es')}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                Espanhol
              </button>
            </div>

            <div className="form-group">
              <label>Texto do Modelo de Contrato ({selectedLangTab.toUpperCase()})</label>
              <textarea
                className="textarea-field"
                style={{ minHeight: '350px', width: '100%', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.6' }}
                value={tempTemplateText}
                onChange={(e) => setTempTemplateText(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsTemplateModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={async () => {
                  let latestPt = templatePt;
                  let latestEn = templateEn;
                  let latestEs = templateEs;

                  if (selectedLangTab === 'pt') {
                    latestPt = tempTemplateText;
                    setTemplatePt(tempTemplateText);
                  } else if (selectedLangTab === 'en') {
                    latestEn = tempTemplateText;
                    setTemplateEn(tempTemplateText);
                  } else if (selectedLangTab === 'es') {
                    latestEs = tempTemplateText;
                    setTemplateEs(tempTemplateText);
                  }

                  try {
                    const { error: saveErr } = await (supabase
                      .from('contract_templates') as any)
                      .upsert({
                        key: 'default',
                        template_pt: latestPt,
                        template_en: latestEn,
                        template_es: latestEs,
                        updated_at: new Date().toISOString()
                      }, { onConflict: 'key' });

                    if (saveErr) throw saveErr;

                    setContractTemplate(latestPt);
                    success('Modelo do contrato atualizado com sucesso no banco de dados!');
                    setIsTemplateModalOpen(false);
                  } catch (err: any) {
                    error('Erro ao salvar modelo no banco: ' + err.message);
                  }
                }}
              >
                Salvar Alterações
              </button>
            </div>
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
      <ReportDetailsModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        selectedReport={selectedReport}
        reportNotes={reportNotes}
        setReportNotes={setReportNotes}
        onUpdateStatus={handleUpdateReportStatus}
        onOpenUser={async (userId: string) => {
          await userHook.loadUserDetails(userId);
          setSelectedUserTab('portfolio');
          setUserModalOpen(true);
        }}
        onOpenWork={(workId: string) => {
          info(`Visualização da Obra ID ${workId}`);
        }}
      />

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
                    <option value="city">Municipal</option>
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

              {(bannerScope === 'state' || bannerScope === 'city') && (
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

                  {bannerScope === 'city' && (
                    <div className="form-group">
                      <label>Cidade</label>
                      <select
                        className="select-field"
                        value={bannerCity}
                        onChange={(e) => setBannerCity(e.target.value)}
                        required
                      >
                        <option value="">Selecione a Cidade</option>
                        {(() => {
                          const selectedCountryObj = Country.getAllCountries().find(c => c.name === bannerCountry);
                          const states = selectedCountryObj ? State.getStatesOfCountry(selectedCountryObj.isoCode) : [];
                          const selectedStateObj = states.find(s => s.isoCode === bannerState);
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
        <div className="modal-overlay" style={{ zIndex: 1300 }} onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}>
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

      {/* ================= MODAL: MODERATION DETAILS ================= */}
      {moderationModalOpen && selectedModerationItem && (
        <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={handleCloseModerationModal}>
          <div className="modal-content" style={{ maxWidth: '850px', width: '95vw', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleCloseModerationModal}>
              <X size={20} />
            </button>
            <h3 className="modal-title">Análise de Solicitação de Publicidade</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '32px', marginBottom: '24px' }}>
              {/* Media Preview Column */}
              <div>
                <span className="label" style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  Conteúdo Enviado
                </span>
                {selectedModerationType === 'banner' ? (
                  <div style={{
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    backgroundColor: '#000',
                    aspectRatio: '16/9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {selectedModerationItem.image_url ? (
                      <img
                        src={selectedModerationItem.image_url}
                        alt="Banner Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <span style={{ color: '#fff' }}>Sem Imagem</span>
                    )}
                  </div>
                ) : (
                  <div>
                    {/* Story Channel Avatar and details */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', padding: '12px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                      <div style={{ width: '50px', height: '50px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#ddd', display: 'flex', alignItems: 'center', justifyItems: 'center' }}>
                        {(selectedModerationItem.story_channels?.avatar_url || selectedModerationItem.avatar_url) ? (
                          <img src={selectedModerationItem.story_channels?.avatar_url || selectedModerationItem.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ margin: 'auto', fontWeight: 600 }}>{(selectedModerationItem.story_channels?.name || selectedModerationItem.name || '?')[0]}</span>
                        )}
                      </div>
                      <div>
                        <span style={{ fontWeight: 600, display: 'block' }}>{selectedModerationItem.story_channels?.name || selectedModerationItem.name}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Canal de Stories</span>
                      </div>
                    </div>

                    {/* Mídia do Story Item (ou lista se houver) */}
                    <span className="label" style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                      Mídia da Publicação
                    </span>
                    {selectedModerationItem.media_url ? (
                      <div
                        style={{
                          border: '1px solid var(--border-light)',
                          borderRadius: 'var(--radius-sm)',
                          overflow: 'hidden',
                          backgroundColor: '#000',
                          aspectRatio: '9/16',
                          maxHeight: '300px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        onClick={() => setPreviewMedia({ url: selectedModerationItem.media_url, type: selectedModerationItem.media_type || 'image' })}
                      >
                        {selectedModerationItem.media_type === 'video' ? (
                          <video src={selectedModerationItem.media_url} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                          <img src={selectedModerationItem.media_url} alt="Story Media" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        )}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Sem mídia anexada.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Details Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="modal-field">
                    <span className="label" style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Tipo</span>
                    <span className="value" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>{selectedModerationType === 'banner' ? 'Banner Carrossel' : 'Story Item'}</span>
                  </div>
                  <div className="modal-field">
                    <span className="label" style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Nome/Título</span>
                    <span className="value" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>{selectedModerationType === 'banner' ? selectedModerationItem.title || 'Sem título' : (selectedModerationItem.story_channels?.name || selectedModerationItem.name)}</span>
                  </div>
                </div>

                {selectedModerationType === 'banner' && selectedModerationItem.subtitle && (
                  <div className="modal-field">
                    <span className="label" style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Subtítulo</span>
                    <span className="value" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>{selectedModerationItem.subtitle}</span>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="modal-field">
                    <span className="label" style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Solicitante</span>
                    <span className="value" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>{selectedModerationItem.story_channels?.users?.name || selectedModerationItem.users?.name || 'Não informado'}</span>
                  </div>
                  <div className="modal-field">
                    <span className="label" style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>E-mail do Solicitante</span>
                    <span className="value" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>{selectedModerationItem.story_channels?.users?.email || selectedModerationItem.users?.email || 'Não informado'}</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="modal-field">
                    <span className="label" style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Abrangência</span>
                    <span className="value" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>
                      {(() => {
                        const isBanner = selectedModerationType === 'banner';
                        const itemScope = isBanner ? selectedModerationItem.scope : selectedModerationItem.story_channels?.scope;
                        const itemCountry = isBanner ? selectedModerationItem.country : selectedModerationItem.story_channels?.country;
                        const itemState = isBanner ? selectedModerationItem.state : selectedModerationItem.story_channels?.state;
                        const itemCity = isBanner ? selectedModerationItem.city : selectedModerationItem.story_channels?.city;

                        return itemScope === 'global' ? 'Global' :
                          itemScope === 'national' ? `País: ${itemCountry || 'Brasil'}` :
                            itemScope === 'state' ? `Estado: ${itemState || ''}` :
                              `Cidade: ${itemCity || ''}${itemState ? ` / ${itemState}` : ''}`;
                      })()}
                    </span>
                  </div>
                  <div className="modal-field">
                    <span className="label" style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Duração</span>
                    <span className="value" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>
                      {(() => {
                        const { start, end } = getAdDates(selectedModerationItem, selectedModerationType);
                        const days = calculateDaysDifference(start, end);
                        return `${days} ${days === 1 ? 'Dia' : 'Dias'}`;
                      })()}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="modal-field">
                    <span className="label" style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Vigência</span>
                    <span className="value" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-main)' }}>
                      {(() => {
                        const { start, end } = getAdDates(selectedModerationItem, selectedModerationType);
                        return `${start ? new Date(start).toLocaleDateString('pt-BR') : '-'} até ${end ? new Date(end).toLocaleDateString('pt-BR') : '-'}`;
                      })()}
                    </span>
                  </div>
                  <div className="modal-field">
                    <span className="label" style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Preço Total Calculado</span>
                    <span className="value" style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '16px' }}>
                      {(() => {
                        if (selectedModerationItem.total_price) {
                          return `R$ ${Number(selectedModerationItem.total_price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        }
                        const { start, end } = getAdDates(selectedModerationItem, selectedModerationType);
                        const days = calculateDaysDifference(start, end);
                        const isBanner = selectedModerationType === 'banner';
                        const itemScope = isBanner ? selectedModerationItem.scope : selectedModerationItem.story_channels?.scope;
                        const pricePerDay = getScopePrice(selectedModerationType, itemScope);
                        const totalPrice = days * pricePerDay;
                        return `R$ ${totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                      })()}
                    </span>
                  </div>
                </div>

                {selectedModerationType === 'banner' && selectedModerationItem.link_url && (
                  <div className="modal-field">
                    <span className="label" style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Link de Destino</span>
                    <span className="value" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>
                      <a href={selectedModerationItem.link_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <LinkIcon size={14} /> {selectedModerationItem.link_label || 'Acessar Link'}
                      </a>
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
              {selectedModerationItem.status === 'rejected' && (
                <div style={{ marginRight: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                  <span style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '14px' }}>Solicitação Recusada ⚠️</span>
                  {selectedModerationItem.rejection_reason && (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Motivo: &quot;{selectedModerationItem.rejection_reason}&quot;</span>
                  )}
                </div>
              )}
              {selectedModerationItem.status !== 'pending' && selectedModerationItem.status !== 'rejected' && (
                <div style={{ marginRight: 'auto', textAlign: 'left' }}>
                  <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '14px' }}>
                    Solicitação Aprovada ✅ ({
                      selectedModerationItem.status === 'awaiting_payment' ? 'Aguardando pagamento' :
                        selectedModerationItem.status === 'scheduled' ? 'Agendado' :
                          selectedModerationItem.status === 'active' ? 'Ativo' :
                            selectedModerationItem.status === 'expired' ? 'Expirado' :
                              selectedModerationItem.status
                    })
                  </span>
                </div>
              )}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCloseModerationModal}
              >
                Fechar
              </button>
              {selectedModerationItem.status === 'pending' && (
                <>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                      setRejectionOption('low_quality');
                      setRejectionText('');
                      setRejectionReasonModalOpen(true);
                    }}
                  >
                    Recusar Solicitação
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ backgroundColor: 'var(--success)', color: '#fff' }}
                    onClick={() => {
                      const { start, end } = getAdDates(selectedModerationItem, selectedModerationType);
                      const days = calculateDaysDifference(start, end);
                      const isBanner = selectedModerationType === 'banner';
                      const itemScope = isBanner ? selectedModerationItem.scope : selectedModerationItem.story_channels?.scope;
                      const pricePerDay = getScopePrice(selectedModerationType, itemScope);
                      const calculatedTotal = days * pricePerDay;
                      const finalTotalPrice = Number(selectedModerationItem.total_price) || calculatedTotal;
                      const targetUserId = selectedModerationItem.story_channels?.user_id || selectedModerationItem.user_id;
                      const adName = selectedModerationType === 'banner' ? selectedModerationItem.title || 'Sem título' : (selectedModerationItem.story_channels?.name || selectedModerationItem.name || 'Story');

                      setConfirmModal({
                        isOpen: true,
                        title: 'Aceitar Solicitação',
                        message: 'Deseja realmente aceitar esta solicitação de publicação?',
                        onConfirm: async () => {
                          await moderationHook.acceptRequest({
                            type: selectedModerationType,
                            id: selectedModerationItem.id,
                            userId: targetUserId,
                            adName: adName,
                            totalPrice: finalTotalPrice
                          });
                          handleCloseModerationModal();
                        }
                      });
                    }}
                    disabled={moderationHook.actionLoading === selectedModerationItem.id}
                  >
                    {moderationHook.actionLoading === selectedModerationItem.id ? 'Aprovando...' : 'Aceitar Solicitação'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: REJECTION REASON ================= */}
      {rejectionReasonModalOpen && selectedModerationItem && (
        <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={() => setRejectionReasonModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setRejectionReasonModalOpen(false)}>
              <X size={20} />
            </button>
            <h3 className="modal-title">Justificativa de Recusa</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '16px 0' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Selecione ou escreva o motivo para recusar esta publicação. O usuário solicitante receberá essa justificativa por notificação.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                  <input
                    type="radio"
                    name="rejection_reason_opt"
                    checked={rejectionOption === 'low_quality'}
                    onChange={() => setRejectionOption('low_quality')}
                  />
                  Imagem de baixa qualidade ou inapropriada
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                  <input
                    type="radio"
                    name="rejection_reason_opt"
                    checked={rejectionOption === 'errors_or_offensive'}
                    onChange={() => setRejectionOption('errors_or_offensive')}
                  />
                  Texto com erros ou ofensivo
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                  <input
                    type="radio"
                    name="rejection_reason_opt"
                    checked={rejectionOption === 'invalid_link'}
                    onChange={() => setRejectionOption('invalid_link')}
                  />
                  Link inválido ou suspeito
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                  <input
                    type="radio"
                    name="rejection_reason_opt"
                    checked={rejectionOption === 'other'}
                    onChange={() => setRejectionOption('other')}
                  />
                  Outro (especificar)
                </label>
              </div>

              {rejectionOption === 'other' && (
                <div className="form-group" style={{ marginTop: '8px' }}>
                  <label>Especifique o motivo (obrigatório)</label>
                  <textarea
                    className="textarea-field"
                    style={{ minHeight: '80px', width: '100%', boxSizing: 'border-box' }}
                    value={rejectionText}
                    onChange={(e) => setRejectionText(e.target.value)}
                    placeholder="Escreva a justificativa para o usuário..."
                    required
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setRejectionReasonModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  let reason = '';
                  if (rejectionOption === 'low_quality') reason = 'Imagem de baixa qualidade ou inapropriada';
                  else if (rejectionOption === 'errors_or_offensive') reason = 'Texto com erros ou ofensivo';
                  else if (rejectionOption === 'invalid_link') reason = 'Link inválido ou suspeito';
                  else {
                    if (!rejectionText.trim()) {
                      warning('Por favor, especifique o motivo da recusa.');
                      return;
                    }
                    reason = rejectionText.trim();
                  }

                  const targetUserId = selectedModerationItem.story_channels?.user_id || selectedModerationItem.user_id;
                  const adName = selectedModerationType === 'banner' ? selectedModerationItem.title || 'Sem título' : (selectedModerationItem.story_channels?.name || selectedModerationItem.name || 'Story');

                  setConfirmModal({
                    isOpen: true,
                    title: 'Recusar Solicitação',
                    message: 'Deseja realmente recusar esta solicitação de publicação?',
                    onConfirm: async () => {
                      await moderationHook.rejectRequest({
                        type: selectedModerationType,
                        id: selectedModerationItem.id,
                        userId: targetUserId,
                        adName: adName,
                        reason: reason
                      });
                      setRejectionReasonModalOpen(false);
                      handleCloseModerationModal();
                    }
                  });
                }}
                disabled={moderationHook.actionLoading === selectedModerationItem.id}
              >
                {moderationHook.actionLoading === selectedModerationItem.id ? 'Recusando...' : 'Confirmar Recusa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE ADMIN USER ================= */}
      {isAdminModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={() => setIsAdminModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsAdminModalOpen(false)}>
              <X size={20} />
            </button>
            <h3 className="modal-title">Novo Administrador</h3>

            <form onSubmit={handleCreateAdminSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div className="form-group">
                <label htmlFor="admin_username">Usuário</label>
                <input
                  id="admin_username"
                  type="text"
                  className="input-field"
                  placeholder="Nome de usuário"
                  value={newAdminUsername}
                  onChange={(e) => setNewAdminUsername(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="admin_password">Senha</label>
                <input
                  id="admin_password"
                  type="password"
                  className="input-field"
                  placeholder="Senha"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="admin_confirm_password">Confirmar Senha</label>
                <input
                  id="admin_confirm_password"
                  type="password"
                  className="input-field"
                  placeholder="Confirme a senha"
                  value={newAdminConfirmPassword}
                  onChange={(e) => setNewAdminConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAdminModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={adminUsersHook.loading}
                >
                  {adminUsersHook.loading ? 'Salvando...' : 'Criar Administrador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT ADMIN PASSWORD ================= */}
      {isAdminPasswordModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={() => setIsAdminPasswordModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsAdminPasswordModalOpen(false)}>
              <X size={20} />
            </button>
            <h3 className="modal-title">Alterar Senha do Administrador</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Alterando a senha do usuário: <strong>{selectedAdminUsername}</strong>
            </p>

            <form onSubmit={handleChangePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label htmlFor="edit_admin_password">Nova Senha</label>
                <input
                  id="edit_admin_password"
                  type="password"
                  className="input-field"
                  placeholder="Nova senha"
                  value={editAdminPassword}
                  onChange={(e) => setEditAdminPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit_admin_confirm_password">Confirmar Nova Senha</label>
                <input
                  id="edit_admin_confirm_password"
                  type="password"
                  className="input-field"
                  placeholder="Confirme a nova senha"
                  value={editAdminConfirmPassword}
                  onChange={(e) => setEditAdminConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAdminPasswordModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={adminUsersHook.loading}
                >
                  {adminUsersHook.loading ? 'Salvando...' : 'Alterar Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
