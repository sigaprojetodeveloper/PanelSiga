import React from 'react';
import { Menu } from 'lucide-react';
import type { DashboardTab } from './Sidebar';

interface HeaderProps {
  activeTab: DashboardTab;
  setMobileSidebarOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setMobileSidebarOpen }) => {
  return (
    <header className="header-main">
      <button className="btn-menu-mobile" onClick={() => setMobileSidebarOpen(true)}>
        <Menu size={24} />
      </button>
      <div className="header-title">
        <h2>
          {activeTab === 'overview' && 'Visão Geral'}
          {activeTab === 'users' && 'Usuários'}
          {activeTab === 'works' && 'Obras'}
          {activeTab === 'stories' && 'Stories'}
          {activeTab === 'banners' && 'Banners'}
          {activeTab === 'reports' && 'Denúncias'}
          {activeTab === 'moderation' && 'Solicitações de Anúncios'}
          {activeTab === 'settings' && 'Configurações do Sistema'}
          {activeTab === 'financial' && 'Financeiro'}
        </h2>
      </div>
    </header>
  );
};
