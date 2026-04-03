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
  faChartColumn,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import './Indicadores.css';

// ---------------------------------------------------------------------------
// Modal de Confirmação de Inativação
// ---------------------------------------------------------------------------

interface ConfirmModalProps {
  indicador: Indicador | null;
  confirmando: boolean;
  aoConfirmar: () => void;
  aoCancelar: () => void;
}

const ModalConfirmacaoInativacao: React.FC<ConfirmModalProps> = ({ 
  indicador, 
  confirmando, 
  aoConfirmar, 
  aoCancelar 
}) => {
  if (!indicador) return null;

  return (
    <div className="ind-modal-overlay" style={{ zIndex: 1100 }}>
      <div className="ind-confirm-modal">
        <div className="ind-confirm-header">
          <span className="ind-confirm-icon">
            <FontAwesomeIcon icon={faExclamationTriangle} />
          </span>
          <h3 className="ind-confirm-title">Inativar Indicador</h3>
        </div>
        <div className="ind-confirm-body">
          <p>
            Deseja inativar o indicador{' '}
            <span className="ind-confirm-name">"{indicador.tituloResumido}"</span>?
          </p>
          <div className="ind-confirm-hint">
            Esta ação realiza uma exclusão lógica. O indicador ficará inativo e não aparecerá
            na listagem, mas seus dados permanecerão no sistema para fins de rastreabilidade.
          </div>
        </div>
        <div className="ind-confirm-footer">
          <button
            type="button"
            className="ind-btn ind-btn-ghost"
            onClick={aoCancelar}
            disabled={confirmando}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="ind-btn ind-btn-danger-solid"
            onClick={aoConfirmar}
            disabled={confirmando}
          >
            {confirmando ? 'Inativando...' : 'Confirmar Inativação'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Página Principal do Módulo
// ---------------------------------------------------------------------------

export const Indicadores: React.FC = () => {
  const { addToast } = useToast();

  const [indicadores, setIndicadores] = useState<Indicador[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState('');

  // Modal de CRUD
  const [modalAberto, setModalAberto] = useState(false);
  const [indicadorEdicao, setIndicadorEdicao] = useState<Indicador | null>(null);

  // Modal de confirmação de inativação
  const [alvoInativacao, setAlvoInativacao] = useState<Indicador | null>(null);
  const [inativando, setInativando] = useState(false);

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    try {
      const lista = await listarIndicadores();
      setIndicadores(lista);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        addToast('Indicador cadastrado com sucesso.', 'success');
      }
      carregarDados();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (erro: any) {
      addToast(erro.message || 'Erro ao salvar indicador.', 'error');
      throw erro;
    }
  };

  const handleConfirmarInativacao = async () => {
    if (!alvoInativacao) return;
    setInativando(true);
    try {
      await inativarIndicador(alvoInativacao.id);
      addToast('Indicador inativado com sucesso.', 'success');
      setAlvoInativacao(null);
      carregarDados();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (erro: any) {
      addToast(erro.message || 'Erro ao inativar indicador.', 'error');
    } finally {
      setInativando(false);
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
    const termo = filtro.toLowerCase().trim();
    if (!termo) return indicadores;
    return indicadores.filter(i =>
      i.tituloResumido.toLowerCase().includes(termo) ||
      i.tituloCompleto.toLowerCase().includes(termo) ||
      i.palavrasChave.toLowerCase().includes(termo) ||
      (i.responsabilidades?.tecnica || '').toLowerCase().includes(termo)
    );
  }, [indicadores, filtro]);

  const totalAtivos = indicadores.filter(i => i.statusIndicador === 'ATIVO').length;
  const totalPlanejados = indicadores.filter(i => i.statusIndicador === 'PLANEJADO').length;

  return (
    <div className="ind-page">
      {/* Header */}
      <header className="ind-page-header">
        <div className="ind-page-header-text">
          <h1 className="ind-page-title">Módulo de Indicadores</h1>
          <p className="ind-page-subtitle">
            Cadastro metodológico e monitoramento de desempenho em saúde prisional.
          </p>
        </div>
        <div className="ind-page-actions">
          <button className="ind-btn ind-btn-primary" onClick={abrirNovo}>
            <FontAwesomeIcon icon={faPlus} /> Novo Indicador
          </button>
        </div>
      </header>

      {/* Dashboard de Resumo */}
      <section className="ind-dashboard">
        <div className="ind-tile">
          <span className="ind-tile-label">Total de Indicadores</span>
          <span className="ind-tile-value">{indicadores.length}</span>
        </div>
        <div className="ind-tile">
          <span className="ind-tile-label">Em Operação (Ativos)</span>
          <span className="ind-tile-value">{totalAtivos}</span>
        </div>
        <div className="ind-tile">
          <span className="ind-tile-label">Em Planejamento</span>
          <span className="ind-tile-value">{totalPlanejados}</span>
        </div>
      </section>

      {/* Filtros */}
      <section className="ind-filters">
        <div className="ind-filters-row">
          <div className="ind-search-wrapper">
            <span className="ind-search-icon">
              <FontAwesomeIcon icon={faSearch} />
            </span>
            <input
              className="ind-input ind-search-input"
              placeholder="Buscar por título, palavras-chave ou responsável técnico..."
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
            />
          </div>
          {filtro && (
            <button className="ind-btn ind-btn-ghost" onClick={() => setFiltro('')}>
              Limpar
            </button>
          )}
        </div>
      </section>

      {/* Listagem */}
      <section className="ind-list-container">
        {carregando ? (
          <div className="ind-loading-state">
            <span className="ind-spinner" />
            <p>Carregando indicadores...</p>
          </div>
        ) : indicadoresFiltrados.length === 0 ? (
          <div className="ind-empty-state">
            <FontAwesomeIcon icon={faChartColumn} className="ind-empty-icon" />
            <p>
              {indicadores.length === 0
                ? 'Nenhum indicador cadastrado. Clique em "Novo Indicador" para começar.'
                : 'Nenhum indicador encontrado para o filtro atual.'}
            </p>
          </div>
        ) : (
          <div className="ind-table-wrapper">
            <table className="ind-table">
              <thead>
                <tr>
                  <th>Indicador</th>
                  <th>Status</th>
                  <th>Periodicidade</th>
                  <th>Ano Ref.</th>
                  <th>Responsável Técnico</th>
                  <th className="ind-th-actions">Ações</th>
                </tr>
              </thead>
              <tbody>
                {indicadoresFiltrados.map(ind => (
                  <tr key={ind.id}>
                    <td>
                      <div className="ind-row-title">
                        <span className="ind-title-main">{ind.tituloResumido}</span>
                        <span className="ind-title-sub" title={ind.tituloCompleto}>
                          {ind.tituloCompleto}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`ind-badge ind-badge-${ind.statusIndicador.toLowerCase().replace('_', '')}`}>
                        {StatusIndicadorLabel[ind.statusIndicador]}
                      </span>
                    </td>
                    <td>
                      <span className="ind-periodicidade-text">
                        {PeriodicidadeLabel[ind.periodicidadeAtualizacao]}
                      </span>
                    </td>
                    <td>
                      <span className="ind-ano-ref">{ind.anoReferencia}</span>
                    </td>
                    <td>
                      <div className="ind-responsavel-col">
                        <span className="ind-responsavel-nome">
                          {ind.responsabilidades?.tecnica || '—'}
                        </span>
                        {ind.responsabilidades?.tecnica && (
                          <span className="ind-responsavel-tipo">Técnica</span>
                        )}
                      </div>
                    </td>
                    <td className="ind-td-actions">
                      <div className="ind-td-actions-inner">
                        <button
                          className="ind-btn ind-btn-ghost ind-btn-sm"
                          onClick={() => abrirEdicao(ind)}
                          title="Editar indicador"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          className="ind-btn ind-btn-danger ind-btn-sm"
                          onClick={() => setAlvoInativacao(ind)}
                          title="Inativar indicador"
                        >
                          <FontAwesomeIcon icon={faTrashAlt} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal de CRUD */}
      <FormIndicadorModal
        aberto={modalAberto}
        aoFechar={() => setModalAberto(false)}
        aoSalvar={handleSalvar}
        dadosIniciais={indicadorEdicao ?? undefined}
        titulo={indicadorEdicao ? 'Editar Indicador Metodológico' : 'Novo Cadastro de Indicador'}
      />

      {/* Modal de Confirmação de Inativação */}
      <ModalConfirmacaoInativacao
        indicador={alvoInativacao}
        confirmando={inativando}
        aoConfirmar={handleConfirmarInativacao}
        aoCancelar={() => setAlvoInativacao(null)}
      />
    </div>
  );
};
