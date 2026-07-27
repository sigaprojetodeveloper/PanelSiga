import React from 'react';
import {
  Users,
  Film,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  Info
} from 'lucide-react';
import { useToast } from '../../../hooks/useToast';

interface OverviewTabProps {
  totalUsersCount: number;
  newUsersCount: number | null;
  newContractsCount: number | null;
  pendingReportsCount: number;
  totalActiveStoriesChannelsCount: number | null;
  totalActiveBannersCount: number | null;
  pendingRequestsCount: number;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  totalUsersCount,
  newUsersCount,
  newContractsCount,
  pendingReportsCount,
  totalActiveStoriesChannelsCount,
  totalActiveBannersCount,
  pendingRequestsCount
}) => {
  const { info } = useToast();

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card" style={{ position: 'relative' }}>
          <Info
            size={14}
            style={{ position: 'absolute', top: '12px', right: '12px', color: 'var(--text-muted)', cursor: 'pointer' }}
            onClick={() => info("Total de usuários cadastrados no aplicativo (clientes e profissionais).")}
          />
          <div className="stat-info">
            <h3>Total Usuários</h3>
            <div className="stat-value">{totalUsersCount}</div>
          </div>
          <div className="stat-icon-wrapper blue" style={{ marginTop: '8px' }}>
            <Users size={24} />
          </div>
        </div>
        <div className="stat-card" style={{ position: 'relative' }}>
          <Info
            size={14}
            style={{ position: 'absolute', top: '12px', right: '12px', color: 'var(--text-muted)', cursor: 'pointer' }}
            onClick={() => info("Usuários que se cadastraram no aplicativo há menos de 1 mês.")}
          />
          <div className="stat-info">
            <h3>Novos Usuários</h3>
            <div className="stat-value">{newUsersCount !== null ? newUsersCount : '...'}</div>
          </div>
          <div className="stat-icon-wrapper green" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', marginTop: '8px' }}>
            <Users size={24} />
          </div>
        </div>
        <div className="stat-card" style={{ position: 'relative' }}>
          <Info
            size={14}
            style={{ position: 'absolute', top: '12px', right: '12px', color: 'var(--text-muted)', cursor: 'pointer' }}
            onClick={() => info("Contratos fechados (propostas aceitas) há menos de 1 mês.")}
          />
          <div className="stat-info">
            <h3>Novos Contratos</h3>
            <div className="stat-value">{newContractsCount !== null ? newContractsCount : '...'}</div>
          </div>
          <div className="stat-icon-wrapper blue" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', marginTop: '8px' }}>
            <FileText size={24} />
          </div>
        </div>
        <div className="stat-card" style={{ position: 'relative' }}>
          <Info
            size={14}
            style={{ position: 'absolute', top: '12px', right: '12px', color: 'var(--text-muted)', cursor: 'pointer' }}
            onClick={() => info("Total de denúncias recebidas com status pendente de revisão.")}
          />
          <div className="stat-info">
            <h3>Denúncias Pendentes</h3>
            <div className="stat-value">{pendingReportsCount}</div>
          </div>
          <div className="stat-icon-wrapper orange" style={{ marginTop: '8px' }}>
            <AlertTriangle size={24} />
          </div>
        </div>
        <div className="stat-card" style={{ position: 'relative' }}>
          <Info
            size={14}
            style={{ position: 'absolute', top: '12px', right: '12px', color: 'var(--text-muted)', cursor: 'pointer' }}
            onClick={() => info("Quantidade total de canais de stories ativos no aplicativo, sem restrição de localização.")}
          />
          <div className="stat-info">
            <h3>Canais de Stories</h3>
            <div className="stat-value">{totalActiveStoriesChannelsCount !== null ? totalActiveStoriesChannelsCount : '...'}</div>
          </div>
          <div className="stat-icon-wrapper purple" style={{ marginTop: '8px' }}>
            <Film size={24} />
          </div>
        </div>
        <div className="stat-card" style={{ position: 'relative' }}>
          <Info
            size={14}
            style={{ position: 'absolute', top: '12px', right: '12px', color: 'var(--text-muted)', cursor: 'pointer' }}
            onClick={() => info("Quantidade total de banners publicitários atualmente ativos no aplicativo, sem restrição de localização.")}
          />
          <div className="stat-info">
            <h3>Banners</h3>
            <div className="stat-value">{totalActiveBannersCount !== null ? totalActiveBannersCount : '...'}</div>
          </div>
          <div className="stat-icon-wrapper blue" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', marginTop: '8px' }}>
            <ImageIcon size={24} />
          </div>
        </div>
        <div className="stat-card" style={{ position: 'relative' }}>
          <Info
            size={14}
            style={{ position: 'absolute', top: '12px', right: '12px', color: 'var(--text-muted)', cursor: 'pointer' }}
            onClick={() => info("Total de solicitações de novos banners ou canais de stories aguardando moderação.")}
          />
          <div className="stat-info">
            <h3>Solicitações Pendentes</h3>
            <div className="stat-value">{pendingRequestsCount}</div>
          </div>
          <div className="stat-icon-wrapper orange" style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)', color: '#f97316', marginTop: '8px' }}>
            <FileText size={24} />
          </div>
        </div>
      </div>
    </div>
  );
};
