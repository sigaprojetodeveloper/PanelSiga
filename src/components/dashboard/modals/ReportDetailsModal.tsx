import React from 'react';
import { X, FileText } from 'lucide-react';

interface ReportDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedReport: any;
  reportNotes: string;
  setReportNotes: (notes: string) => void;
  onUpdateStatus: (status: 'resolved' | 'ignored' | 'in_review') => Promise<void>;
}

export const ReportDetailsModal: React.FC<ReportDetailsModalProps> = ({
  isOpen,
  onClose,
  selectedReport,
  reportNotes,
  setReportNotes,
  onUpdateStatus
}) => {
  if (!isOpen || !selectedReport) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '650px' }}>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>
        <h3 className="modal-title">Detalhes da Denúncia</h3>

        <div className="modal-grid-2" style={{ gap: '16px 24px', marginBottom: '20px' }}>
          <div className="modal-field">
            <span className="label">Categoria / Motivo</span>
            <span className="value" style={{ fontWeight: 600 }}>{selectedReport.reason}</span>
          </div>
          <div className="modal-field">
            <span className="label">Data de Envio</span>
            <span className="value">{new Date(selectedReport.created_at).toLocaleString()}</span>
          </div>
          <div className="modal-field">
            <span className="label">Tipo do Alvo</span>
            <span className="value" style={{ textTransform: 'capitalize' }}>{selectedReport.target_type}</span>
          </div>
          <div className="modal-field">
            <span className="label">ID do Alvo</span>
            <span className="value" style={{ fontFamily: 'monospace', fontSize: '13px' }}>{selectedReport.target_id}</span>
          </div>
          <div className="modal-field">
            <span className="label">ID do Denunciante</span>
            <span className="value" style={{ fontFamily: 'monospace', fontSize: '13px' }}>{selectedReport.reporter_id || 'Anônimo / Não inf.'}</span>
          </div>
          <div className="modal-field">
            <span className="label">Permite Contato Direto</span>
            <span className="value">{selectedReport.allow_contact ? 'Sim ✅' : 'Não ❌'}</span>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <span className="label" style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Status Atual</span>
          <div style={{ marginTop: '4px' }}>
            <span className={`badge ${selectedReport.status === 'new' ? 'badge-danger' : selectedReport.status === 'in_review' ? 'badge-warning' : selectedReport.status === 'resolved' ? 'badge-success' : 'badge-secondary'}`}>
              {selectedReport.status === 'new' ? 'Nova Denúncia' : selectedReport.status === 'in_review' ? 'Em Análise' : selectedReport.status === 'resolved' ? 'Resolvida' : 'Ignorada / Arquivada'}
            </span>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <span className="label" style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Descrição do Relato</span>
          <p style={{ fontSize: '14px', marginTop: '6px', padding: '14px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
            {selectedReport.description || 'Sem descrição fornecida pelo denunciante.'}
          </p>
        </div>

        {selectedReport.attachment_urls && selectedReport.attachment_urls.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <span className="label" style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Anexos Enviados ({selectedReport.attachment_urls.length})</span>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
              {selectedReport.attachment_urls.map((url: string, index: number) => (
                <a key={index} href={url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={14} /> Anexo {index + 1}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="form-group" style={{ marginBottom: '24px' }}>
          <label>Observações Internas (Admin)</label>
          <textarea
            className="textarea-field"
            style={{ width: '100%', minHeight: '90px' }}
            placeholder="Adicione notas sobre a investigação, contato com partes ou providências tomadas..."
            value={reportNotes}
            onChange={(e) => setReportNotes(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
          <div>
            {selectedReport.status === 'new' && (
              <button className="btn btn-secondary" onClick={() => onUpdateStatus('in_review')}>
                Marcar Em Análise
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-danger" onClick={() => onUpdateStatus('ignored')}>
              Ignorar / Sem Sanção
            </button>
            <button className="btn btn-primary" style={{ backgroundColor: 'var(--success)' }} onClick={() => onUpdateStatus('resolved')}>
              Resolver / Aplicar Ação
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
