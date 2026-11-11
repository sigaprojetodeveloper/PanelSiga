import React, { useState, useEffect } from 'react';
import { X, Award, RefreshCw, Check } from 'lucide-react';
import type { VerificationLevelEnum } from '../../../types/database.types';
import { VerificationBadgeAdmin } from '../../users/VerificationBadgeAdmin';

interface ChangeVerificationLevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: VerificationLevelEnum | string | null | undefined;
  userName?: string | null;
  userEmail?: string | null;
  onSave: (newLevel: VerificationLevelEnum) => Promise<void>;
}

interface LevelOption {
  value: VerificationLevelEnum;
  label: string;
  description: string;
}

const LEVEL_OPTIONS: LevelOption[] = [
  {
    value: 'none',
    label: 'Nenhum',
    description: 'Sem selo de verificação atribuído ao perfil.',
  },
  {
    value: 'bronze',
    label: 'Bronze',
    description: 'Nível Bronze — Confiabilidade básica verificada.',
  },
  {
    value: 'silver',
    label: 'Prata',
    description: 'Nível Prata — Confiabilidade e histórico intermediário.',
  },
  {
    value: 'gold',
    label: 'Ouro',
    description: 'Nível Ouro — Alta confiabilidade, destaque no catálogo.',
  },
  {
    value: 'platinum',
    label: 'Platina',
    description: 'Nível Platina — Verificação corporativa de alto padrão.',
  },
  {
    value: 'diamond',
    label: 'Diamante',
    description: 'Nível Diamante — Excelência máxima e verificação total.',
  },
];

export const ChangeVerificationLevelModal: React.FC<ChangeVerificationLevelModalProps> = ({
  isOpen,
  onClose,
  currentLevel = 'none',
  userName,
  userEmail,
  onSave,
}) => {
  const normalizedInitialLevel = (currentLevel as VerificationLevelEnum) || 'none';
  const [selectedLevel, setSelectedLevel] = useState<VerificationLevelEnum>(normalizedInitialLevel);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sincroniza a seleção com o selo atual do usuário sempre que o modal for aberto
  useEffect(() => {
    if (isOpen) {
      setSelectedLevel((currentLevel as VerificationLevelEnum) || 'none');
      setErrorMsg(null);
      setIsSaving(false);
    }
  }, [isOpen, currentLevel]);

  if (!isOpen) return null;

  const handleCancel = () => {
    if (isSaving) return;
    // Descarta qualquer seleção feita e restaura o nível atual do usuário
    setSelectedLevel(normalizedInitialLevel);
    setErrorMsg(null);
    onClose();
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setErrorMsg(null);
      await onSave(selectedLevel);
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar nível do selo:', err);
      setErrorMsg(err.message || 'Falha ao persistir nível de verificação no banco de dados.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={handleCancel}>
      <div
        className="modal-content"
        style={{ maxWidth: '540px', width: '95vw', padding: '28px' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-level-modal-title"
      >
        <button
          type="button"
          className="modal-close"
          onClick={handleCancel}
          disabled={isSaving}
          aria-label="Fechar modal"
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Award size={20} />
          </div>
          <div>
            <h3 id="change-level-modal-title" style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Alterar Nível do Selo Siga
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              Selecione o novo nível de verificação para o usuário.
            </p>
          </div>
        </div>

        {/* Resumo do Usuário */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            marginBottom: '20px',
          }}
        >
          <div>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>
              Usuário
            </span>
            <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>
              {userName || 'Não informado'}
            </strong>
            {userEmail && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>
                {userEmail}
              </span>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Selo Atual
            </span>
            <VerificationBadgeAdmin level={currentLevel || 'none'} />
          </div>
        </div>

        {/* Radio Group com os Níveis Disponíveis */}
        <div
          role="radiogroup"
          aria-label="Opções de Nível do Selo"
          style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}
        >
          {LEVEL_OPTIONS.map((opt) => {
            const isSelected = selectedLevel === opt.value;
            const isCurrent = normalizedInitialLevel === opt.value;

            return (
              <label
                key={opt.value}
                htmlFor={`level-option-${opt.value}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                  backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-card)',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  transition: 'var(--transition-smooth)',
                  boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="radio"
                    id={`level-option-${opt.value}`}
                    name="verification-level-radio-group"
                    value={opt.value}
                    checked={isSelected}
                    onChange={() => setSelectedLevel(opt.value)}
                    disabled={isSaving}
                    style={{
                      accentColor: 'var(--primary)',
                      width: '18px',
                      height: '18px',
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                    }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                        {opt.label}
                      </strong>
                      {isCurrent && (
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--secondary)',
                            color: 'var(--text-muted)',
                            fontWeight: 600,
                          }}
                        >
                          Atual
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                      {opt.description}
                    </span>
                  </div>
                </div>

                <div style={{ flexShrink: 0, marginLeft: '12px' }}>
                  <VerificationBadgeAdmin level={opt.value} />
                </div>
              </label>
            );
          })}
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger)',
              fontSize: '12px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '16px',
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Rodapé de Ações */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-light)',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isSaving}
            style={{ minWidth: '100px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            {isSaving ? (
              <>
                <RefreshCw size={14} className="spinning" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Check size={14} />
                <span>Salvar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

