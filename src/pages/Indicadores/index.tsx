import type React from 'react';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { 
  listarIndicadores, 
  criarIndicador, 
  atualizarIndicador, 
  inativarIndicador 
} from './servicoIndicadores';
import { 
  type Indicador, 
  type FormDataIndicador, 
  StatusIndicadorLabel,
  PeriodicidadeLabel
} from './tipos';
import { FormIndicadorModal } from './FormIndicadorModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faSearch, 
  faEdit, 
  faTrashAlt, 
  faChartPie
} from '@fortawesome/free-solid-svg-icons';
import './Indicadores.css';

export const Indicadores: React.FC = () => {
  const { addToast } = useToast();

  const [indicadores, setIndicadores] = useState<Indicador[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState('');
  
  // Modal de CRUD
  const [modalAberto, setModalAberto] = useState(false);
  const [indicadorEdicao, setIndicadorEdicao] = useState<Indicador | null>(null);

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    try {
      const lista = await listarIndicadores();
      setIndicadores(lista);
    } catch (erro: any) {
      addToast(erro.message || 'Erro ao carregar indicadores.', 'error');
    } finally {
      setCarregando(false);
    }
  }, [addToast]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handleSalvar = async (dados: FormDataIndicador) => {
    try {
      if (indicadorEdicao) {
        await atualizarIndicador(indicadorEdicao.id, dados);
        addToast('Indicador atualizado com sucesso.', 'success');
      } else {
        await criarIndicador(dados);
        addToast('Novo indicador cadastrado com sucesso.', 'success');
      }
      carregarDados();
    } catch (erro: any) {
      addToast(erro.message, 'error');
      throw erro;
    }
  };

  const handleInativar = async (id: string, titulo: string) => {
    if (!window.confirm(`Deseja realmente inativar o indicador "${titulo}"?`)) return;
    
    try {
      await inativarIndicador(id);
      addToast('Indicador inativado com sucesso.', 'success');
      carregarDados();
    } catch (erro: any) {
      addToast(erro.message, 'error');
    }
  };

  const abrirNovo = () => {
    setIndicadorEdicao(null);
    setModalAberto(true);
  };

  const abrirEdicao = (ind: Indicador) => {
    setIndicadorEdicao(ind);
    setModalAberto(true);
  };

  const indicadoresFiltrados = useMemo(() => {
    return indicadores.filter(i => 
      i.tituloResumido.toLowerCase().includes(filtro.toLowerCase()) ||
      i.tituloCompleto.toLowerCase().includes(filtro.toLowerCase()) ||
      i.palavrasChave.toLowerCase().includes(filtro.toLowerCase())
    );
  }, [indicadores, filtro]);

  return (
    <div className="ind-page">
      <header className="ind-page-header">
        <div className="ind-page-header-text">
          <h1 className="ind-page-title">Módulo de Indicadores</h1>
          <p className="ind-page-subtitle">Gestão metodológica e monitoramento de desempenho em saúde prisional.</p>
        </div>
        <button className="ind-btn ind-btn-primary" onClick={abrirNovo}>
          <FontAwesomeIcon icon={faPlus} /> Novo Indicador
        </button>
      </header>

      <section className="ind-dashboard">
        <div className="ind-tile">
          <span className="ind-tile-label">Indicadores Cadastrados</span>
          <span className="ind-tile-value">{indicadores.length}</span>
        </div>
        <div className="ind-tile">
          <span className="ind-tile-label">Em Operação (Ativos)</span>
          <span className="ind-tile-value">{indicadores.filter(i => i.statusIndicador === 'ATIVO').length}</span>
        </div>
        <div className="ind-tile">
          <span className="ind-tile-label">Média de Ano Ref.</span>
          <span className="ind-tile-value">
            {indicadores.length > 0 
              ? Math.round(indicadores.reduce((acc, i) => acc + (i.anoReferencia || 0), 0) / indicadores.length) 
              : '-'}
          </span>
        </div>
      </section>

      <section className="ind-filters">
        <div className="ind-filters-row">
          <div className="ind-field" style={{ flex: 1 }}>
            <div style={{ position: 'relative' }}>
              <FontAwesomeIcon icon={faSearch} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', opacity: 0.5 }} />
              <input 
                className="ind-input" 
                style={{ paddingLeft: '2.5rem', width: '100%' }}
                placeholder="Buscar por título, descrição ou palavras-chave..." 
                value={filtro}
                onChange={e => setFiltro(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="ind-list-container">
        {carregando ? (
          <div className="ind-empty-state">
            <span className="mr-spinner" />
            <p>Carregando indicadores...</p>
          </div>
        ) : indicadoresFiltrados.length === 0 ? (
          <div className="ind-empty-state">
            <FontAwesomeIcon icon={faChartPie} className="ind-empty-icon" />
            <p>{indicadores.length === 0 ? 'Nenhum indicador cadastrado.' : 'Nenhum resultado para a busca.'}</p>
          </div>
        ) : (
          <table className="ind-table">
            <thead>
              <tr>
                <th>Indicador</th>
                <th>Status</th>
                <th>Periodicidade</th>
                <th>Ano Ref.</th>
                <th>Responsável</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {indicadoresFiltrados.map(ind => (
                <tr key={ind.id}>
                  <td>
                    <div className="ind-row-title">
                      <span className="ind-title-main">{ind.tituloResumido}</span>
                      <span className="ind-title-sub" title={ind.tituloCompleto}>{ind.tituloCompleto}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`ind-badge ind-badge-status-${ind.statusIndicador.toLowerCase()}`}>
                      {StatusIndicadorLabel[ind.statusIndicador]}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {PeriodicidadeLabel[ind.periodicidadeAtualizacao]}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{ind.anoReferencia}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: 'var(--text-primary)' }}>{ind.responsabilidades.tecnica || 'N/A'}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.65rem' }}>Técnica</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button className="ind-btn ind-btn-ghost ind-btn-sm" onClick={() => abrirEdicao(ind)} title="Editar">
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button className="ind-btn ind-btn-danger ind-btn-sm" onClick={() => handleInativar(ind.id, ind.tituloResumido)} title="Inativar">
                        <FontAwesomeIcon icon={faTrashAlt} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <FormIndicadorModal 
        aberto={modalAberto}
        aoFechar={() => setModalAberto(false)}
        aoSalvar={handleSalvar}
        dadosIniciais={indicadorEdicao || undefined}
        titulo={indicadorEdicao ? 'Editar Indicador Metodológico' : 'Novo Cadastro de Indicador'}
      />
    </div>
  );
};
