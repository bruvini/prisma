import type React from 'react';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  buscarVisaoOperacional,
  cadastrarResidencia,
  atualizarResidencia,
  inativarResidencia,
} from './servicoResidencias';
import {
  Ala,
  AlaLabel,
  TipoResidencia,
  TipoResidenciaLabel,
  Regime,
  RegimeLabel,
} from './tipos';
import type { Residencia, FormDataResidencia, OcupacaoAtual, Interno } from './tipos';
import { SincronizadorIpen } from './SincronizadorIpen';
import { GestaoResidenciasModal } from './GestaoResidenciasModal';
import './MapaResidencias.css';

// ---------------------------------------------------------------------------
// Configurações e Tipos
// ---------------------------------------------------------------------------

const FORMULARIO_VAZIO: FormDataResidencia = {
  ala: Ala.MASCULINA,
  pavilhao: '',
  galeria: '',
  piso: '',
  tipoResidencia: TipoResidencia.CELA,
  numeroResidencia: '',
  capacidade: 0,
  regime: Regime.NAO_INFORMADO,
};

interface EstadoFiltros {
  ala: string;
  pavilhao: string;
  galeria: string;
  tipoResidencia: string;
  nome: string;
  prontuario: string;
  situacao: string;
}

const FILTROS_VAZIOS: EstadoFiltros = {
  ala: '',
  pavilhao: '',
  galeria: '',
  tipoResidencia: '',
  nome: '',
  prontuario: '',
  situacao: '',
};

// ---------------------------------------------------------------------------
// Helpers de Cálculo
// ---------------------------------------------------------------------------

type TipoCalculo = 'normal' | 'sem_capacidade' | 'capacidade_parcial';

interface OcupacaoInfo {
  capacidade: number;
  ocupados: number;
  perc: number;
  tipoCalculo: TipoCalculo;
  textoExibicao: string;
  requerRevisao: boolean;
  statusVisual: 'normal' | 'atencao' | 'alerta' | 'vazio';
}

function calcularOcupacao(residencias: (Residencia & { internos: Interno[] })[]): OcupacaoInfo {
  const capacidadeTotal = residencias.reduce((acc, r) => acc + (r.capacidade || 0), 0);
  const ocupados = residencias.reduce((acc, r) => acc + (r.internos?.length || 0), 0);
  const perc = capacidadeTotal > 0 ? Math.round((ocupados / capacidadeTotal) * 100) : 0;

  const capValidas = residencias.filter(r => (r.capacidade || 0) > 0);
  const capZeradas = residencias.filter(r => !r.capacidade || r.capacidade === 0);

  if (capValidas.length === 0) {
    if (ocupados === 0) {
      return { capacidade: 0, ocupados: 0, perc: 0, tipoCalculo: 'sem_capacidade', textoExibicao: "Capacidade não cadastrada", requerRevisao: true, statusVisual: 'vazio' };
    } else {
      return { capacidade: 0, ocupados, perc: 100, tipoCalculo: 'sem_capacidade', textoExibicao: `${ocupados} alocados · capacidade pendente`, requerRevisao: true, statusVisual: 'alerta' };
    }
  }

  if (capZeradas.length > 0) {
    return { capacidade: capacidadeTotal, ocupados, perc, tipoCalculo: 'capacidade_parcial', textoExibicao: `${ocupados}/${capacidadeTotal} (${perc}%) · Cap. parcial`, requerRevisao: true, statusVisual: perc >= 100 ? 'alerta' : perc >= 90 ? 'atencao' : 'normal' };
  }

  return { capacidade: capacidadeTotal, ocupados, perc, tipoCalculo: 'normal', textoExibicao: `${ocupados}/${capacidadeTotal} — ${perc}%`, requerRevisao: false, statusVisual: perc >= 100 ? 'alerta' : perc >= 90 ? 'atencao' : 'normal' };
}

const getTagClass = (status: OcupacaoInfo['statusVisual']) => {
  if (status === 'alerta') return 'mr-ocup-over';
  if (status === 'atencao') return 'mr-ocup-at';
  if (status === 'vazio') return 'mr-ocup-vazio';
  return 'mr-ocup-under';
};

// ---------------------------------------------------------------------------
// Componente Principal: Mapa de Residências
// ---------------------------------------------------------------------------

export const MapaResidencias: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  // Dados do Banco
  const [data, setData] = useState<{
    residencias: Residencia[];
    ocupacoes: OcupacaoAtual[];
    internos: Interno[];
  }>({ residencias: [], ocupacoes: [], internos: [] });

  const [carregando, setCarregando] = useState(true);
  const [filtros, setFiltros] = useState<EstadoFiltros>(FILTROS_VAZIOS);

  // Estados de Modais
  const [gestaoAberta, setGestaoAberta] = useState(false);
  const [sincronizadorAberto, setSincronizadorAberto] = useState(false);

  // Estados de CRUD
  const [formAberto, setFormAberto] = useState(false);
  const [idEdicao, setIdEdicao] = useState<string | null>(null);
  const [formulario, setFormulario] = useState<FormDataResidencia>(FORMULARIO_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [alvoExclusao, setAlvoExclusao] = useState<Residencia | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  // Estado de UI (Mapa) — accordion exclusivo: string única "pav__gal"
  const [galeriaAtiva, setGaleriaAtiva] = useState<string | null>(null);
  const [residenciaAtiva, setResidenciaAtiva] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Carregamento de Dados
  // ---------------------------------------------------------------------------

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    try {
      const snapshot = await buscarVisaoOperacional();
      setData(snapshot as any);
    } catch (erro: any) {
      addToast(erro.message || 'Erro ao carregar dados do mapa.', 'error');
    } finally {
      setCarregando(false);
    }
  }, [addToast]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // ---------------------------------------------------------------------------
  // Agrupamento e Filtragem
  // ---------------------------------------------------------------------------

  const visaoProcessada = useMemo(() => {
    const { residencias, ocupacoes, internos } = data;

    // Mapeia ocupantes por residência
    const ocupantesPorRes = new Map<string, Interno[]>();
    ocupacoes.forEach(oc => {
      const interno = internos.find(i => i.id === oc.internoId);
      if (interno && oc.residenciaId) {
        const lista = ocupantesPorRes.get(oc.residenciaId) || [];
        lista.push(interno);
        ocupantesPorRes.set(oc.residenciaId, lista);
      }
    });

    // Resolve pesquisa de internos
    const temFiltroInterno = filtros.nome || filtros.prontuario || filtros.situacao;
    const nomeLower  = filtros.nome.toLowerCase();
    const prontLower = filtros.prontuario.toLowerCase();
    const situLower  = filtros.situacao.toLowerCase();

    // Filtra residências e, se houver filtro de interno, mantém apenas residências com match
    const filtradas = residencias.filter(r => {
      if (filtros.ala           && r.ala !== filtros.ala) return false;
      if (filtros.pavilhao      && !r.pavilhao.toLowerCase().includes(filtros.pavilhao.toLowerCase())) return false;
      if (filtros.galeria       && !r.galeria.toLowerCase().includes(filtros.galeria.toLowerCase())) return false;
      if (filtros.tipoResidencia && r.tipoResidencia !== filtros.tipoResidencia) return false;

      if (temFiltroInterno) {
        const ocupantes = ocupantesPorRes.get(r.id) || [];
        return ocupantes.some(int => {
          if (nomeLower  && !int.nomeCompleto.toLowerCase().includes(nomeLower))  return false;
          if (prontLower && !int.prontuario.toLowerCase().includes(prontLower))   return false;
          if (situLower  && !int.situacaoAtual.toLowerCase().includes(situLower)) return false;
          return true;
        });
      }

      return true;
    });

    // Ao filtrar por interno, só mostra os internos que batem
    const ocupantesFiltrados = (resId: string): Interno[] => {
      const todos = ocupantesPorRes.get(resId) || [];
      if (!temFiltroInterno) return todos;
      return todos.filter(int => {
        if (nomeLower  && !int.nomeCompleto.toLowerCase().includes(nomeLower))  return false;
        if (prontLower && !int.prontuario.toLowerCase().includes(prontLower))   return false;
        if (situLower  && !int.situacaoAtual.toLowerCase().includes(situLower)) return false;
        return true;
      });
    };

    // Agrupamento hierárquico: Pavilhão > Galeria > Tipo
    const hierarquia: Record<string, {
      nome: string;
      galerias: Record<string, {
        nome: string;
        tipos: Record<string, {
          nome: string;
          residencias: (Residencia & { internos: Interno[] })[];
        }>;
      }>;
    }> = {};

    filtradas.forEach(res => {
      const pav  = res.pavilhao || 'SEM_PAVILHAO';
      const gal  = res.galeria  || 'SEM_GALERIA';
      const tipo = res.tipoResidencia;

      if (!hierarquia[pav]) hierarquia[pav] = { nome: pav, galerias: {} };
      if (!hierarquia[pav].galerias[gal]) hierarquia[pav].galerias[gal] = { nome: gal, tipos: {} };
      if (!hierarquia[pav].galerias[gal].tipos[tipo]) hierarquia[pav].galerias[gal].tipos[tipo] = { nome: tipo, residencias: [] };

      hierarquia[pav].galerias[gal].tipos[tipo].residencias.push({
        ...res,
        internos: ocupantesFiltrados(res.id),
      });
    });

    // Indicadores gerais (sempre sobre o total global, não sobre filtrados)
    const metrics = {
      totalResidencias: residencias.length,
      totalOcupadas:    Array.from(ocupantesPorRes.keys()).length,
      totalSuperlotadas: residencias.filter(r =>
        (ocupantesPorRes.get(r.id)?.length || 0) > r.capacidade && r.capacidade > 0
      ).length,
      totalProvisorias: residencias.filter(r => r.cadastroProvisorio).length,
      totalSemCapacidade: residencias.filter(r => !r.capacidade || r.capacidade === 0).length,
      totalInternos:    internos.length,
    };

    return { hierarquia, metrics };
  }, [data, filtros]);

  // ---------------------------------------------------------------------------
  // Ações de UI
  // ---------------------------------------------------------------------------

  // Accordion exclusivo: só uma galeria aberta de cada vez
  const alternarGaleria = (pav: string, gal: string) => {
    const chave = `${pav}__${gal}`;
    setGaleriaAtiva(prev => (prev === chave ? null : chave));
    setResidenciaAtiva(null); // fecha residência ao trocar de galeria
  };

  // ---------------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------------

  const abrirModalNovo = () => {
    setFormulario(FORMULARIO_VAZIO);
    setIdEdicao(null);
    setFormAberto(true);
  };

  const abrirModalEdicao = (r: Residencia) => {
    setFormulario({
      ala: r.ala, pavilhao: r.pavilhao, galeria: r.galeria, piso: r.piso,
      tipoResidencia: r.tipoResidencia, numeroResidencia: r.numeroResidencia,
      capacidade: r.capacidade, regime: r.regime,
    });
    setIdEdicao(r.id);
    setFormAberto(true);
  };

  const manipularSubmissao = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      if (idEdicao) await atualizarResidencia(idEdicao, formulario, user?.uid || 'dev');
      else          await cadastrarResidencia(formulario, user?.uid || 'dev');
      addToast('Residência salva com sucesso.', 'success');
      setFormAberto(false);
      carregarDados();
    } catch (erro: any) {
      addToast(erro.message, 'error');
    } finally {
      setSalvando(false);
    }
  };

  const confirmarExclusao = async () => {
    if (!alvoExclusao) return;
    setExcluindo(true);
    try {
      await inativarResidencia(alvoExclusao.id, user?.uid || 'dev');
      addToast('Residência excluída.', 'success');
      setAlvoExclusao(null);
      carregarDados();
    } catch (erro: any) {
      addToast(erro.message, 'error');
    } finally {
      setExcluindo(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Seção: Dashboard (Tiles compactos)
  // ---------------------------------------------------------------------------

  const renderizarDashboard = () => (
    <div className="mr-dashboard">
      <div className="mr-tile">
        <span className="mr-tile-label">Total Residências</span>
        <span className="mr-tile-value">{visaoProcessada.metrics.totalResidencias}</span>
      </div>
      <div className="mr-tile">
        <span className="mr-tile-label">Residências Ocupadas</span>
        <span className="mr-tile-value">{visaoProcessada.metrics.totalOcupadas}</span>
      </div>
      <div className={`mr-tile ${visaoProcessada.metrics.totalSuperlotadas > 0 ? 'mr-tile-danger' : ''}`}>
        <span className="mr-tile-label">Superlotadas</span>
        <span className="mr-tile-value">{visaoProcessada.metrics.totalSuperlotadas}</span>
      </div>
      <div className={`mr-tile ${visaoProcessada.metrics.totalProvisorias > 0 ? 'mr-tile-warning' : ''}`}>
        <span className="mr-tile-label">Provisórias</span>
        <span className="mr-tile-value">{visaoProcessada.metrics.totalProvisorias}</span>
      </div>
      <div className={`mr-tile ${visaoProcessada.metrics.totalSemCapacidade > 0 ? 'mr-tile-danger' : ''}`}>
        <span className="mr-tile-label">Cap. Pendente</span>
        <span className="mr-tile-value">{visaoProcessada.metrics.totalSemCapacidade}</span>
      </div>
      <div className="mr-tile">
        <span className="mr-tile-label">Internos Ativos</span>
        <span className="mr-tile-value">{visaoProcessada.metrics.totalInternos}</span>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Seção: Filtros Operacionais
  // ---------------------------------------------------------------------------

  const renderizarFiltros = () => {
    const temFiltro = Object.values(filtros).some(Boolean);
    return (
      <div className="mr-filters mr-filters-operacional">
        {/* Linha 1: filtros estruturais */}
        <div className="mr-filters-row">
          <select
            className="mr-select mr-filter-select"
            value={filtros.ala}
            onChange={e => setFiltros(f => ({ ...f, ala: e.target.value }))}
          >
            <option value="">Todas as Alas</option>
            {Object.values(Ala).map(v => (
              <option key={v} value={v}>{AlaLabel[v]}</option>
            ))}
          </select>

          <input
            className="mr-input mr-filter-input"
            placeholder="Pavilhão..."
            value={filtros.pavilhao}
            onChange={e => setFiltros(f => ({ ...f, pavilhao: e.target.value }))}
          />

          <input
            className="mr-input mr-filter-input"
            placeholder="Galeria..."
            value={filtros.galeria}
            onChange={e => setFiltros(f => ({ ...f, galeria: e.target.value }))}
          />

          <select
            className="mr-select mr-filter-select"
            value={filtros.tipoResidencia}
            onChange={e => setFiltros(f => ({ ...f, tipoResidencia: e.target.value }))}
          >
            <option value="">Todos os Tipos</option>
            {Object.values(TipoResidencia).map(v => (
              <option key={v} value={v}>{TipoResidenciaLabel[v]}</option>
            ))}
          </select>
        </div>

        {/* Linha 2: filtros de interno */}
        <div className="mr-filters-row">
          <input
            className="mr-input mr-filter-input mr-filter-input-lg"
            placeholder="Nome do detento..."
            value={filtros.nome}
            onChange={e => setFiltros(f => ({ ...f, nome: e.target.value }))}
          />
          <input
            className="mr-input mr-filter-input"
            placeholder="Prontuário..."
            value={filtros.prontuario}
            onChange={e => setFiltros(f => ({ ...f, prontuario: e.target.value }))}
          />
          <input
            className="mr-input mr-filter-input"
            placeholder="Situação..."
            value={filtros.situacao}
            onChange={e => setFiltros(f => ({ ...f, situacao: e.target.value }))}
          />
          {temFiltro && (
            <button
              className="mr-btn mr-btn-ghost mr-btn-sm"
              onClick={() => setFiltros(FILTROS_VAZIOS)}
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Seção: Mapa Hierárquico
  // ---------------------------------------------------------------------------

  const renderizarMapa = () => {
    if (carregando) return (
      <div className="mr-loading-state">
        <span className="mr-spinner" />
        <p>Construindo visão operacional do mapa...</p>
      </div>
    );

    const pavilions = Object.values(visaoProcessada.hierarquia);
    if (pavilions.length === 0) return (
      <div className="mr-empty-state">
        <p>Nenhuma residência corresponde aos filtros operacionais ativos.</p>
      </div>
    );

    return (
      <div className="mr-map-container">
        {pavilions.map((pav) => {
          // Agrega métricas do pavilhão
          const todasResPav = Object.values(pav.galerias)
            .flatMap(g => Object.values(g.tipos).flatMap(t => t.residencias));
          const ocupPav = calcularOcupacao(todasResPav);

          return (
            <div key={pav.nome} className="mr-pavilhao-card">
              <div className="mr-pavilhao-header">
                <div className="mr-pavilhao-header-info">
                  <h3 className="mr-pavilhao-title">Pavilhão {pav.nome}</h3>
                  <span className="mr-pavilhao-badge">
                    {Object.keys(pav.galerias).length} {Object.keys(pav.galerias).length === 1 ? 'Galeria' : 'Galerias'}
                  </span>
                </div>
                <div className="mr-pavilhao-ocupacao">
                  <span className={`mr-ocup-tag ${getTagClass(ocupPav.statusVisual)}`}>
                    {ocupPav.textoExibicao}
                  </span>
                </div>
              </div>

              <div className="mr-pavilhao-content">
                {Object.values(pav.galerias).map((gal) => {
                  const chaveGal = `${pav.nome}__${gal.nome}`;
                  const expandida = galeriaAtiva === chaveGal;

                  // Agrega métricas da galeria
                  const todasResGal = Object.values(gal.tipos).flatMap(t => t.residencias);
                  const ocupGal = calcularOcupacao(todasResGal);

                  return (
                    <div key={gal.nome} className="mr-galeria-group">
                      <div
                        className="mr-galeria-header"
                        onClick={() => alternarGaleria(pav.nome, gal.nome)}
                      >
                        <span className="mr-galeria-title">
                          <span
                            className="mr-galeria-chevron"
                            style={{ transform: expandida ? 'rotate(90deg)' : 'none' }}
                          >▶</span>
                          Galeria {gal.nome}
                        </span>
                        <div className="mr-galeria-summary-row">
                          <span className="mr-galeria-summary">
                            {todasResGal.length} unidades
                          </span>
                          <span className={`mr-ocup-tag mr-ocup-tag-sm ${getTagClass(ocupGal.statusVisual)}`}>
                            {ocupGal.textoExibicao}
                          </span>
                        </div>
                      </div>

                      {expandida && (
                        <div className="mr-galeria-content">
                          {Object.values(gal.tipos).map((tipo) => (
                            <div key={tipo.nome} className="mr-tipo-section">
                              <h4 className="mr-tipo-title">
                                {TipoResidenciaLabel[tipo.nome as TipoResidencia]}
                              </h4>

                              {/* Grid híbrido: cards normais em múltiplas colunas;
                                  card expandido ocupa linha inteira via grid-column span */}
                              <div className="mr-residencia-grid">
                                {tipo.residencias.map((res) => {
                                  const ocupRes = calcularOcupacao([res]);
                                  const passAlert = ocupRes.statusVisual === 'alerta' ? 'mr-occupancy-over' :
                                                    ocupRes.statusVisual === 'atencao' ? 'mr-occupancy-at' :
                                                    ocupRes.statusVisual === 'vazio' ? 'mr-occupancy-vazio' : 'mr-occupancy-under';
                                  const ativa = residenciaAtiva === res.id;

                                  return (
                                    <div
                                      key={res.id}
                                      className={`mr-res-card ${ativa ? 'mr-res-card-active mr-res-card-expanded' : ''} ${passAlert}`}
                                      onClick={e => {
                                        e.stopPropagation();
                                        setResidenciaAtiva(ativa ? null : res.id);
                                      }}
                                    >
                                      <div className="mr-res-header">
                                        <span className="mr-res-number">{res.numeroResidencia}</span>
                                        <div className="mr-res-badges">
                                          {res.cadastroProvisorio && (
                                            <span className="mr-badge-mini mr-badge-provisoria">Provisória</span>
                                          )}
                                          {(res.pendenteRevisao || ocupRes.requerRevisao) && (
                                            <span className="mr-badge-mini mr-badge-revisao" title="Necessita revisão de cadastro">
                                              {ocupRes.tipoCalculo === 'sem_capacidade' ? 'Revisar Capacidade' : 'Revisar Estrutural'}
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      <div className="mr-res-info">
                                        <div className="mr-res-occupancy">
                                          <div className={`mr-res-meter ${ocupRes.tipoCalculo === 'sem_capacidade' ? 'mr-res-meter-alerta' : ''}`}>
                                            <div
                                              className={`mr-res-meter-bar ${ocupRes.tipoCalculo === 'sem_capacidade' ? 'mr-res-meter-bar-striped' : ''}`}
                                              style={{ width: `${Math.min(ocupRes.perc, 100)}%` }}
                                            />
                                          </div>
                                          {ocupRes.tipoCalculo === 'sem_capacidade' && ocupRes.ocupados > 0 ? (
                                            <span className="mr-res-percent" style={{ opacity: 0.5 }}>--</span>
                                          ) : (
                                            <span className="mr-res-percent">{ocupRes.perc}%</span>
                                          )}
                                        </div>
                                        <div className="mr-res-stats">
                                          {ocupRes.tipoCalculo === 'sem_capacidade' ? (
                                            <span className="mr-res-stat-destaque" title="Capacidade não informada">
                                              {ocupRes.ocupados > 0 ? `${ocupRes.ocupados} alocados` : 'Cap. Não Cadastrada'}
                                            </span>
                                          ) : (
                                            <>
                                              <span>Cap: {ocupRes.capacidade}</span>
                                              <span>Ocup: {ocupRes.ocupados}</span>
                                            </>
                                          )}
                                        </div>
                                      </div>

                                      {ativa && (
                                        <div
                                          className="mr-res-internos"
                                          onClick={e => e.stopPropagation()}
                                        >
                                          <div className="mr-internos-list">
                                            {res.internos.map(int => (
                                              <div key={int.id} className="mr-interno-item">
                                                <span className="mr-interno-pront">{int.prontuario}</span>
                                                <span className="mr-interno-nome" title={int.nomeCompleto}>
                                                  {int.nomeCompleto}
                                                </span>
                                                <span className="mr-interno-situ">{int.situacaoAtual}</span>
                                              </div>
                                            ))}
                                            {res.internos.length === 0 && (
                                              <span
                                                className="mr-interno-situ"
                                                style={{ textAlign: 'center', opacity: 0.5 }}
                                              >
                                                Sem internos alocados
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Modal de Criação / Edição
  // ---------------------------------------------------------------------------

  const renderizarModalForm = () => {
    if (!formAberto) return null;
    return (
      <div className="mr-overlay" style={{ zIndex: 1100 }}>
        <div className="mr-modal" style={{ maxWidth: '600px' }}>
          <div className="mr-modal-header">
            <h3>{idEdicao ? 'Editar' : 'Nova'} Residência</h3>
            <button onClick={() => setFormAberto(false)} className="mr-modal-close">&times;</button>
          </div>
          <form className="mr-modal-form" onSubmit={manipularSubmissao}>
            <div className="mr-form-grid">
              <div className="mr-field">
                <label className="mr-label">Ala</label>
                <select className="mr-select" value={formulario.ala}
                  onChange={e => setFormulario({ ...formulario, ala: e.target.value as Ala })}>
                  {Object.values(Ala).map(v => <option key={v} value={v}>{AlaLabel[v]}</option>)}
                </select>
              </div>
              <div className="mr-field">
                <label className="mr-label">Pavilhão</label>
                <input className="mr-input" value={formulario.pavilhao}
                  onChange={e => setFormulario({ ...formulario, pavilhao: e.target.value })} required />
              </div>
              <div className="mr-field">
                <label className="mr-label">Galeria</label>
                <input className="mr-input" value={formulario.galeria}
                  onChange={e => setFormulario({ ...formulario, galeria: e.target.value })} required />
              </div>
              <div className="mr-field">
                <label className="mr-label">Piso</label>
                <input className="mr-input" value={formulario.piso}
                  onChange={e => setFormulario({ ...formulario, piso: e.target.value })} required />
              </div>
              <div className="mr-field">
                <label className="mr-label">Tipo</label>
                <select className="mr-select" value={formulario.tipoResidencia}
                  onChange={e => setFormulario({ ...formulario, tipoResidencia: e.target.value as TipoResidencia })}>
                  {Object.values(TipoResidencia).map(v =>
                    <option key={v} value={v}>{TipoResidenciaLabel[v]}</option>)}
                </select>
              </div>
              <div className="mr-field">
                <label className="mr-label">Número</label>
                <input className="mr-input" value={formulario.numeroResidencia}
                  onChange={e => setFormulario({ ...formulario, numeroResidencia: e.target.value })} required />
              </div>
              <div className="mr-field">
                <label className="mr-label">Capacidade</label>
                <input className="mr-input" type="number" value={formulario.capacidade}
                  onChange={e => setFormulario({ ...formulario, capacidade: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="mr-field">
                <label className="mr-label">Regime</label>
                <select className="mr-select" value={formulario.regime}
                  onChange={e => setFormulario({ ...formulario, regime: e.target.value as Regime })}>
                  {Object.values(Regime).map(v => <option key={v} value={v}>{RegimeLabel[v]}</option>)}
                </select>
              </div>
            </div>
            <div className="mr-modal-footer">
              <button type="button" className="mr-btn mr-btn-ghost"
                onClick={() => setFormAberto(false)}>Cancelar</button>
              <button type="submit" className="mr-btn mr-btn-primary" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderizarModalExclusao = () => {
    if (!alvoExclusao) return null;
    return (
      <div className="mr-overlay" style={{ zIndex: 1200 }}>
        <div className="mr-modal mr-modal-sm">
          <div className="mr-modal-header"><h3>Excluir Residência</h3></div>
          <div className="mr-delete-body">
            <p>Deseja excluir permanentemente a residência <strong>{alvoExclusao.numeroResidencia}</strong>?</p>
          </div>
          <div className="mr-modal-footer">
            <button className="mr-btn mr-btn-ghost" onClick={() => setAlvoExclusao(null)}>Cancelar</button>
            <button className="mr-btn mr-btn-danger" onClick={confirmarExclusao} disabled={excluindo}>
              {excluindo ? 'Excluindo...' : 'Excluir'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Renderização Final
  // ---------------------------------------------------------------------------

  return (
    <div className="mr-page">
      <div className="mr-page-header">
        <div className="mr-page-header-text">
          <h1 className="mr-page-title">Mapa de Residências</h1>
          <p className="mr-page-subtitle">Mapa operacional de ocupação assistencial e gestão de estrutura.</p>
        </div>
        <div className="mr-page-actions">
          {user?.email === 'admin@prisma.com' && (
            <>
              <button className="mr-btn mr-btn-ghost"
                onClick={() => setSincronizadorAberto(true)}>
                Sincronizar I-PEN
              </button>
              <button className="mr-btn mr-btn-primary"
                onClick={() => setGestaoAberta(true)}>
                Gestão de Residências
              </button>
            </>
          )}
        </div>
      </div>

      {renderizarDashboard()}
      {renderizarFiltros()}
      {renderizarMapa()}

      <GestaoResidenciasModal
        aberto={gestaoAberta}
        aoFechar={() => setGestaoAberta(false)}
        residencias={data.residencias}
        filtros={filtros}
        setFiltros={setFiltros}
        abrirModalNovo={abrirModalNovo}
        abrirModalEdicao={abrirModalEdicao}
        setAlvoExclusao={setAlvoExclusao}
      />

      <SincronizadorIpen
        aberto={sincronizadorAberto}
        aoFechar={() => setSincronizadorAberto(false)}
        aoConcluir={carregarDados}
      />

      {renderizarModalForm()}
      {renderizarModalExclusao()}
    </div>
  );
};
