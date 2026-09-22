/* eslint-disable complexity, @next/next/no-img-element */
import React from 'react';
import {
  X,
  AlertTriangle,
  ExternalLink,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Layers,
  FileText
} from 'lucide-react';
import type { RejectedItem } from '../../../hooks/useModerationRejections';
import { categorizeRejectionReason } from '../../../hooks/useModerationRejections';

interface RejectionDetailModalProps {
  isOpen: boolean;
  item: RejectedItem | null;
  onClose: () => void;
}

export const RejectionDetailModal: React.FC<RejectionDetailModalProps> = ({
  isOpen,
  item,
  onClose
}) => {
  if (!isOpen || !item) return null;

  const isBanner = item._type === 'banner';
  const name = isBanner
    ? item.title || 'Sem título'
    : item.story_channels?.name || 'Story';
  const mediaUrl = isBanner ? item.image_url : item.media_url || item.story_channels?.avatar_url;
  const isVideo = !isBanner && item.media_type === 'video';

  const requesterName = isBanner
    ? item.users?.name || 'Não informado'
    : item.story_channels?.users?.name || item.users?.name || 'Não informado';
  const requesterEmail = isBanner
    ? item.users?.email || ''
    : item.story_channels?.users?.email || item.users?.email || '';
  const requesterPhone = isBanner
    ? item.users?.phone || ''
    : item.story_channels?.users?.phone || item.users?.phone || '';

  const itemScope = isBanner ? item.scope : item.story_channels?.scope;
  const itemCountry = isBanner ? item.country : item.story_channels?.country;
  const itemState = isBanner ? item.state : item.story_channels?.state;
  const itemCity = isBanner ? item.city : item.story_channels?.city;

  const category = categorizeRejectionReason(item.rejection_reason);

  const formatScope = () => {
    if (itemScope === 'global') return 'Global';
    if (itemScope === 'national') return `Nacional (${itemCountry || 'Brasil'})`;
    if (itemScope === 'state') return `Estadual (${itemState || 'Estado'})`;
    return `Municipal (${itemCity || 'Cidade'}${itemState ? ` / ${itemState}` : ''})`;
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={onClose}>
      <div
        className="modal-content"
        style={{
          maxWidth: '850px',
          width: '95vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className={`badge ${isBanner ? 'badge-primary' : 'badge-info'}`} style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 700 }}>
                {isBanner ? 'Banner' : 'Story'}
              </span>
              <span className="badge badge-danger" style={{ fontSize: '11px', fontWeight: 700 }}>
                Recusado
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-main)' }}>
              {name}
            </h2>
          </div>
          <button className="modal-close" onClick={onClose} title="Fechar">
            <X size={20} />
          </button>
        </div>

        {/* Motivo da Recusa - Destaque Principal */}
        <div
          style={{
            backgroundColor: 'var(--danger-bg)',
            border: '1.5px solid var(--danger)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
            <AlertTriangle size={20} />
            <strong style={{ fontSize: '15px' }}>Justificativa da Recusa</strong>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: 'rgba(211, 47, 47, 0.12)',
                color: 'var(--danger)',
                padding: '3px 8px',
                borderRadius: '6px'
              }}
            >
              {category}
            </span>
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-main)', lineHeight: 1.6, paddingLeft: '28px' }}>
            {item.rejection_reason ? (
              <span style={{ fontWeight: 500 }}>&ldquo;{item.rejection_reason}&rdquo;</span>
            ) : (
              <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
                Nenhum motivo detalhado foi gravado para esta recusa.
              </span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', paddingLeft: '28px', marginTop: '4px' }}>
            Data da Recusa: {formatDate(item.rejected_at || item.created_at)}
          </div>
        </div>

        {/* Grid de Informações: Mídia e Conteúdo */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Mídia */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
              Mídia Submetida
            </label>
            <div
              style={{
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                backgroundColor: '#111',
                border: '1px solid var(--border-light)',
                aspectRatio: isBanner ? '16/9' : '9/16',
                maxHeight: '380px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              {mediaUrl ? (
                isVideo ? (
                  <video
                    src={mediaUrl}
                    controls
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt={name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )
              ) : (
                <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
                  <Layers size={36} style={{ marginBottom: '8px' }} />
                  <div>Sem mídia associada</div>
                </div>
              )}
            </div>

            {mediaUrl && (
              <a
                href={mediaUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <ExternalLink size={14} /> Abrir mídia original
              </a>
            )}
          </div>

          {/* Dados do Anúncio */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>
                Textos do Anúncio
              </label>
              <div
                style={{
                  backgroundColor: 'var(--bg-app)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Título</span>
                  <strong style={{ fontSize: '14px' }}>{item.title || item.story_channels?.name || 'Não informado'}</strong>
                </div>

                {isBanner && item.subtitle && (
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Subtítulo / Descrição</span>
                    <span style={{ fontSize: '13px' }}>{item.subtitle}</span>
                  </div>
                )}

                {item.link_label && (
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Botão de Conversão (CTA)</span>
                    <span className="badge badge-secondary">{item.link_label}</span>
                  </div>
                )}

                {item.link_url && (
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Link de Destino</span>
                    <a
                      href={item.link_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '13px', color: 'var(--primary)', wordBreak: 'break-all', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      {item.link_url} <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Solicitante */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>
                Dados do Solicitante
              </label>
              <div
                style={{
                  backgroundColor: 'var(--bg-app)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={15} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{requesterName}</span>
                </div>
                {requesterEmail && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={15} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{requesterEmail}</span>
                  </div>
                )}
                {requesterPhone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone size={15} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{requesterPhone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Abrangência e Datas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div
                style={{
                  backgroundColor: 'var(--bg-app)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', color: 'var(--text-muted)' }}>
                  <MapPin size={14} />
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Abrangência</span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{formatScope()}</span>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--bg-app)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', color: 'var(--text-muted)' }}>
                  <Calendar size={14} />
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Criação</span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{formatDate(item.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
