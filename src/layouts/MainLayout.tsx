import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Header } from '../components/shared/Header';
import { Footer } from '../components/shared/Footer';
import { 
  HomeIcon, ClipboardDocumentListIcon, BeakerIcon, HeartIcon, 
  ShieldCheckIcon, PresentationChartBarIcon, MapIcon, UsersIcon 
} from '@heroicons/react/24/outline';
import './MainLayout.css';

export function MainLayout() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navLinks = [
    { name: 'Início', path: '/inicio', icon: HomeIcon },
    { name: 'Triagem', path: '/triagem', icon: ClipboardDocumentListIcon },
    { name: 'Farmácia', path: '/farmacia', icon: BeakerIcon },
    { name: 'Psicologia', path: '/psicologia', icon: HeartIcon },
    { name: 'Vacinação', path: '/vacinacao', icon: ShieldCheckIcon },
    { name: 'Indicadores', path: '/indicadores', icon: PresentationChartBarIcon },
    { name: 'Mapa de Celas', path: '/mapa-celas', icon: MapIcon },
    { name: 'Gestão de Usuários', path: '/usuarios', icon: UsersIcon },
  ];

  return (
    <div className="app-container">
      <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="layout-body">
        <aside className={`sidebar ${isSidebarOpen ? 'expanded' : 'collapsed'}`}>
          <nav className="nav-menu">
            {navLinks.map((link) => {
              const isActive = location.pathname.startsWith(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  title={!isSidebarOpen ? link.name : undefined}
                >
                  <link.icon className="nav-icon" />
                  <span className="nav-label">{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="main-content">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
}
