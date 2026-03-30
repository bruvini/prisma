import type React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const AuthGuard: React.FC = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Carregando PRISMA-SP...</p>
      </div>
    );
  }

  // Provisório: Bypass auth para permitir teste do frontend sem Firebase real
  // if (!user) {
  //  return <Navigate to="/" replace />;
  // }

  // Senão, prossegue nas rotas privadas
  return <Outlet />;
};
