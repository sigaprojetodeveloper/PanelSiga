/* eslint-disable complexity, @next/next/no-img-element */
import React from 'react';
import logoImg from '../../assets/logo.png';
import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  Film,
  AlertTriangle,
  Settings,
  LogOut,
  Image as ImageIcon,
  Bell,
  Award,
  Hammer,
  X
} from 'lucide-react';

export type DashboardTab =
  | 'overview'
  | 'selo'
  | 'users'
  | 'works'
  | 'stories'
  | 'reports'
  | 'settings'
  | 'banners'
  | 'moderation'
  | 'financial';

interface SidebarProps {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  pendingModerationCount: number;
  pendingReportsCount: number;
  currentUserEmail: string;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileSidebarOpen,
  setMobileSidebarOpen,
  pendingModerationCount,
  pendingReportsCount,
  currentUserEmail,
  onLogout
}) => {
  return (
    <aside className={`sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <img src={logoImg.src} alt="Logo Siga" style={{ height: '56px', objectFit: 'contain' }} />
        <h2>Painel Siga</h2>
        <button className="btn-close-sidebar" onClick={() => setMobileSidebarOpen(false)}>
          <X size={24} />
        </button>
      </div>

      <nav className="sidebar-nav">
        <a
          onClick={() => {
            setActiveTab('overview');
            setMobileSidebarOpen(false);
          }}
          className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
        >
          <LayoutDashboard size={18} />
          Visão Geral
        </a>
        <a
          onClick={() => {
            setActiveTab('selo');
            setMobileSidebarOpen(false);
          }}
          className={`nav-item ${activeTab === 'selo' ? 'active' : ''}`}
        >
          <ShieldCheck size={18} />
          Selo
        </a>
        <a
          onClick={() => {
            setActiveTab('financial');
            setMobileSidebarOpen(false);
          }}
          className={`nav-item ${activeTab === 'financial' ? 'active' : ''}`}
        >
          <Award size={18} />
          Financeiro
        </a>
        <a
          onClick={() => {
            setActiveTab('stories');
            setMobileSidebarOpen(false);
          }}
          className={`nav-item ${activeTab === 'stories' ? 'active' : ''}`}
        >
          <Film size={18} />
          Stories
        </a>
        <a
          onClick={() => {
            setActiveTab('banners');
            setMobileSidebarOpen(false);
          }}
          className={`nav-item ${activeTab === 'banners' ? 'active' : ''}`}
        >
          <ImageIcon size={18} />
          Banners
        </a>
        <a
          onClick={() => {
            setActiveTab('users');
            setMobileSidebarOpen(false);
          }}
          className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
        >
          <Users size={18} />
          Usuários
        </a>
        <a
          onClick={() => {
            setActiveTab('works');
            setMobileSidebarOpen(false);
          }}
          className={`nav-item ${activeTab === 'works' ? 'active' : ''}`}
        >
          <Hammer size={18} />
          Obras
        </a>
        <a
          onClick={() => {
            setActiveTab('moderation');
            setMobileSidebarOpen(false);
          }}
          className={`nav-item ${activeTab === 'moderation' ? 'active' : ''}`}
        >
          <Bell size={18} />
          Solicitações
          {pendingModerationCount > 0 && (
            <span className="badge badge-danger" style={{ marginLeft: 'auto', padding: '2px 6px', fontSize: '10px' }}>
              {pendingModerationCount}
            </span>
          )}
        </a>
        <a
          onClick={() => {
            setActiveTab('reports');
            setMobileSidebarOpen(false);
          }}
          className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
        >
          <AlertTriangle size={18} />
          Denúncias
          {pendingReportsCount > 0 && (
            <span className="badge badge-danger" style={{ marginLeft: 'auto', padding: '2px 6px', fontSize: '10px' }}>
              {pendingReportsCount}
            </span>
          )}
        </a>
        <a
          onClick={() => {
            setActiveTab('settings');
            setMobileSidebarOpen(false);
          }}
          className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
        >
          <Settings size={18} />
          Configurações
        </a>
      </nav>

      <div className="sidebar-footer">
        <div className="admin-badge">
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Administrador</span>
          <span className="admin-email">{currentUserEmail || 'admin@siga.com.br'}</span>
        </div>
        <button className="btn-logout" onClick={onLogout} title="Sair">
          <LogOut size={20} />
        </button>
      </div>
    </aside>
  );
};
