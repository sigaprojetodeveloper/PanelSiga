import React, { useState } from 'react';
import type { VerificationLevelEnum } from '../../types/database.types';

interface Props {
  currentLevel: VerificationLevelEnum | string | null | undefined;
  onChange: (newLevel: VerificationLevelEnum) => Promise<void> | void;
  disabled?: boolean;
}

const OPTIONS: { value: VerificationLevelEnum; label: string; emoji: string; color: string }[] = [
  { value: 'none', label: 'Sem Selo', emoji: '⚪', color: '#718096' },
  { value: 'bronze', label: 'Bronze', emoji: '🥉', color: '#9C4221' },
  { value: 'silver', label: 'Prata', emoji: '🥈', color: '#4A5568' },
  { value: 'gold', label: 'Ouro', emoji: '🥇', color: '#975A16' },
  { value: 'platinum', label: 'Platina', emoji: '🌌', color: '#234E52' },
  { value: 'diamond', label: 'Diamante', emoji: '💎', color: '#1A365D' },
];

export const VerificationLevelSelect: React.FC<Props> = ({ currentLevel = 'none', onChange, disabled }) => {
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<VerificationLevelEnum>((currentLevel as VerificationLevelEnum) || 'none');

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as VerificationLevelEnum;
    setSelected(val);
    try {
      setLoading(true);
      await onChange(val);
    } catch (err) {
      console.error('Erro ao atualizar nível:', err);
      setSelected((currentLevel as VerificationLevelEnum) || 'none');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '200px' }}>
      <select
        value={selected}
        onChange={handleChange}
        disabled={disabled || loading}
        style={{
          width: '100%',
          padding: '6px 12px',
          fontSize: '13px',
          fontWeight: 600,
          borderRadius: '8px',
          border: '1px solid var(--border-light)',
          backgroundColor: 'var(--bg-card)',
          color: 'var(--text-main)',
          cursor: 'pointer',
          outline: 'none',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value} style={{ color: opt.color, fontWeight: 600 }}>
            {opt.emoji} {opt.label}
          </option>
        ))}
      </select>
      {loading && (
        <span style={{ position: 'absolute', right: '10px', top: '7px', fontSize: '11px', animation: 'spin 1s linear infinite' }}>
          ⌛
        </span>
      )}
    </div>
  );
};
