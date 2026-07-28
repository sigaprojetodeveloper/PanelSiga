import React from 'react';
import { Search } from 'lucide-react';

interface UsersTabProps {
  userHook: any;
  onSelectUser: (user: any) => Promise<void>;
}

export const UsersTab: React.FC<UsersTabProps> = ({ userHook, onSelectUser }) => {
  return (
    <div>
      {/* Search & Filter Bar */}
      <div className="filters-bar">
        <div className="filters-group">
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
                userHook.users.map((u: any) => (
                  <tr
                    key={u.id}
                    onClick={() => onSelectUser(u)}
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
