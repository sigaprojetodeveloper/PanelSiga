/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { Search } from 'lucide-react';
import { VerificationBadgeAdmin, LEVEL_CONFIG } from '../../users/VerificationBadgeAdmin';

interface UsersTabProps {
  userHook: any;
  onSelectUser: (user: any) => Promise<void>;
}

interface UserTableRowProps {
  u: any;
  onSelectUser: (user: any) => Promise<void>;
}

function getEffectiveLevel(level: string, isSuspended: boolean): string {
  if (isSuspended) return 'none';
  if (!level || level === 'none') return 'none';
  if (LEVEL_CONFIG[level]) return level;
  return 'none';
}

function getAvatarStyles(effectiveLevel: string) {
  if (effectiveLevel === 'none') {
    return {
      ringColor: 'var(--border-light)',
      ringGlow: 'none',
      color: 'var(--primary)',
      levelCfg: null
    };
  }
  const levelCfg = LEVEL_CONFIG[effectiveLevel];
  return {
    ringColor: levelCfg.border,
    ringGlow: levelCfg.glow,
    color: levelCfg.color,
    levelCfg
  };
}

function getStatusBadgeClass(status?: string): string {
  if (status === 'active') return 'badge-success';
  if (status === 'blocked') return 'badge-danger';
  return 'badge-warning';
}

const UserAvatarCell: React.FC<{
  name?: string;
  email?: string;
  avatarUrl?: string;
  effectiveLevel: string;
}> = ({ name, email, avatarUrl, effectiveLevel }) => {
  const initial = (name || email || '?')[0].toUpperCase();
  const { ringColor, ringGlow, color, levelCfg } = getAvatarStyles(effectiveLevel);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name || 'Avatar'}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: `2.5px solid ${ringColor}`,
            boxShadow: `0 0 0 2px ${ringGlow}, 0 2px 4px rgba(0,0,0,0.08)`,
            flexShrink: 0
          }}
        />
      ) : (
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: color,
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: 700,
            textTransform: 'uppercase',
            border: `2.5px solid ${ringColor}`,
            boxShadow: `0 0 0 2px ${ringGlow}, 0 2px 4px rgba(0,0,0,0.08)`,
            flexShrink: 0
          }}
        >
          {initial}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span>{name || 'Sem nome'}</span>
        {effectiveLevel !== 'none' && levelCfg && (
          <span
            title={`Siga Check ${levelCfg.label}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M22.5 12C22.5 13.5 21.2 14.7 21 16.2C20.8 17.7 21.7 19.3 20.7 20.3C19.7 21.3 18.1 20.4 16.6 20.6C15.1 20.8 13.9 22.1 12.4 22.1C10.9 22.1 9.7 20.8 8.2 20.6C6.7 20.4 5.1 21.3 4.1 20.3C3.1 19.3 4 17.7 3.8 16.2C3.6 14.7 2.3 13.5 2.3 12C2.3 10.5 3.6 9.3 3.8 7.8C4 6.3 3.1 4.7 4.1 3.7C5.1 2.7 6.7 3.6 8.2 3.4C9.7 3.2 10.9 1.9 12.4 1.9C13.9 1.9 15.1 3.2 16.6 3.4C18.1 3.6 19.7 2.7 20.7 3.7C21.7 4.7 20.8 6.3 21 7.8C21.2 9.3 22.5 10.5 22.5 12Z"
                fill={levelCfg.border}
              />
              <path
                d="M9 12L11 14L15.5 9.5"
                stroke="#FFFFFF"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        )}
      </div>
    </div>
  );
};

const UserTableRow: React.FC<UserTableRowProps> = ({ u, onSelectUser }) => {
  const level = u.verification_level || 'none';
  const isSuspended = Boolean(u.is_suspended);
  const profile = Array.isArray(u.user_profiles) ? u.user_profiles[0] : u.user_profiles;
  const avatarUrl = profile?.avatar_url || u.avatar_url;
  const effectiveLevel = getEffectiveLevel(level, isSuspended);
  const statusBadgeClass = getStatusBadgeClass(u.status);

  return (
    <tr key={u.id}>
      <td onClick={() => onSelectUser(u)} style={{ cursor: 'pointer', fontWeight: 600 }}>
        <UserAvatarCell
          name={u.name}
          email={u.email}
          avatarUrl={avatarUrl}
          effectiveLevel={effectiveLevel}
        />
      </td>
      <td onClick={() => onSelectUser(u)} style={{ cursor: 'pointer' }}>
        {u.email || 'Sem email'}
      </td>
      <td onClick={() => onSelectUser(u)} style={{ cursor: 'pointer' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {u.role_flags?.map((r: string) => (
            <span key={r} className="badge badge-info" style={{ fontSize: '9px' }}>
              {r}
            </span>
          ))}
        </div>
      </td>
      <td onClick={() => onSelectUser(u)} style={{ cursor: 'pointer' }}>
        <span className={`badge ${statusBadgeClass}`}>
          {u.status}
        </span>
      </td>

      {/* Selo Visual */}
      <td onClick={() => onSelectUser(u)} style={{ cursor: 'pointer' }}>
        <VerificationBadgeAdmin level={level} isSuspended={isSuspended} />
      </td>
    </tr>
  );
};

export const UsersTab: React.FC<UsersTabProps> = ({ userHook, onSelectUser }) => {
  return (
    <div>
      {/* Search & Filter Bar */}
      <div className="filters-bar">
        <div className="filters-group" style={{ flexWrap: 'wrap', gap: '12px' }}>
          {/* Search */}
          <div className="filter-control">
            <label>Buscar</label>
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
          </div>

          {/* Status */}
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

          {/* Papel */}
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
                <th>Selo</th>
              </tr>
            </thead>
            <tbody>
              {userHook.loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    Carregando usuários...
                  </td>
                </tr>
              ) : userHook.users.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                userHook.users.map((u: any) => (
                  <UserTableRow key={u.id} u={u} onSelectUser={onSelectUser} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination">
          <div className="pagination-info">Total de {userHook.totalCount} usuários</div>
          <div className="pagination-actions">
            <button
              className="btn btn-secondary btn-sm"
              disabled={userHook.page === 1}
              onClick={() => userHook.setPage((p: number) => p - 1)}
            >
              Anterior
            </button>
            <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center' }}>
              Página {userHook.page}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={userHook.users.length < 20}
              onClick={() => userHook.setPage((p: number) => p + 1)}
            >
              Próxima
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
