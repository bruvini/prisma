import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import {
  UserPlusIcon,
  BeakerIcon,
  HeartIcon,
  ChartBarIcon,
  MapIcon,
  UsersIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import './Home.css';

interface ModuleConfig {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
}

const modules: ModuleConfig[] = [
  { id: 'triagem', title: 'Triagem', description: 'Ponto de entrada e cadastro clínico.', icon: UserPlusIcon, path: '/triagem' },
  { id: 'farmacia', title: 'Farmácia', description: 'Gestão e dispensação de medicamentos.', icon: BeakerIcon, path: '/farmacia' },
  { id: 'psicologia', title: 'Psicologia', description: 'Registro longitudinal de evolução mental.', icon: HeartIcon, path: '/psicologia' },
  { id: 'vacinacao', title: 'Vacinação', description: 'Controle imunológico e registro de doses.', icon: ShieldCheckIcon, path: '/vacinacao' },
  { id: 'indicadores', title: 'Indicadores', description: 'Painéis analíticos baseados em metas SUS.', icon: ChartBarIcon, path: '/indicadores' },
  { id: 'mapacelas', title: 'Mapa de Celas', description: 'Localização de internos e ocupação.', icon: MapIcon, path: '/mapa-celas' },
  { id: 'usuarios', title: 'Gestão de Usuários', description: 'Controle de acesso seguro à plataforma.', icon: UsersIcon, path: '/usuarios' },
];

export const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="home-main">
      <section className="home-dashboard">
        <h1 className="dashboard-title">Visão Geral</h1>
        <p className="dashboard-subtitle">Selecione o módulo que deseja acessar.</p>
        
        <div className="modules-grid">
          {modules.map((mod) => (
            <Card key={mod.id} className="module-card" onClick={() => navigate(mod.path)}>
              <div className="module-icon-wrapper">
                <mod.icon className="module-icon" />
              </div>
              <h3 className="module-title">{mod.title}</h3>
              <p className="module-description">{mod.description}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};
