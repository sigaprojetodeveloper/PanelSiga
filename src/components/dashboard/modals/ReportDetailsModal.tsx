/* eslint-disable complexity */
import React, { useState, useEffect } from 'react';
import { X, FileText, ExternalLink, User } from 'lucide-react';
import { translateTargetType } from '../utils';
import { reportsService } from '../../../services/reportsService';
import { notificationsService } from '../../../services/notificationsService';

interface ReportDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedReport: any;
  reportNotes: string;
  setReportNotes: (notes: string) => void;
  onUpdateStatus: (status: 'resolved' | 'ignored' | 'in_review') => Promise<void>;
  onOpenUser?: (userId: string) => void;
  onOpenWork?: (workId: string) => void;
}

export const ReportDetailsModal: React.FC<ReportDetailsModalProps> = ({
  isOpen,
  onClose,
  selectedReport,
  reportNotes,
  setReportNotes,
  onUpdateStatus,
  onOpenUser,
  onOpenWork
}) => {
  const [reporterInfo, setReporterInfo] = useState<{ id: string; name: string; email: string; avatar_url: string | null } | null>(null);
  const [loadingReporter, setLoadingReporter] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  useEffect(() => {
    if (selectedReport?.reporter_id) {
      setLoadingReporter(true);
      reportsService.getReporterDetails(selectedReport.reporter_id)
        .then(res => setReporterInfo(res))
        .catch(() => setReporterInfo(null))
        .finally(() => setLoadingReporter(false));
    } else {
      setReporterInfo(null);
    }
  }, [selectedReport?.reporter_id]);

  if (!isOpen || !selectedReport) return null;

  const isUserTarget = selectedReport.target_type === 'user';
  const isWorkTarget = selectedReport.target_type === 'work' || selectedReport.target_type === 'construction';

  const handleIgnoreReport = async () => {
    try {
      setIsProcessingAction(true);
      // 1. Notify reporter
      if (selectedReport.reporter_id) {
        await notificationsService.sendNotification({
          userId: selectedReport.reporter_id,
          title: 'Atualização da sua denúncia',
          body: `Sua denúncia relacionada ao item (${translateTargetType(selectedReport.target_type)}) foi analisada pela equipe. Após verificação, a denúncia foi encerrada sem aplicação de sanções.`,
          type: 'report_ignored',
          relatedId: selectedReport.id,
        });
      }

      // 2. Notify target owner / reported user
      const targetOwnerId = await reportsService.getTargetOwnerUserId(
        selectedReport.target_type,
        selectedReport.target_id
      );

      if (targetOwnerId) {
        await notificationsService.sendNotification({
          userId: targetOwnerId,
          title: 'Notificação de Análise de Conteúdo',
          body: `Uma denúncia registrada em relação a um(a) ${translateTargetType(selectedReport.target_type)} de sua autoria foi analisada e concluída sem qualquer penalidade ou sanção.`,
          type: 'report_cleared',
          relatedId: selectedReport.id,
        });
      }

      // 3. Update report status
      await onUpdateStatus('ignored');
    } catch (err) {
      console.error('Erro ao ignorar denúncia:', err);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleResolveReport = async () => {
    try {
      setIsProcessingAction(true);
      // 1. Notify reporter that report was accepted
      if (selectedReport.reporter_id) {
        await notificationsService.sendNotification({
          userId: selectedReport.reporter_id,
          title: 'Denúncia Aceita',
          body: `Sua denúncia referente ao item (${translateTargetType(selectedReport.target_type)}) foi analisada e aceita. Uma sanção/medida cabível será aplicada. Agradecemos sua colaboração!`,
          type: 'report_accepted',
          relatedId: selectedReport.id,
        });
      }

      // 2. Update report status
      await onUpdateStatus('resolved');
    } catch (err) {
      console.error('Erro ao resolver denúncia:', err);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const targetTypeName = translateTargetType(selectedReport.target_type);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '680px' }}>
        <button className="modal-close" onClick={onClose} disabled={isProcessingAction}>
          <X size={20} />
        </button>
        <h3 className="modal-title">Detalhes da Denúncia</h3>

        <div className="modal-grid-2" style={{ gap: '16px 24px', marginBottom: '20px' }}>
          <div className="modal-field">
            <span className="label">Categoria / Motivo</span>
            <span className="value" style={{ fontWeight: 600 }}>{selectedReport.reason || selectedReport.reason_category || selectedReport.category || 'Não informado'}</span>
          </div>
          <div className="modal-field">
            <span className="label">Data de Envio</span>
            <span className="value">{new Date(selectedReport.created_at).toLocaleString()}</span>
          </div>

          {/* Status Atual */}
          <div className="modal-field">
            <span className="label">Status</span>
            <div style={{ marginTop: '4px' }}>
              <span className={`badge ${selectedReport.status === 'new' || selectedReport.status === 'pending' ? 'badge-danger' : selectedReport.status === 'in_review' ? 'badge-warning' : selectedReport.status === 'resolved' ? 'badge-success' : 'badge-secondary'}`}>
                {selectedReport.status === 'new' || selectedReport.status === 'pending' ? 'Pendente' : selectedReport.status === 'in_review' ? 'Em Análise' : selectedReport.status === 'resolved' ? 'Resolvida' : 'Ignorada / Arquivada'}
              </span>
            </div>
          </div>

          <div className="modal-field">
            <span className="label">Permite Contato Direto</span>
            <span className="value">{selectedReport.allow_contact ? 'Sim ✅' : 'Não ❌'}</span>
          </div>

          {/* Alvo da Denúncia */}
          <div className="modal-field" style={{ gridColumn: '1 / -1' }}>
            <span className="label">Alvo: {targetTypeName}</span>
            <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Tipo: {targetTypeName}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                  ID: {selectedReport.target_id}
                </span>
              </div>
              <div>
                {isUserTarget && onOpenUser && selectedReport.target_id && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => {
                      onClose();
                      onOpenUser(selectedReport.target_id);
                    }}
                  >
                    <ExternalLink size={14} /> Abrir Perfil
                  </button>
                )}
                {isWorkTarget && onOpenWork && selectedReport.target_id && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => {
                      onClose();
                      onOpenWork(selectedReport.target_id);
                    }}
                  >
                    <ExternalLink size={14} /> Abrir Obra
                  </button>
                )}
                {!isUserTarget && !isWorkTarget && (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ID do Alvo: {selectedReport.target_id}</span>
                )}
              </div>
            </div>
          </div>

          {/* Denunciante Card */}
          <div className="modal-field" style={{ gridColumn: '1 / -1' }}>
            <span className="label">Denunciante</span>
            {selectedReport.reporter_id ? (
              <div
                onClick={() => {
                  if (onOpenUser && selectedReport.reporter_id) {
                    onClose();
                    onOpenUser(selectedReport.reporter_id);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: onOpenUser ? 'pointer' : 'default',
                  marginTop: '6px',
                  transition: 'all 0.2s ease',
                }}
                title={onOpenUser ? 'Clique para abrir o perfil do denunciante' : undefined}
              >
                {loadingReporter ? (
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Carregando dados do denunciante...</span>
                ) : (
                  <>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {reporterInfo?.avatar_url ? (
                        <img src={reporterInfo.avatar_url} alt={reporterInfo.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <User size={22} style={{ color: 'var(--text-muted)' }} />
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>
                        {reporterInfo?.name || 'Denunciante'}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {reporterInfo?.email || `ID: ${selectedReport.reporter_id}`}
                      </span>
                    </div>
                    {onOpenUser && (
                      <span className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                        <ExternalLink size={12} /> Ver Perfil
                      </span>
                    )}
                  </>
                )}
              </div>
            ) : (
              <span className="value" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Anônimo / Não informado</span>
            )}
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
            disabled={isProcessingAction}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-danger" onClick={handleIgnoreReport} disabled={isProcessingAction}>
              {isProcessingAction ? 'Processando...' : 'Ignorar Denúncia'}
            </button>
            <button className="btn btn-primary" style={{ backgroundColor: 'var(--success)' }} onClick={handleResolveReport} disabled={isProcessingAction}>
              {isProcessingAction ? 'Processando...' : 'Aplicar Sanção'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
