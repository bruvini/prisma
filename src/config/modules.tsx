/* eslint-disable react-refresh/only-export-components */
import type React from 'react';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  PresentationChartBarIcon,
  MapIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPills, faBrain, faSyringe } from '@fortawesome/free-solid-svg-icons';

// Wrappers para FontAwesome manter a mesma API prop (className) dos Heroicons
export const PillsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <FontAwesomeIcon icon={faPills} className={className} />
);

export const BrainIcon: React.FC<{ className?: string }> = ({ className }) => (
  <FontAwesomeIcon icon={faBrain} className={className} />
);

export const SyringeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <FontAwesomeIcon icon={faSyringe} className={className} />
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
    icon: HomeIcon
  },
  {
    id: 'triagem',
    name: 'Triagem',
    title: 'PRISMA-SP | Triagem',
    description: 'Ponto de entrada e cadastro clínico.',
    path: '/triagem',
    icon: ClipboardDocumentListIcon
  },
  {
    id: 'farmacia',
    name: 'Farmácia',
    title: 'PRISMA-SP | Farmácia',
    description: 'Gestão e dispensação de medicamentos.',
    path: '/farmacia',
    icon: PillsIcon
  },
  {
    id: 'psicologia',
    name: 'Psicologia',
    title: 'PRISMA-SP | Psicologia',
    description: 'Registro longitudinal de evolução mental.',
    path: '/psicologia',
    icon: BrainIcon
  },
  {
    id: 'vacinacao',
    name: 'Vacinação',
    title: 'PRISMA-SP | Vacinação',
    description: 'Controle imunológico e registro de doses.',
    path: '/vacinacao',
    icon: SyringeIcon
  },
  {
    id: 'indicadores',
    name: 'Indicadores',
    title: 'PRISMA-SP | Indicadores',
    description: 'Painéis analíticos baseados em metas SUS.',
    path: '/indicadores',
    icon: PresentationChartBarIcon
  },
  {
    id: 'mapacelas',
    name: 'Mapa de Celas',
    title: 'PRISMA-SP | Mapa de Celas',
    description: 'Localização de internos e ocupação.',
    path: '/mapa-celas',
    icon: MapIcon
  },
  {
    id: 'usuarios',
    name: 'Gestão de Usuários',
    title: 'PRISMA-SP | Gestão de Usuários',
    description: 'Controle de acesso seguro à plataforma.',
    path: '/usuarios',
    icon: UsersIcon
  }
];
