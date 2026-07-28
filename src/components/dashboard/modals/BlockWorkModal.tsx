import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, AlertTriangle } from 'lucide-react';
import type { Work } from '../../../types/works.types';

interface BlockWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  work: Work | null;
  onConfirmBlock: (reason: string) => Promise<void>;
  isSubmitting?: boolean;
  externalError?: string | null;
}

export const BlockWorkModal: React.FC<BlockWorkModalProps> = ({
  isOpen,
  onClose,
  work,
  onConfirmBlock,
  isSubmitting = false,
  externalError = null
}) => {
  const [reason, setReason] = useState<string>('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setLocalError(null);
    }
  }, [isOpen]);

  if (!isOpen || !work) return null;

  const charCount = reason.trim().length;
  const isReasonValid = charCount >= 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReasonValid) {
      setLocalError('O motivo do bloqueio deve ter no mínimo 10 caracteres.');
      return;
    }

    setLocalError(null);
    await onConfirmBlock(reason.trim());
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: '540px' }}>
        <button className="modal-close" onClick={onClose} disabled={isSubmitting}>
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <h3 className="modal-title" style={{ margin: 0 }}>Bloquear Obra</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Esta ação alterará o status para BLOQUEADA e notificará o criador.
            </span>
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-app)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-light)',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
            Obra: {work.title}
          </div>
          {work.creator?.name && (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Criador: {work.creator.name} ({work.creator.email || 'Sem e-mail'})
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Motivo do Bloqueio <span style={{ color: 'var(--danger)' }}>*</span></span>
              <span style={{
                fontSize: '11px',
                color: isReasonValid ? 'var(--success)' : charCount > 0 ? 'var(--warning)' : 'var(--text-muted)'
              }}>
                {charCount} / 10 caracteres mín.
              </span>
            </label>
            <textarea
              className="textarea-field"
              rows={4}
              style={{
                width: '100%',
                marginTop: '6px',
                borderColor: (localError || externalError) ? 'var(--danger)' : undefined
              }}
              placeholder="Descreva detalhadamente a razão do bloqueio (ex: violação dos termos de uso, fotos inadequadas, dados falsos...)"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (localError && e.target.value.trim().length >= 10) {
                  setLocalError(null);
                }
              }}
              disabled={isSubmitting}
            />
          </div>

          {(localError || externalError) && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#fef2f2',
              color: '#991b1b',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              marginBottom: '16px',
              border: '1px solid #fecaca'
            }}>
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <span>{localError || externalError}</span>
            </div>
          )}

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            borderTop: '1px solid var(--border-light)',
            paddingTop: '16px'
          }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              disabled={isSubmitting || !isReasonValid}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {isSubmitting ? 'Bloqueando...' : 'Confirmar Bloqueio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
