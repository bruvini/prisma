import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { MainLayout } from './layouts/MainLayout';
import { AuthProvider } from './contexts/AuthContext';
import { AuthGuard } from './guards/AuthGuard';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Placeholder } from './components/ui/Placeholder';
import { MapaResidencias } from './pages/MapaResidencias';
import { Indicadores } from './pages/Indicadores';
import { appModules } from './config/modules';

// Placeholder genérico para exibir módulos pela config
const ModulePlaceholder = ({ title, description }: { title: string; description: string }) => (
  <Placeholder title={`Módulo de ${title}`} description={description} />
);

// Helper para sincronizar o document.title
const TitleUpdater = () => {
  const location = useLocation();
  
  useEffect(() => {
    if (location.pathname === '/' || location.pathname === '') {
      document.title = 'PRISMA-SP | Login';
      return;
    }
    
    const module = appModules.find(m => location.pathname.startsWith(m.path));
    if (module) {
      document.title = module.title;
    } else {
      document.title = 'PRISMA-SP';
    }
  }, [location]);

  return null;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <TitleUpdater />
        <Routes>
          <Route path="/" element={<Login />} />
          
          <Route element={<AuthGuard />}>
            <Route element={<MainLayout />}>
              <Route path="/inicio" element={<Home />} />
              {/* Módulo Mapa de Residências */}
              <Route path="/residencias" element={<MapaResidencias />} />
              {/* Módulo de Indicadores Metodológicos */}
              <Route path="/indicadores" element={<Indicadores />} />
              {/* Redirect de compatibilidade da rota antiga */}
              <Route path="/mapa-celas" element={<Navigate to="/residencias" replace />} />
              {/* Demais módulos ainda como placeholder */}
              {appModules.filter(m => !['inicio', 'residencias', 'indicadores'].includes(m.id)).map(m => (
                <Route
                  key={m.id}
                  path={m.path.replace('/', '')}
                  element={<ModulePlaceholder title={m.name} description={m.description} />}
                />
              ))}
            </Route>
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
