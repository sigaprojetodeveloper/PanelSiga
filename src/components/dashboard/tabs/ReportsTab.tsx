import React from 'react';
import { Search } from 'lucide-react';
import { translateTargetType } from '../utils';

interface ReportsTabProps {
  reportHook: any;
  onOpenReportDetails: (report: any) => void;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({ reportHook, onOpenReportDetails }) => {
  return (
    <div>
      {/* Filters Bar */}
      <div className="filters-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div className="filters-group" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
          <div className="filter-control" style={{ minWidth: '220px', position: 'relative' }}>
            <label>Buscar Denúncias</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-field"
                placeholder="Motivo, ID ou descrição..."
                style={{ paddingLeft: '36px' }}
                value={reportHook.searchQuery}
                onChange={(e) => {
                  reportHook.setSearchQuery(e.target.value);
                  reportHook.setPage(1);
                }}
              />
            </div>
          </div>

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
              <option value="">Todos Status</option>
              <option value="pending">Pendentes</option>
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
              <option value="">Todos Alvos</option>
              <option value="user">Usuário</option>
              <option value="work">Obra</option>
              <option value="proposal">Proposta</option>
              <option value="budget">Orçamento</option>
              <option value="content">Conteúdo</option>
            </select>
          </div>

          <div className="filter-control">
            <label>Categoria / Motivo</label>
            <select
              className="select-field"
              value={reportHook.reasonFilter || ''}
              onChange={(e) => {
                reportHook.setReasonFilter(e.target.value || undefined);
                reportHook.setPage(1);
              }}
            >
              <option value="">Todas Categorias</option>
              <option value="Spam / Publicidade Abusiva">Spam / Publicidade Abusiva</option>
              <option value="Fraude / Golpe">Fraude / Golpe</option>
              <option value="Conteúdo Impróprio">Conteúdo Impróprio</option>
              <option value="Assédio / Ofensa">Assédio / Ofensa</option>
              <option value="Perfil Falso">Perfil Falso</option>
              <option value="Outros">Outros</option>
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
                <th>Categoria / Motivo</th>
                <th>Tipo de Alvo</th>
                <th>Data</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reportHook.loading ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    Carregando denúncias...
                  </td>
                </tr>
              ) : reportHook.reports.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    Nenhuma denúncia encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                reportHook.reports.map((rep: any) => (
                  <tr
                    key={rep.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onOpenReportDetails(rep)}
                  >
                    <td>
                      <span style={{ fontWeight: 500 }}>{rep.reason || rep.reason_category || rep.category || 'Não informado'}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{translateTargetType(rep.target_type)}</span>
                    </td>
                    <td>{new Date(rep.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${rep.status === 'new' || rep.status === 'pending' ? 'badge-danger' : rep.status === 'in_review' ? 'badge-warning' : rep.status === 'resolved' ? 'badge-success' : 'badge-secondary'}`}>
                        {rep.status === 'new' || rep.status === 'pending' ? 'Pendente' : rep.status === 'in_review' ? 'Em Análise' : rep.status === 'resolved' ? 'Resolvida' : 'Ignorada'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid var(--border-light)' }}>
          <div className="pagination-info" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Exibindo <strong>{reportHook.reports.length}</strong> de <strong>{reportHook.totalCount}</strong> denúncias (Página <strong>{reportHook.page}</strong> de <strong>{reportHook.totalPages}</strong>)
          </div>
          <div className="pagination-actions" style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={reportHook.page <= 1 || reportHook.loading}
              onClick={() => reportHook.setPage((p: number) => p - 1)}
            >
              Anterior
            </button>
            <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', fontWeight: 600, padding: '0 4px' }}>
              {reportHook.page} / {reportHook.totalPages}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={reportHook.page >= reportHook.totalPages || reportHook.loading}
              onClick={() => reportHook.setPage((p: number) => p + 1)}
            >
              Próxima
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
