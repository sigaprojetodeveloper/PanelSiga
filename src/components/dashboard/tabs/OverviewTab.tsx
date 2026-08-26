/* eslint-disable complexity */
import React from 'react';
import {
  Users,
  Film,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  Hammer,
  Building2,
  Info
} from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import type { DashboardTab } from '../Sidebar';

interface OverviewTabProps {
  totalUsersCount: number;
  newUsersCount: number | null;
  newWorksCount: number | null;
  newContractsCount: number | null;
  newStoresCount?: number | null;
  pendingReportsCount: number;
  totalActiveStoriesChannelsCount: number | null;
  totalActiveBannersCount: number | null;
  pendingRequestsCount: number;
  onNavigate?: (tab: DashboardTab) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  totalUsersCount,
  newUsersCount,
  newWorksCount,
  newContractsCount,
  newStoresCount = null,
  pendingReportsCount,
  totalActiveStoriesChannelsCount,
  totalActiveBannersCount,
  pendingRequestsCount,
  onNavigate
}) => {
  const { info } = useToast();

  const handleCardClick = (tab: DashboardTab) => {
    if (onNavigate) {
      onNavigate(tab);
    }
  };

  return (
    <div>
      <div className="stats-grid">
        {/* Total Usuários */}
        <div
          className="stat-card"
          style={{ position: 'relative', cursor: onNavigate ? 'pointer' : 'default' }}
          onClick={() => handleCardClick('users')}
        >
          <Info
            size={14}
            style={{ position: 'absolute', top: '12px', right: '12px', color: 'var(--text-muted)', cursor: 'pointer', zIndex: 2 }}
            onClick={(e) => {
              e.stopPropagation();
              info("Total de usuários cadastrados no aplicativo (clientes e profissionais).");
            }}
          />
          <div className="stat-info">
            <h3>Total Usuários</h3>
            <div className="stat-value">{totalUsersCount}</div>
          </div>
          <div className="stat-icon-wrapper blue" style={{ marginTop: '8px' }}>
            <Users size={24} />
          </div>
        </div>

        {/* Novos Usuários */}
        <div
          className="stat-card"
          style={{ position: 'relative', cursor: onNavigate ? 'pointer' : 'default' }}
          onClick={() => handleCardClick('users')}
        >
          <Info
            size={14}
            style={{ position: 'absolute', top: '12px', right: '12px', color: 'var(--text-muted)', cursor: 'pointer', zIndex: 2 }}
            onClick={(e) => {
              e.stopPropagation();
              info("Usuários que se cadastraram no aplicativo há menos de 1 mês.");
            }}
          />
          <div className="stat-info">
            <h3>Novos Usuários</h3>
            <div className="stat-value">{newUsersCount !== null ? newUsersCount : '...'}</div>
          </div>
          <div className="stat-icon-wrapper green" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', marginTop: '8px' }}>
            <Users size={24} />
          </div>
        </div>

        {/* Novas Obras */}
        <div
          className="stat-card"
          style={{ position: 'relative', cursor: onNavigate ? 'pointer' : 'default' }}
          onClick={() => handleCardClick('works')}
        >
          <Info
            size={14}
            style={{ position: 'absolute', top: '12px', right: '12px', color: 'var(--text-muted)', cursor: 'pointer', zIndex: 2 }}
            onClick={(e) => {
              e.stopPropagation();
              info("Obras cadastradas no aplicativo há menos de 1 mês.");
            }}
          />
          <div className="stat-info">
            <h3>Novas Obras</h3>
            <div className="stat-value">{newWorksCount !== null ? newWorksCount : '...'}</div>
          </div>
          <div className="stat-icon-wrapper orange" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', marginTop: '8px' }}>
            <Hammer size={24} />
          </div>
        </div>

        {/* Novos Contratos */}
        <div
          className="stat-card"
          style={{ position: 'relative', cursor: onNavigate ? 'pointer' : 'default' }}
          onClick={() => handleCardClick('financial')}
        >
          <Info
            size={14}
            style={{ position: 'absolute', top: '12px', right: '12px', color: 'var(--text-muted)', cursor: 'pointer', zIndex: 2 }}
            onClick={(e) => {
              e.stopPropagation();
              info("Contratos fechados (propostas aceitas) há menos de 1 mês.");
            }}
          />
          <div className="stat-info">
            <h3>Novos Contratos</h3>
            <div className="stat-value">{newContractsCount !== null ? newContractsCount : '...'}</div>
          </div>
          <div className="stat-icon-wrapper blue" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', marginTop: '8px' }}>
            <FileText size={24} />
          </div>
        </div>

        {/* Novas Lojas */}
        <div
          className="stat-card"
          style={{ position: 'relative', cursor: onNavigate ? 'pointer' : 'default' }}
          onClick={() => handleCardClick('stores')}
        >
          <Info
            size={14}
            style={{ position: 'absolute', top: '12px', right: '12px', color: 'var(--text-muted)', cursor: 'pointer', zIndex: 2 }}
            onClick={(e) => {
              e.stopPropagation();
              info("Lojas e empresas cadastradas no aplicativo há menos de 1 mês.");
            }}
          />
          <div className="stat-info">
            <h3>Novas Lojas</h3>
            <div className="stat-value">{newStoresCount !== null ? newStoresCount : '...'}</div>
          </div>
          <div className="stat-icon-wrapper purple" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', marginTop: '8px' }}>
            <Building2 size={24} />
          </div>
        </div>

        {/* Denúncias Pendentes */}
        <div
          className="stat-card"
          style={{ position: 'relative', cursor: onNavigate ? 'pointer' : 'default' }}
          onClick={() => handleCardClick('reports')}
        >
          <Info
            size={14}
            style={{ position: 'absolute', top: '12px', right: '12px', color: 'var(--text-muted)', cursor: 'pointer', zIndex: 2 }}
            onClick={(e) => {
              e.stopPropagation();
              info("Total de denúncias recebidas com status pendente de revisão.");
            }}
          />
          <div className="stat-info">
            <h3>Denúncias Pendentes</h3>
            <div className="stat-value">{pendingReportsCount}</div>
          </div>
          <div className="stat-icon-wrapper orange" style={{ marginTop: '8px' }}>
            <AlertTriangle size={24} />
          </div>
        </div>

        {/* Canais de Stories */}
        <div
          className="stat-card"
          style={{ position: 'relative', cursor: onNavigate ? 'pointer' : 'default' }}
          onClick={() => handleCardClick('stories')}
        >
          <Info
            size={14}
            style={{ position: 'absolute', top: '12px', right: '12px', color: 'var(--text-muted)', cursor: 'pointer', zIndex: 2 }}
            onClick={(e) => {
              e.stopPropagation();
              info("Quantidade total de canais de stories ativos no aplicativo, sem restrição de localização.");
            }}
          />
          <div className="stat-info">
            <h3>Canais de Stories</h3>
            <div className="stat-value">{totalActiveStoriesChannelsCount !== null ? totalActiveStoriesChannelsCount : '...'}</div>
          </div>
          <div className="stat-icon-wrapper purple" style={{ marginTop: '8px' }}>
            <Film size={24} />
          </div>
        </div>

        {/* Banners */}
        <div
          className="stat-card"
          style={{ position: 'relative', cursor: onNavigate ? 'pointer' : 'default' }}
          onClick={() => handleCardClick('banners')}
        >
          <Info
            size={14}
            style={{ position: 'absolute', top: '12px', right: '12px', color: 'var(--text-muted)', cursor: 'pointer', zIndex: 2 }}
            onClick={(e) => {
              e.stopPropagation();
              info("Quantidade total de banners publicitários atualmente ativos no aplicativo, sem restrição de localização.");
            }}
          />
          <div className="stat-info">
            <h3>Banners</h3>
            <div className="stat-value">{totalActiveBannersCount !== null ? totalActiveBannersCount : '...'}</div>
          </div>
          <div className="stat-icon-wrapper blue" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', marginTop: '8px' }}>
            <ImageIcon size={24} />
          </div>
        </div>

        {/* Solicitações Pendentes */}
        <div
          className="stat-card"
          style={{ position: 'relative', cursor: onNavigate ? 'pointer' : 'default' }}
          onClick={() => handleCardClick('moderation')}
        >
          <Info
            size={14}
            style={{ position: 'absolute', top: '12px', right: '12px', color: 'var(--text-muted)', cursor: 'pointer', zIndex: 2 }}
            onClick={(e) => {
              e.stopPropagation();
              info("Total de solicitações de novos banners ou canais de stories aguardando moderação.");
            }}
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
