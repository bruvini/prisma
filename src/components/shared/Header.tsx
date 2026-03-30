import type React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { PowerIcon, UserCircleIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import './Header.css';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="app-header">
      <div className="header-left">
        {onToggleSidebar && (
          <button className="menu-button" onClick={onToggleSidebar} title="Menu">
            <Bars3Icon className="header-icon menu-icon" />
          </button>
        )}
        <div className="header-brand" onClick={() => navigate('/inicio')}>
          <img src="/logo_sem_texto.png" alt="PRISMA-SP Logo" className="header-logo" />
          <h2 className="header-title">PRISMA-SP</h2>
          <span className="header-subtitle">Saúde Prisional</span>
        </div>
      </div>
      
      <div className="header-actions">
        {user ? (
          <div className="user-profile">
            <UserCircleIcon className="header-icon user-icon-desktop" />
            <span className="user-email">{user.email || 'Usuário PRISMA-SP'}</span>
            <button className="logout-button" onClick={handleLogout} title="Sair do sistema">
              <PowerIcon className="header-icon logout-icon" />
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
};
