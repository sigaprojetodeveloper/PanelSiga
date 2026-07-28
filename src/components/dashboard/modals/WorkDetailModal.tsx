import React, { useState } from 'react';
import {
  X,
  MapPin,
  Calendar,
  User,
  Mail,
  Phone,
  FileText,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldAlert,
  Image as ImageIcon,
  MessageSquare
} from 'lucide-react';
import type { Work } from '../../../types/works.types';

interface WorkDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  work: Work | null;
  onBlockWork: (work: Work) => void;
}

export const WorkDetailModal: React.FC<WorkDetailModalProps> = ({
  isOpen,
  onClose,
  work,
  onBlockWork
}) => {
  const [activeMedia, setActiveMedia] = useState<string | null>(null);

  if (!isOpen || !work) return null;

  const isBlocked = work.status === 'bloqueada';
  const mediaList = work.media_urls || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aberta':
        return <span className="badge badge-info" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>Aberta</span>;
      case 'em_andamento':
        return <span className="badge badge-warning">Em Andamento</span>;
      case 'concluida':
        return <span className="badge badge-success">Concluída</span>;
      case 'cancelled':
        return <span className="badge badge-secondary">Cancelada</span>;
      case 'bloqueada':
        return <span className="badge badge-danger">Bloqueada</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1050 }}>
      <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingRight: '32px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 className="modal-title" style={{ margin: 0 }}>{work.title}</h2>
              {getStatusBadge(work.status)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px', color: 'var(--text-muted)', fontSize: '13px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={14} />
                {work.address?.formatted_address || `${work.city} / ${work.state}`}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} />
                {new Date(work.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        {/* Alerta de Obra Bloqueada */}
        {isBlocked && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '14px 16px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '20px'
          }}>
            <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '13px' }}>Esta obra foi BLOQUEADA pela moderação</div>
              {work.rejection_reason && (
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  <strong>Motivo:</strong> {work.rejection_reason}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SEÇÃO 1: Informações Gerais & Mídia */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
            1. Informações Gerais & Mídia
          </h4>

          {work.description && (
            <div style={{ marginBottom: '14px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Descrição da Obra
              </span>
              <p style={{
                fontSize: '13px',
                padding: '12px',
                backgroundColor: 'var(--bg-app)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)',
                margin: 0,
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap'
              }}>
                {work.description}
              </p>
            </div>
          )}

          {/* Galeria de Fotos */}
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
              Galeria de Mídia ({mediaList.length})
            </span>
            {mediaList.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Nenhuma foto cadastrada nesta obra.
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px' }}>
                {mediaList.map((url, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveMedia(url)}
                    style={{
                      width: '90px',
                      height: '90px',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      border: '2px solid var(--border-light)',
                      cursor: 'pointer',
                      flexShrink: 0,
                      backgroundColor: '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Mídia ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SEÇÃO 2: Dados do Criador */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
            2. Dados do Criador da Obra
          </h4>

          {work.creator ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px',
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#e5e7eb',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--border-light)'
                }}>
                  {work.creator.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={work.creator.avatar_url} alt={work.creator.name || 'Criador'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={24} color="#6b7280" />
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{work.creator.name}</div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', flexWrap: 'wrap' }}>
                    {work.creator.email && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Mail size={12} /> {work.creator.email}
                      </span>
                    )}
                    {(work.creator.phone || work.creator.whatsapp_phone) && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={12} /> {work.creator.phone || work.creator.whatsapp_phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {work.creator.whatsapp_phone && (
                <a
                  href={`https://wa.me/${work.creator.whatsapp_phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                >
                  <MessageSquare size={13} /> Contatar via WhatsApp
                </a>
              )}
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Dados do criador não informados ou não encontrados.
            </div>
          )}
        </div>

        {/* SEÇÃO 3: Status & Gestão do Contrato */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
            3. Status & Gestão do Contrato
          </h4>

          {work.contract ? (
            <div style={{
              padding: '14px',
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} color="var(--primary-color)" />
                  <span style={{ fontWeight: 600, fontSize: '13px' }}>Contrato vinculado</span>
                </div>
                <span className={`badge ${work.contract.is_signed ? 'badge-success' : 'badge-warning'}`}>
                  {work.contract.is_signed ? '✅ Assinado' : '⏳ Pendente de Assinatura'}
                </span>
              </div>

              {/* Lista de Assinantes */}
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Assinantes do Contrato
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {work.contract.signers.map((signer) => (
                    <div
                      key={signer.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        padding: '6px 10px',
                        backgroundColor: '#fff',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-light)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {signer.signed_flag ? (
                          <CheckCircle2 size={14} color="#16a34a" />
                        ) : (
                          <Clock size={14} color="#ca8a04" />
                        )}
                        <span style={{ fontWeight: 500 }}>{signer.name}</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                          ({signer.role})
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {signer.signed_flag && signer.signed_at
                          ? `Assinado em ${new Date(signer.signed_at).toLocaleString('pt-BR')}`
                          : 'Aguardando assinatura'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* PDF Link */}
              {work.contract.pdf_url ? (
                <a
                  href={work.contract.pdf_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', marginTop: '6px' }}
                >
                  <ExternalLink size={14} /> Download / Visualizar PDF do Contrato
                </a>
              ) : (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '4px' }}>
                  Arquivo PDF do contrato pendente de geração.
                </div>
              )}
            </div>
          ) : (
            <div style={{
              padding: '14px',
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--radius-sm)',
              border: '1px dashed var(--border-light)',
              color: 'var(--text-muted)',
              fontSize: '13px'
            }}>
              Nenhum contrato ativo formalizado para esta obra no momento.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid var(--border-light)',
          paddingTop: '16px'
        }}>
          <div>
            {!isBlocked ? (
              <button
                type="button"
                className="btn btn-danger"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={() => onBlockWork(work)}
              >
                <ShieldAlert size={16} /> Bloquear Obra
              </button>
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--danger)', fontWeight: 600 }}>
                Obra bloqueada
              </span>
            )}
          </div>

          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>

      {/* Lightbox para mídia expandida se houver */}
      {activeMedia && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setActiveMedia(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <button
              onClick={() => setActiveMedia(null)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              <X size={28} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={activeMedia} alt="Mídia expandida" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '4px' }} />
          </div>
        </div>
      )}
    </div>
  );
};
