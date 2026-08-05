import React from 'react';
import { AlertOctagon } from 'lucide-react';
import type { VerificationLevelEnum } from '../../types/database.types';

interface Props {
  level: VerificationLevelEnum | string | null | undefined;
  isSuspended?: boolean | null;
  showText?: boolean;
}

export const LEVEL_CONFIG: Record<string, { label: string; emoji: string; color: string; bg: string; border: string; glow: string }> = {
  none: {
    label: 'Sem Selo',
    emoji: '⚪',
    color: '#718096',
    bg: 'linear-gradient(135deg, #edf2f7 0%, #e2e8f0 100%)',
    border: '#cbd5e0',
    glow: 'rgba(113, 128, 150, 0.15)'
  },
  bronze: {
    label: 'Bronze',
    emoji: '🥉',
    color: '#CD7F32',
    bg: 'linear-gradient(135deg, #FFFAF0 0%, #FEEBC8 100%)',
    border: '#CD7F32',
    glow: 'rgba(205, 127, 50, 0.35)'
  },
  silver: {
    label: 'Prata',
    emoji: '🥈',
    color: '#A0AEC0',
    bg: 'linear-gradient(135deg, #F7FAFC 0%, #EDF2F7 100%)',
    border: '#A0AEC0',
    glow: 'rgba(160, 174, 192, 0.35)'
  },
  gold: {
    label: 'Ouro',
    emoji: '🥇',
    color: '#D69E2E',
    bg: 'linear-gradient(135deg, #FEFCBF 0%, #F6E05E 100%)',
    border: '#D69E2E',
    glow: 'rgba(214, 158, 46, 0.4)'
  },
  platinum: {
    label: 'Platina',
    emoji: '🌌',
    color: '#319795',
    bg: 'linear-gradient(135deg, #E6FFFA 0%, #B2F5EA 100%)',
    border: '#319795',
    glow: 'rgba(49, 151, 149, 0.4)'
  },
  diamond: {
    label: 'Diamante',
    emoji: '💎',
    color: '#3182CE',
    bg: 'linear-gradient(135deg, #EBF8FF 0%, #BEE3F8 100%)',
    border: '#3182CE',
    glow: 'rgba(49, 130, 206, 0.45)'
  },
};

export const VerificationBadgeAdmin: React.FC<Props> = ({ level = 'none', isSuspended, showText = true }) => {
  if (isSuspended) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '9999px',
          fontSize: '12px',
          fontWeight: 700,
          color: '#c53030',
          background: 'linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%)',
          border: '1px solid #feb2b2',
          boxShadow: '0 2px 5px rgba(229, 62, 62, 0.2)'
        }}
      >
        <AlertOctagon size={14} style={{ color: '#e53e3e' }} />
        {showText && <span>🚫 Suspenso</span>}
      </span>
    );
  }

  const normalizedLevel = (level && LEVEL_CONFIG[level]) ? level : 'none';
  const config = LEVEL_CONFIG[normalizedLevel];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 11px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: 700,
        color: config.color,
        background: config.bg,
        border: `1px solid ${config.border}`,
        boxShadow: `0 2px 6px ${config.glow}`,
        whiteSpace: 'nowrap',
        letterSpacing: '0.2px'
      }}
    >
      <span style={{ fontSize: '13px', lineHeight: 1 }}>{config.emoji}</span>
      {showText && <span>{config.label}</span>}
    </span>
  );
};
