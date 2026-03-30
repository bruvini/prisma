import type React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Footer } from '../../components/shared/Footer';
import './Login.css';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulação provisória de login
    setTimeout(() => {
      navigate('/inicio', { replace: true });
      setLoading(false);
    }, 500);
  };

  const handleRecuperarSenha = (e: React.MouseEvent) => {
    e.preventDefault();
    addToast('Recuperação de senha indisponível no momento. Contate o administrador.', 'info');
  };

  return (
    <div className="login-container">
      <main className="login-wrapper">
        <div className="login-impact">
          <img src="/logo_sem_texto.png" alt="PRISMA-SP Logo Institucional" className="login-logo" />
          <h1 className="login-title">PRISMA-SP</h1>
          <h2 className="login-subtitle">Prontuário de Registro Integrado de Saúde e Monitoramento Assistencial</h2>
          <p className="login-description">
            Plataforma dedicada à saúde prisional, promovendo gestão de dados de forma integrada,
            humanizada e segura para a coordenação clínica da UBS Prisional de Joinville.
          </p>
        </div>

        <div className="login-form-wrapper">
          <form className="login-form" onSubmit={handleLogin}>
            <h3 className="form-greeting">Acesso Restrito</h3>
            <p className="form-instructions">Insira suas credenciais institucionais.</p>
            
            <Input
              type="email"
              placeholder="e-mail institucional"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
            
            <Input
              type="password"
              placeholder="senha de acesso"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
            
            <div className="form-actions">
              <Button type="submit" className="login-btn" isLoading={loading}>
                Entrar
              </Button>
            </div>
            
            <a href="#" className="forgot-password" onClick={handleRecuperarSenha}>
              Esqueci minha senha
            </a>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};
