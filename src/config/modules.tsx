/* eslint-disable react-refresh/only-export-components */
import type React from 'react';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHouse, 
  faClipboardList, 
  faPills, 
  faBrain, 
  faSyringe, 
  faChartColumn, 
  faMapLocationDot, 
  faUsers 
} from '@fortawesome/free-solid-svg-icons';

// Wrapper para FontAwesome manter a mesma API prop (className) dos Heroicons
const FaIcon: React.FC<{ icon: IconDefinition; className?: string }> = ({ icon, className }) => (
  <FontAwesomeIcon icon={icon} className={className} />
);

export interface AppModule {
  id: string;
  name: string;
  title: string;
  description: string;
  path: string;
  icon: React.ElementType;
}

export const appModules: AppModule[] = [
  {
    id: 'inicio',
    name: 'Início',
    title: 'PRISMA-SP | Início',
    description: 'Ponto inicial do sistema.',
    path: '/inicio',
    icon: (props) => <FaIcon icon={faHouse} {...props} />
  },
  {
    id: 'triagem',
    name: 'Triagem',
    title: 'PRISMA-SP | Triagem',
    description: 'Ponto de entrada e cadastro clínico.',
    path: '/triagem',
    icon: (props) => <FaIcon icon={faClipboardList} {...props} />
  },
  {
    id: 'farmacia',
    name: 'Farmácia',
    title: 'PRISMA-SP | Farmácia',
    description: 'Gestão e dispensação de medicamentos.',
    path: '/farmacia',
    icon: (props) => <FaIcon icon={faPills} {...props} />
  },
  {
    id: 'psicologia',
    name: 'Psicologia',
    title: 'PRISMA-SP | Psicologia',
    description: 'Registro longitudinal de evolução mental.',
    path: '/psicologia',
    icon: (props) => <FaIcon icon={faBrain} {...props} />
  },
  {
    id: 'vacinacao',
    name: 'Vacinação',
    title: 'PRISMA-SP | Vacinação',
    description: 'Controle imunológico e registro de doses.',
    path: '/vacinacao',
    icon: (props) => <FaIcon icon={faSyringe} {...props} />
  },
  {
    id: 'indicadores',
    name: 'Indicadores',
    title: 'PRISMA-SP | Indicadores',
    description: 'Painéis analíticos baseados em metas SUS.',
    path: '/indicadores',
    icon: (props) => <FaIcon icon={faChartColumn} {...props} />
  },
  {
    id: 'residencias',
    name: 'Mapa de Residências',
    title: 'PRISMA-SP | Mapa de Residências',
    description: 'Cadastro e localização de residências internas.',
    path: '/residencias',
    icon: (props) => <FaIcon icon={faMapLocationDot} {...props} />
  },
  {
    id: 'usuarios',
    name: 'Gestão de Usuários',
    title: 'PRISMA-SP | Gestão de Usuários',
    description: 'Controle de acesso seguro à plataforma.',
    path: '/usuarios',
    icon: (props) => <FaIcon icon={faUsers} {...props} />
  }
];
