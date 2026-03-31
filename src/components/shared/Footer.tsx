import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import './Footer.css';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-links">
          <a href="https://github.com/bruvini/prisma" target="_blank" rel="noreferrer" title="Repositório Institucional GitHub" className="footer-link-icon">
            <FontAwesomeIcon icon={faGithub} />
          </a>
          <span className="footer-separator">|</span>
          <a href="https://www.joinville.sc.gov.br/institucional/ses/das/dsu/ubsp/" target="_blank" rel="noreferrer" className="footer-link">
            SES.DSU.UBSP
          </a>
          <span className="footer-separator">|</span>
          <a href="https://www.sap.sc.gov.br/presidio-de-joinville/" target="_blank" rel="noreferrer" className="footer-link">
            SAP Presídio Regional
          </a>
        </div>

        <div className="footer-logos">
          <img src="/logo_governo_sc.jpg" alt="Governo de Santa Catarina" className="footer-logo logo-sc" />
          <img src="/logo_prefeitura_claro.png" alt="Prefeitura de Joinville" className="footer-logo logo-pmj" />
        </div>
        
        <div className="footer-info">
          <p className="footer-copyright">PRISMA-SP &copy; {currentYear}</p>
          <span className="footer-author">
            Desenvolvido por{' '}
            <a href="https://www.linkedin.com/in/enfbrunovinicius/" target="_blank" rel="noreferrer" className="footer-author-link">
              Enf. Bruno Vinícius
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
};
