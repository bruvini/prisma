import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Header } from '../components/shared/Header';
import { Footer } from '../components/shared/Footer';
import { appModules } from '../config/modules';
import './MainLayout.css';

export function MainLayout() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="app-container">
      <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="layout-body">
        <aside className={`sidebar ${isSidebarOpen ? 'expanded' : 'collapsed'}`}>
          <nav className="nav-menu">
            {appModules.map((link) => {
              const isActive = location.pathname.startsWith(link.path);
              return (
                <Link
                  key={link.id}
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
