import type React from 'react';
import { Card } from './Card';
import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import './Placeholder.css';

interface PlaceholderProps {
  title: string;
  description: string;
}

export const Placeholder: React.FC<PlaceholderProps> = ({ title, description }) => {
  return (
    <div className="placeholder-wrapper">
      <Card className="placeholder-card">
        <div className="placeholder-icon-container">
          <WrenchScrewdriverIcon className="placeholder-icon" />
        </div>
        <h2 className="placeholder-title">{title} - Em Construção</h2>
        <p className="placeholder-description">{description}</p>
        <div className="placeholder-badge">Módulo indisponível provisoriamente</div>
      </Card>
    </div>
  );
};
