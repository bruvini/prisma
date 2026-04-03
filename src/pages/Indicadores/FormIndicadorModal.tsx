import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { 
  type FormDataIndicador, 
  Periodicidade, 
  PeriodicidadeLabel, 
  StatusIndicador, 
  StatusIndicadorLabel, 
  Polaridade, 
  PolaridadeLabel
} from './tipos';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faTimes, faSave } from '@fortawesome/free-solid-svg-icons';

interface Props {
  aberto: boolean;
  aoFechar: () => void;
  aoSalvar: (dados: FormDataIndicador) => Promise<void>;
  dadosIniciais?: FormDataIndicador;
  titulo: string;
}

const FORMULARIO_VAZIO: FormDataIndicador = {
  tituloResumido: '',
  tituloCompleto: '',
  palavrasChave: '',
  contextualizacaoIndicador: '',
  conceitosImportantes: [],
  objetivo: '',
  usoAplicabilidade: '',
  periodicidadeAtualizacao: Periodicidade.MENSAL,
  periodicidadeMonitoramento: Periodicidade.TRIMESTRAL,
  diaExtracaoDados: '',
  evento: '',
  periodoAcompanhamento: '',
  entradaAcompanhamento: '',
  interrupcoesAcompanhamento: [],
  boasPraticas: '',
  datasRelevantes: '',
  unidadeMedida: '',
  descritivoUnidadeMedida: '',
  statusIndicador: StatusIndicador.ATIVO,
  granularidade: '',
  polaridade: Polaridade.MAIOR_MELHOR,
  formulaCalculo: { numerador: '', denominador: '' },
  metodoCalculo: '',
  categoriasAnalise: [],
  fontesDados: [],
  interpretacaoEmSaude: '',
  anoReferencia: new Date().getFullYear(),
  indicadoresRelacionados: [],
  parametrosQualitativos: [
    { nivel: 'otimo', valor: '' },
    { nivel: 'bom', valor: '' },
    { nivel: 'suficiente', valor: '' },
    { nivel: 'regular', valor: '' }
  ],
  classificacaoGerencial: '',
  classificacaoDesempenho: '',
  limitacoes: '',
  responsabilidades: { gerencial: '', tecnica: '' },
  versao: '1.0'
};

const SECOES = [
  { num: 1, titulo: 'Contextualização' },
  { num: 2, titulo: 'Regularidade' },
  { num: 3, titulo: 'Escopo' },
  { num: 4, titulo: 'Procedimentos' },
  { num: 5, titulo: 'Análise' },
  { num: 6, titulo: 'Limitações' },
  { num: 7, titulo: 'Responsabilidades' },
];

export const FormIndicadorModal: React.FC<Props> = ({ aberto, aoFechar, aoSalvar, dadosIniciais, titulo }) => {
  const [formData, setFormData] = useState<FormDataIndicador>(FORMULARIO_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const secaoRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    if (dadosIniciais) setFormData({ ...FORMULARIO_VAZIO, ...dadosIniciais });
    else setFormData(FORMULARIO_VAZIO);
  }, [dadosIniciais, aberto]);

  if (!aberto) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      await aoSalvar(formData);
      aoFechar();
    } finally {
      setSalvando(false);
    }
  };

  const updateField = <K extends keyof FormDataIndicador>(field: K, value: FormDataIndicador[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateNested = (parent: 'formulaCalculo' | 'responsabilidades', field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value }
    }));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addItem = <K extends keyof FormDataIndicador>(field: K, defaultValue: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const current = (formData[field] as any[]) || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateField(field, [...current, defaultValue] as any);
  };

  const removeItem = (field: keyof FormDataIndicador, index: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const current = (formData[field] as any[]) || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateField(field, current.filter((_: any, i: number) => i !== index) as any);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateItem = (field: keyof FormDataIndicador, index: number, value: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const current = (formData[field] as any[]) || [];
    const updated = [...current];
    updated[index] = value;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateField(field, updated as any);
  };

  const scrollToSecao = (idx: number) => {
    const el = secaoRefs.current[idx];
    if (el && bodyRef.current) {
      const top = el.offsetTop - 16;
      bodyRef.current.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <div className="ind-modal-overlay">
      <div className="ind-modal">
        {/* Header */}
        <header className="ind-modal-header">
          <div className="ind-modal-header-text">
            <h2 className="ind-modal-title">{titulo}</h2>
            <span className="ind-modal-subtitle">Ficha metodológica completa · {SECOES.length} seções</span>
          </div>
          <button className="ind-modal-close" type="button" onClick={aoFechar} aria-label="Fechar">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </header>

        {/* Navegação rápida entre seções */}
        <nav className="ind-modal-nav" aria-label="Seções do formulário">
          {SECOES.map((s, idx) => (
            <button
              key={s.num}
              type="button"
              className="ind-modal-nav-item"
              onClick={() => scrollToSecao(idx)}
            >
              <span className="ind-modal-nav-num">{s.num}</span>
              <span>{s.titulo}</span>
            </button>
          ))}
        </nav>

        {/* Corpo com scroll */}
        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="ind-modal-body" ref={bodyRef}>

            {/* SEÇÃO 1 — Contextualização */}
            <section
              className="ind-section"
              ref={el => { secaoRefs.current[0] = el; }}
            >
              <div className="ind-section-header">
                <span className="ind-section-num">1</span>
                <h3 className="ind-section-title">Contextualização do Indicador</h3>
              </div>
              <div className="ind-section-body">
                <div className="ind-section-grid">
                  <div className="ind-field ind-full-width">
                    <label className="ind-label">Título Resumido *</label>
                    <input className="ind-input" value={formData.tituloResumido}
                      onChange={e => updateField('tituloResumido', e.target.value)} required
                      placeholder="Identificação curta do indicador" />
                  </div>
                  <div className="ind-field ind-full-width">
                    <label className="ind-label">Título Completo</label>
                    <input className="ind-input" value={formData.tituloCompleto}
                      onChange={e => updateField('tituloCompleto', e.target.value)}
                      placeholder="Descrição metodológica completa do indicador" />
                  </div>
                  <div className="ind-field ind-full-width">
                    <label className="ind-label">Palavras-chave</label>
                    <input className="ind-input" value={formData.palavrasChave}
                      onChange={e => updateField('palavrasChave', e.target.value)}
                      placeholder="Ex.: vacinação, cobertura, imunização" />
                  </div>
                  <div className="ind-field ind-full-width">
                    <label className="ind-label">Contextualização do Indicador</label>
                    <textarea className="ind-textarea" rows={4} value={formData.contextualizacaoIndicador}
                      onChange={e => updateField('contextualizacaoIndicador', e.target.value)}
                      placeholder="Descreva o contexto e a relevância deste indicador para a saúde prisional" />
                  </div>

                  <div className="ind-field ind-full-width">
                    <label className="ind-label">Conceitos Importantes</label>
                    <div className="ind-repeater">
                      {formData.conceitosImportantes.map((item, idx) => (
                        <div key={idx} className="ind-repeater-item">
                          <div className="ind-repeater-fields">
                            <input className="ind-input" placeholder="Nome do conceito"
                              value={item.nome}
                              onChange={e => updateItem('conceitosImportantes', idx, { ...item, nome: e.target.value })} />
                            <textarea className="ind-textarea" placeholder="Definição e importância do conceito"
                              rows={2} value={item.descricao}
                              onChange={e => updateItem('conceitosImportantes', idx, { ...item, descricao: e.target.value })} />
                          </div>
                          <button type="button" className="ind-btn-remove" onClick={() => removeItem('conceitosImportantes', idx)} title="Remover conceito">
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      ))}
                      <button type="button" className="ind-btn-add"
                        onClick={() => addItem('conceitosImportantes', { nome: '', descricao: '' })}>
                        <FontAwesomeIcon icon={faPlus} /> Adicionar Conceito
                      </button>
                    </div>
                  </div>

                  <div className="ind-field">
                    <label className="ind-label">Objetivo</label>
                    <textarea className="ind-textarea" rows={3} value={formData.objetivo}
                      onChange={e => updateField('objetivo', e.target.value)}
                      placeholder="Qual o objetivo central deste indicador?" />
                  </div>
                  <div className="ind-field">
                    <label className="ind-label">Uso e Aplicabilidade</label>
                    <textarea className="ind-textarea" rows={3} value={formData.usoAplicabilidade}
                      onChange={e => updateField('usoAplicabilidade', e.target.value)}
                      placeholder="Como e por quem este indicador será utilizado?" />
                  </div>
                </div>
              </div>
            </section>

            {/* SEÇÃO 2 — Regularidade */}
            <section
              className="ind-section"
              ref={el => { secaoRefs.current[1] = el; }}
            >
              <div className="ind-section-header">
                <span className="ind-section-num">2</span>
                <h3 className="ind-section-title">Regularidade do Indicador</h3>
              </div>
              <div className="ind-section-body">
                <div className="ind-section-grid">
                  <div className="ind-field">
                    <label className="ind-label">Periodicidade de Atualização</label>
                    <select className="ind-select" value={formData.periodicidadeAtualizacao}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      onChange={e => updateField('periodicidadeAtualizacao', e.target.value as any)}>
                      {Object.entries(PeriodicidadeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="ind-field">
                    <label className="ind-label">Periodicidade de Monitoramento</label>
                    <select className="ind-select" value={formData.periodicidadeMonitoramento}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      onChange={e => updateField('periodicidadeMonitoramento', e.target.value as any)}>
                      {Object.entries(PeriodicidadeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="ind-field">
                    <label className="ind-label">Dia de Extração dos Dados</label>
                    <input className="ind-input" value={formData.diaExtracaoDados}
                      onChange={e => updateField('diaExtracaoDados', e.target.value)}
                      placeholder="Ex: Dia 05 de cada mês" />
                  </div>
                </div>
              </div>
            </section>

            {/* SEÇÃO 3 — Escopo */}
            <section
              className="ind-section"
              ref={el => { secaoRefs.current[2] = el; }}
            >
              <div className="ind-section-header">
                <span className="ind-section-num">3</span>
                <h3 className="ind-section-title">Escopo da Base de Acompanhamento</h3>
              </div>
              <div className="ind-section-body">
                <div className="ind-section-grid">
                  <div className="ind-field">
                    <label className="ind-label">Evento</label>
                    <input className="ind-input" value={formData.evento}
                      onChange={e => updateField('evento', e.target.value)}
                      placeholder="Evento de saúde monitorado" />
                  </div>
                  <div className="ind-field">
                    <label className="ind-label">Período de Acompanhamento</label>
                    <input className="ind-input" value={formData.periodoAcompanhamento}
                      onChange={e => updateField('periodoAcompanhamento', e.target.value)}
                      placeholder="Ex: 12 meses" />
                  </div>
                  <div className="ind-field">
                    <label className="ind-label">Entrada no Acompanhamento</label>
                    <input className="ind-input" value={formData.entradaAcompanhamento}
                      onChange={e => updateField('entradaAcompanhamento', e.target.value)}
                      placeholder="Critério de inclusão na base" />
                  </div>
                  <div className="ind-field">
                    <label className="ind-label">Datas Relevantes</label>
                    <input className="ind-input" value={formData.datasRelevantes}
                      onChange={e => updateField('datasRelevantes', e.target.value)}
                      placeholder="Datas de referência para o cálculo" />
                  </div>

                  <div className="ind-field ind-full-width">
                    <label className="ind-label">Interrupções do Acompanhamento (Motivos)</label>
                    <div className="ind-repeater">
                      {formData.interrupcoesAcompanhamento.map((item, idx) => (
                        <div key={idx} className="ind-repeater-item">
                          <input className="ind-input ind-repeater-simple" placeholder="Descreva o motivo da interrupção"
                            value={item} onChange={e => updateItem('interrupcoesAcompanhamento', idx, e.target.value)} />
                          <button type="button" className="ind-btn-remove" onClick={() => removeItem('interrupcoesAcompanhamento', idx)} title="Remover">
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      ))}
                      <button type="button" className="ind-btn-add"
                        onClick={() => addItem('interrupcoesAcompanhamento', '')}>
                        <FontAwesomeIcon icon={faPlus} /> Adicionar Motivo
                      </button>
                    </div>
                  </div>

                  <div className="ind-field ind-full-width">
                    <label className="ind-label">Boas Práticas</label>
                    <textarea className="ind-textarea" rows={3} value={formData.boasPraticas}
                      onChange={e => updateField('boasPraticas', e.target.value)}
                      placeholder="Orientações de boas práticas para coleta e análise" />
                  </div>
                </div>
              </div>
            </section>

            {/* SEÇÃO 4 — Procedimentos */}
            <section
              className="ind-section"
              ref={el => { secaoRefs.current[3] = el; }}
            >
              <div className="ind-section-header">
                <span className="ind-section-num">4</span>
                <h3 className="ind-section-title">Procedimentos para o Desenvolvimento do Indicador</h3>
              </div>
              <div className="ind-section-body">
                <div className="ind-section-grid">
                  <div className="ind-field">
                    <label className="ind-label">Unidade de Medida</label>
                    <input className="ind-input" value={formData.unidadeMedida}
                      onChange={e => updateField('unidadeMedida', e.target.value)}
                      placeholder="Ex: %, Taxa por 100 mil" />
                  </div>
                  <div className="ind-field">
                    <label className="ind-label">Descritivo da Unidade de Medida</label>
                    <input className="ind-input" value={formData.descritivoUnidadeMedida}
                      onChange={e => updateField('descritivoUnidadeMedida', e.target.value)}
                      placeholder="Explicação sobre a unidade" />
                  </div>
                  <div className="ind-field">
                    <label className="ind-label">Status do Indicador</label>
                    <select className="ind-select" value={formData.statusIndicador}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      onChange={e => updateField('statusIndicador', e.target.value as any)}>
                      {Object.entries(StatusIndicadorLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="ind-field">
                    <label className="ind-label">Polaridade</label>
                    <select className="ind-select" value={formData.polaridade}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      onChange={e => updateField('polaridade', e.target.value as any)}>
                      {Object.entries(PolaridadeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="ind-field">
                    <label className="ind-label">Granularidade</label>
                    <input className="ind-input" value={formData.granularidade}
                      onChange={e => updateField('granularidade', e.target.value)}
                      placeholder="Ex: Unidade prisional, estadual" />
                  </div>
                  <div className="ind-field">
                    <label className="ind-label">Ano de Referência</label>
                    <input className="ind-input" type="number" value={formData.anoReferencia}
                      onChange={e => updateField('anoReferencia', parseInt(e.target.value) || new Date().getFullYear())} />
                  </div>

                  {/* Bloco de Fórmula */}
                  <div className="ind-field ind-full-width">
                    <label className="ind-label">Fórmula de Cálculo</label>
                    <div className="ind-formula-block">
                      <span className="ind-formula-label">Estrutura Metodológica</span>
                      <div className="ind-formula-grid">
                        <div className="ind-field">
                          <label className="ind-label">Numerador</label>
                          <input className="ind-input" value={formData.formulaCalculo.numerador}
                            onChange={e => updateNested('formulaCalculo', 'numerador', e.target.value)}
                            placeholder="Defina o numerador da fórmula" />
                        </div>
                        <div className="ind-formula-divider" title="Dividido por">÷</div>
                        <div className="ind-field">
                          <label className="ind-label">Denominador</label>
                          <input className="ind-input" value={formData.formulaCalculo.denominador}
                            onChange={e => updateNested('formulaCalculo', 'denominador', e.target.value)}
                            placeholder="Defina o denominador da fórmula" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="ind-field ind-full-width">
                    <label className="ind-label">Método de Cálculo</label>
                    <textarea className="ind-textarea" rows={3} value={formData.metodoCalculo}
                      onChange={e => updateField('metodoCalculo', e.target.value)}
                      placeholder="Descreva o passo a passo para o cálculo do indicador" />
                  </div>

                  <div className="ind-field">
                    <label className="ind-label">Categorias de Análise</label>
                    <div className="ind-repeater">
                      {formData.categoriasAnalise.map((item, idx) => (
                        <div key={idx} className="ind-repeater-item">
                          <input className="ind-input ind-repeater-simple" placeholder="Categoria de análise"
                            value={item} onChange={e => updateItem('categoriasAnalise', idx, e.target.value)} />
                          <button type="button" className="ind-btn-remove" onClick={() => removeItem('categoriasAnalise', idx)} title="Remover">
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      ))}
                      <button type="button" className="ind-btn-add" onClick={() => addItem('categoriasAnalise', '')}>
                        <FontAwesomeIcon icon={faPlus} /> Adicionar Categoria
                      </button>
                    </div>
                  </div>

                  <div className="ind-field">
                    <label className="ind-label">Fontes de Dados</label>
                    <div className="ind-repeater">
                      {formData.fontesDados.map((item, idx) => (
                        <div key={idx} className="ind-repeater-item">
                          <input className="ind-input ind-repeater-simple" placeholder="Ex: SINIS, e-SUS, SISDEPEN"
                            value={item} onChange={e => updateItem('fontesDados', idx, e.target.value)} />
                          <button type="button" className="ind-btn-remove" onClick={() => removeItem('fontesDados', idx)} title="Remover">
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      ))}
                      <button type="button" className="ind-btn-add" onClick={() => addItem('fontesDados', '')}>
                        <FontAwesomeIcon icon={faPlus} /> Adicionar Fonte
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SEÇÃO 5 — Análise */}
            <section
              className="ind-section"
              ref={el => { secaoRefs.current[4] = el; }}
            >
              <div className="ind-section-header">
                <span className="ind-section-num">5</span>
                <h3 className="ind-section-title">Análise do Indicador</h3>
              </div>
              <div className="ind-section-body">
                <div className="ind-section-grid">
                  <div className="ind-field ind-full-width">
                    <label className="ind-label">Interpretação em Saúde</label>
                    <textarea className="ind-textarea" rows={4} value={formData.interpretacaoEmSaude}
                      onChange={e => updateField('interpretacaoEmSaude', e.target.value)}
                      placeholder="O que o dado revela sobre a situação de saúde da população prisional?" />
                  </div>

                  <div className="ind-field">
                    <label className="ind-label">Classificação Gerencial</label>
                    <input className="ind-input" value={formData.classificacaoGerencial}
                      onChange={e => updateField('classificacaoGerencial', e.target.value)}
                      placeholder="Ex: Indicador estratégico, operacional" />
                  </div>
                  <div className="ind-field">
                    <label className="ind-label">Classificação de Desempenho</label>
                    <input className="ind-input" value={formData.classificacaoDesempenho}
                      onChange={e => updateField('classificacaoDesempenho', e.target.value)}
                      placeholder="Ex: Efetividade, Eficiência" />
                  </div>

                  <div className="ind-field ind-full-width">
                    <label className="ind-label">Parâmetros por Faixa Qualitativa</label>
                    <div className="ind-parametros-grid">
                      {formData.parametrosQualitativos.map((item, idx) => (
                        <div key={idx} className={`ind-param-card ind-param-card-${item.nivel}`}>
                          <span className={`ind-param-label ind-param-label-${item.nivel}`}>
                            {item.nivel.charAt(0).toUpperCase() + item.nivel.slice(1)}
                          </span>
                          <input className="ind-input" value={item.valor}
                            onChange={e => {
                              const updated = [...formData.parametrosQualitativos];
                              updated[idx] = { ...item, valor: e.target.value };
                              updateField('parametrosQualitativos', updated);
                            }}
                            placeholder="Valor ou faixa" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="ind-field ind-full-width">
                    <label className="ind-label">Indicadores Relacionados</label>
                    <div className="ind-repeater">
                      {formData.indicadoresRelacionados.map((item, idx) => (
                        <div key={idx} className="ind-repeater-item">
                          <input className="ind-input ind-repeater-simple" placeholder="Nome do indicador relacionado"
                            value={item} onChange={e => updateItem('indicadoresRelacionados', idx, e.target.value)} />
                          <button type="button" className="ind-btn-remove" onClick={() => removeItem('indicadoresRelacionados', idx)} title="Remover">
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      ))}
                      <button type="button" className="ind-btn-add"
                        onClick={() => addItem('indicadoresRelacionados', '')}>
                        <FontAwesomeIcon icon={faPlus} /> Adicionar Relacionado
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SEÇÃO 6 — Limitações */}
            <section
              className="ind-section"
              ref={el => { secaoRefs.current[5] = el; }}
            >
              <div className="ind-section-header">
                <span className="ind-section-num">6</span>
                <h3 className="ind-section-title">Limitações</h3>
              </div>
              <div className="ind-section-body">
                <div className="ind-field">
                  <label className="ind-label">Limitações do Indicador</label>
                  <textarea className="ind-textarea" rows={5} value={formData.limitacoes}
                    onChange={e => updateField('limitacoes', e.target.value)}
                    placeholder="Descreva as limitações metodológicas, de coleta ou análise deste indicador" />
                </div>
              </div>
            </section>

            {/* SEÇÃO 7 — Responsabilidades */}
            <section
              className="ind-section"
              ref={el => { secaoRefs.current[6] = el; }}
            >
              <div className="ind-section-header">
                <span className="ind-section-num">7</span>
                <h3 className="ind-section-title">Responsabilidades</h3>
              </div>
              <div className="ind-section-body">
                <div className="ind-section-grid">
                  <div className="ind-field">
                    <label className="ind-label">Responsabilidade Gerencial</label>
                    <input className="ind-input" value={formData.responsabilidades.gerencial}
                      onChange={e => updateNested('responsabilidades', 'gerencial', e.target.value)}
                      placeholder="Cargo ou setor responsável pela gestão" />
                  </div>
                  <div className="ind-field">
                    <label className="ind-label">Responsabilidade Técnica</label>
                    <input className="ind-input" value={formData.responsabilidades.tecnica}
                      onChange={e => updateNested('responsabilidades', 'tecnica', e.target.value)}
                      placeholder="Cargo ou profissional responsável pela coleta" />
                  </div>
                </div>
              </div>
            </section>

          </div>

          {/* Footer fixo */}
          <footer className="ind-modal-footer">
            <button type="button" className="ind-btn ind-btn-ghost" onClick={aoFechar} disabled={salvando}>
              Cancelar
            </button>
            <button type="submit" className="ind-btn ind-btn-primary" disabled={salvando}>
              {salvando
                ? <><span className="ind-spinner-sm" /> Salvando...</>
                : <><FontAwesomeIcon icon={faSave} /> Salvar Ficha Metodológica</>
              }
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};
