import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { appModules } from '../../config/modules';
import './Home.css';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="home-main">
      <section className="home-dashboard">
        <h1 className="dashboard-title">Visão Geral</h1>
        <p className="dashboard-subtitle">Selecione o módulo que deseja acessar.</p>
        
        <div className="modules-grid">
          {appModules.filter(m => m.id !== 'inicio').map((mod) => (
            <Card key={mod.id} className="module-card" onClick={() => navigate(mod.path)}>
              <div className="module-icon-wrapper">
                <mod.icon className="module-icon" />
              </div>
              <h3 className="module-title">{mod.name}</h3>
              <p className="module-description">{mod.description}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};
