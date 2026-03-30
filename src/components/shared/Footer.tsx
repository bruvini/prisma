import type React from 'react';
import './Footer.css';

export const Footer: React.FC = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-links">
          <a href="https://github.com/bruvini/prisma" target="_blank" rel="noreferrer" className="footer-link">
            Repositório Institucional GitHub
          </a>
          <a href="https://www.joinville.sc.gov.br/institucional/ses/das/dsu/ubsp/" target="_blank" rel="noreferrer" className="footer-link">
            Página da UBSP
          </a>
          <a href="https://www.sap.sc.gov.br/presidio-de-joinville/" target="_blank" rel="noreferrer" className="footer-link">
            SAP Presídio Regional
          </a>
        </div>

        <div className="footer-logos">
          <img src="/logo_governo_sc.jpg" alt="Governo de Santa Catarina" className="footer-logo logo-sc" />
          <img src="/logo_prefeitura_claro.png" alt="Prefeitura de Joinville" className="footer-logo logo-pmj" />
        </div>
        
        <div className="footer-info">
          <p className="footer-copyright"><strong>PRISMA-SP</strong> &copy; {new Date().getFullYear()}</p>
          <span className="footer-details">
            Desenvolvido por{' '}
            <a href="https://www.linkedin.com/in/enfbrunovinicius/" target="_blank" rel="noreferrer" className="footer-author-link">
              Enf. Bruno Vinícius
            </a>
            <div className="footer-release-tag">Release: {new Date().toLocaleDateString('pt-BR')} </div>
          </span>
        </div>
      </div>
    </footer>
  );
};
