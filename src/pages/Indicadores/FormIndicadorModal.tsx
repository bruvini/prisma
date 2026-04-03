import type React from 'react';
import { useState, useEffect } from 'react';
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

export const FormIndicadorModal: React.FC<Props> = ({ aberto, aoFechar, aoSalvar, dadosIniciais, titulo }) => {
  const [formData, setFormData] = useState<FormDataIndicador>(FORMULARIO_VAZIO);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (dadosIniciais) setFormData(dadosIniciais);
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

  const updateField = (field: keyof FormDataIndicador, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedField = (parent: 'formulaCalculo' | 'responsabilidades', field: string, value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      [parent]: { ...prev[parent], [field]: value } 
    }));
  };

  // Funções para Repetíveis
  const addRepeaterItem = (field: keyof FormDataIndicador, defaultValue: any) => {
    const current = (formData[field] as any[]) || [];
    setFormData(prev => ({ ...prev, [field]: [...current, defaultValue] }));
  };

  const removeRepeaterItem = (field: keyof FormDataIndicador, index: number) => {
    const current = (formData[field] as any[]) || [];
    setFormData(prev => ({ ...prev, [field]: current.filter((_, i) => i !== index) }));
  };

  const updateRepeaterItem = (field: keyof FormDataIndicador, index: number, value: any) => {
    const current = (formData[field] as any[]) || [];
    const updated = [...current];
    updated[index] = value;
    setFormData(prev => ({ ...prev, [field]: updated }));
  };

  return (
    <div className="ind-modal-overlay">
      <div className="ind-modal">
        <header className="ind-modal-header">
          <h2>{titulo}</h2>
          <button className="ind-modal-close" onClick={aoFechar}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="ind-modal-body">
          {/* SEÇÃO 1 — Contextualização */}
          <section className="ind-section">
            <div className="ind-section-header">
              <span className="ind-section-title">SEÇÃO 1 — Contextualização do indicador</span>
            </div>
            <div className="ind-section-grid">
              <div className="ind-field ind-full-width">
                <label className="ind-label">Título Resumido</label>
                <input className="ind-input" value={formData.tituloResumido} onChange={e => updateField('tituloResumido', e.target.value)} required />
              </div>
              <div className="ind-field ind-full-width">
                <label className="ind-label">Título Completo</label>
                <input className="ind-input" value={formData.tituloCompleto} onChange={e => updateField('tituloCompleto', e.target.value)} required />
              </div>
              <div className="ind-field ind-full-width">
                <label className="ind-label">Palavras-chave (separadas por vírgula)</label>
                <input className="ind-input" value={formData.palavrasChave} onChange={e => updateField('palavrasChave', e.target.value)} />
              </div>
              <div className="ind-field ind-full-width">
                <label className="ind-label">Contextualização do Indicador</label>
                <textarea className="ind-textarea" value={formData.contextualizacaoIndicador} onChange={e => updateField('contextualizacaoIndicador', e.target.value)} />
              </div>
              
              <div className="ind-field ind-full-width">
                <label className="ind-label">Conceitos Importantes</label>
                <div className="ind-repeater">
                  {formData.conceitosImportantes.map((item, index) => (
                    <div key={index} className="ind-repeater-item">
                      <div className="ind-repeater-fields">
                        <input className="ind-input" placeholder="Nome do conceito" value={item.nome} onChange={e => {
                          const updated = [...formData.conceitosImportantes];
                          updated[index] = { ...item, nome: e.target.value };
                          updateField('conceitosImportantes', updated);
                        }} />
                        <textarea className="ind-textarea" placeholder="Descrição" value={item.descricao} onChange={e => {
                          const updated = [...formData.conceitosImportantes];
                          updated[index] = { ...item, descricao: e.target.value };
                          updateField('conceitosImportantes', updated);
                        }} />
                      </div>
                      <button type="button" className="ind-btn-remove" onClick={() => removeRepeaterItem('conceitosImportantes', index)}>
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  ))}
                  <button type="button" className="ind-btn-add" onClick={() => addRepeaterItem('conceitosImportantes', { nome: '', descricao: '' })}>
                    <FontAwesomeIcon icon={faPlus} /> Adicionar Conceito
                  </button>
                </div>
              </div>

              <div className="ind-field ind-full-width">
                <label className="ind-label">Objetivo</label>
                <textarea className="ind-textarea" value={formData.objetivo} onChange={e => updateField('objetivo', e.target.value)} />
              </div>
              <div className="ind-field ind-full-width">
                <label className="ind-label">Uso / Aplicabilidade</label>
                <textarea className="ind-textarea" value={formData.usoAplicabilidade} onChange={e => updateField('usoAplicabilidade', e.target.value)} />
              </div>
            </div>
          </section>

          {/* SEÇÃO 2 — Regularidade */}
          <section className="ind-section">
            <div className="ind-section-header">
              <span className="ind-section-title">SEÇÃO 2 — Regularidade do Indicador</span>
            </div>
            <div className="ind-section-grid">
              <div className="ind-field">
                <label className="ind-label">Periodicidade de Atualização</label>
                <select className="ind-select" value={formData.periodicidadeAtualizacao} onChange={e => updateField('periodicidadeAtualizacao', e.target.value)}>
                  {Object.entries(PeriodicidadeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="ind-field">
                <label className="ind-label">Periodicidade de Monitoramento</label>
                <select className="ind-select" value={formData.periodicidadeMonitoramento} onChange={e => updateField('periodicidadeMonitoramento', e.target.value)}>
                  {Object.entries(PeriodicidadeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="ind-field">
                <label className="ind-label">Dia de Extração dos Dados</label>
                <input className="ind-input" value={formData.diaExtracaoDados} onChange={e => updateField('diaExtracaoDados', e.target.value)} placeholder="Ex: Todo dia 05" />
              </div>
            </div>
          </section>

          {/* SEÇÃO 3 — Escopo */}
          <section className="ind-section">
            <div className="ind-section-header">
              <span className="ind-section-title">SEÇÃO 3 — Escopo da base de acompanhamento</span>
            </div>
            <div className="ind-section-grid">
              <div className="ind-field">
                <label className="ind-label">Evento</label>
                <input className="ind-input" value={formData.evento} onChange={e => updateField('evento', e.target.value)} />
              </div>
              <div className="ind-field">
                <label className="ind-label">Período de Acompanhamento</label>
                <input className="ind-input" value={formData.periodoAcompanhamento} onChange={e => updateField('periodoAcompanhamento', e.target.value)} />
              </div>
              <div className="ind-field">
                <label className="ind-label">Entrada no Acompanhamento</label>
                <input className="ind-input" value={formData.entradaAcompanhamento} onChange={e => updateField('entradaAcompanhamento', e.target.value)} />
              </div>
              <div className="ind-field">
                <label className="ind-label">Datas Relevantes</label>
                <input className="ind-input" value={formData.datasRelevantes} onChange={e => updateField('datasRelevantes', e.target.value)} />
              </div>
              
              <div className="ind-field ind-full-width">
                <label className="ind-label">Interrupções do Acompanhamento (Motivos)</label>
                <div className="ind-repeater">
                  {formData.interrupcoesAcompanhamento.map((item, index) => (
                    <div key={index} className="ind-repeater-item">
                      <input className="ind-input" style={{ flex: 1 }} value={item} onChange={e => updateRepeaterItem('interrupcoesAcompanhamento', index, e.target.value)} />
                      <button type="button" className="ind-btn-remove" onClick={() => removeRepeaterItem('interrupcoesAcompanhamento', index)}>
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  ))}
                  <button type="button" className="ind-btn-add" onClick={() => addRepeaterItem('interrupcoesAcompanhamento', '')}>
                    <FontAwesomeIcon icon={faPlus} /> Adicionar Motivo
                  </button>
                </div>
              </div>
              
              <div className="ind-field ind-full-width">
                <label className="ind-label">Boas Práticas</label>
                <textarea className="ind-textarea" value={formData.boasPraticas} onChange={e => updateField('boasPraticas', e.target.value)} />
              </div>
            </div>
          </section>

          {/* SEÇÃO 4 — Procedimentos */}
          <section className="ind-section">
            <div className="ind-section-header">
              <span className="ind-section-title">SEÇÃO 4 — Procedimentos para o desenvolvimento</span>
            </div>
            <div className="ind-section-grid">
              <div className="ind-field">
                <label className="ind-label">Unidade de Medida</label>
                <input className="ind-input" value={formData.unidadeMedida} onChange={e => updateField('unidadeMedida', e.target.value)} placeholder="Ex: % ou Taxa por 100 mil" />
              </div>
              <div className="ind-field">
                <label className="ind-label">Descritivo Unidade de Medida</label>
                <input className="ind-input" value={formData.descritivoUnidadeMedida} onChange={e => updateField('descritivoUnidadeMedida', e.target.value)} />
              </div>
              <div className="ind-field">
                <label className="ind-label">Status do Indicador</label>
                <select className="ind-select" value={formData.statusIndicador} onChange={e => updateField('statusIndicador', e.target.value)}>
                   {Object.entries(StatusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="ind-field">
                <label className="ind-label">Polaridade</label>
                <select className="ind-select" value={formData.polaridade} onChange={e => updateField('polaridade', e.target.value)}>
                   {Object.entries(PolaridadeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="ind-field">
                <label className="ind-label">Granularidade</label>
                <input className="ind-input" value={formData.granularidade} onChange={e => updateField('granularidade', e.target.value)} />
              </div>
              <div className="ind-field">
                <label className="ind-label">Ano de Referência</label>
                <input className="ind-input" type="number" value={formData.anoReferencia} onChange={e => updateField('anoReferencia', parseInt(e.target.value))} />
              </div>

              <div className="ind-field">
                <label className="ind-label">Fórmula: Numerador</label>
                <input className="ind-input" value={formData.formulaCalculo.numerador} onChange={e => updateNestedField('formulaCalculo', 'numerador', e.target.value)} />
              </div>
              <div className="ind-field">
                <label className="ind-label">Fórmula: Denominador</label>
                <input className="ind-input" value={formData.formulaCalculo.denominador} onChange={e => updateNestedField('formulaCalculo', 'denominador', e.target.value)} />
              </div>

              <div className="ind-field ind-full-width">
                <label className="ind-label">Método de Cálculo</label>
                <textarea className="ind-textarea" value={formData.metodoCalculo} onChange={e => updateField('metodoCalculo', e.target.value)} />
              </div>

              <div className="ind-field">
                <label className="ind-label">Categorias de Análise</label>
                <div className="ind-repeater">
                  {formData.categoriasAnalise.map((item, index) => (
                    <div key={index} className="ind-repeater-item">
                      <input className="ind-input" style={{ flex: 1 }} value={item} onChange={e => updateRepeaterItem('categoriasAnalise', index, e.target.value)} />
                      <button type="button" className="ind-btn-remove" onClick={() => removeRepeaterItem('categoriasAnalise', index)}>
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  ))}
                  <button type="button" className="ind-btn-add" onClick={() => addRepeaterItem('categoriasAnalise', '')}>
                    <FontAwesomeIcon icon={faPlus} /> Adicionar Categoria
                  </button>
                </div>
              </div>

              <div className="ind-field">
                <label className="ind-label">Fontes de Dados</label>
                <div className="ind-repeater">
                  {formData.fontesDados.map((item, index) => (
                    <div key={index} className="ind-repeater-item">
                      <input className="ind-input" style={{ flex: 1 }} value={item} onChange={e => updateRepeaterItem('fontesDados', index, e.target.value)} />
                      <button type="button" className="ind-btn-remove" onClick={() => removeRepeaterItem('fontesDados', index)}>
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  ))}
                  <button type="button" className="ind-btn-add" onClick={() => addRepeaterItem('fontesDados', '')}>
                    <FontAwesomeIcon icon={faPlus} /> Adicionar Fonte
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* SEÇÃO 5 — Análise */}
          <section className="ind-section">
            <div className="ind-section-header">
              <span className="ind-section-title">SEÇÃO 5 — Análise do indicador</span>
            </div>
            <div className="ind-section-grid">
              <div className="ind-field ind-full-width">
                <label className="ind-label">Interpretação em Saúde (O que o dado revela?)</label>
                <textarea className="ind-textarea" value={formData.interpretacaoEmSaude} onChange={e => updateField('interpretacaoEmSaude', e.target.value)} />
              </div>

              <div className="ind-field ind-full-width">
                <label className="ind-label">Parâmetros por Faixa Qualitativa</label>
                <div className="ind-repeater" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  {formData.parametrosQualitativos.map((item, index) => (
                    <div key={index} className="ind-field">
                      <label className="ind-label" style={{ textTransform: 'capitalize' }}>{item.nivel}</label>
                      <input className="ind-input" value={item.valor} onChange={e => {
                        const updated = [...formData.parametrosQualitativos];
                        updated[index] = { ...item, valor: e.target.value };
                        updateField('parametrosQualitativos', updated);
                      }} placeholder="Valor ou Faixa" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="ind-field">
                <label className="ind-label">Classificação Gerencial</label>
                <input className="ind-input" value={formData.classificacaoGerencial} onChange={e => updateField('classificacaoGerencial', e.target.value)} />
              </div>
              <div className="ind-field">
                <label className="ind-label">Classificação de Desempenho</label>
                <input className="ind-input" value={formData.classificacaoDesempenho} onChange={e => updateField('classificacaoDesempenho', e.target.value)} />
              </div>

              <div className="ind-field ind-full-width">
                <label className="ind-label">Indicadores Relacionados</label>
                <div className="ind-repeater">
                  {formData.indicadoresRelacionados.map((item, index) => (
                    <div key={index} className="ind-repeater-item">
                      <input className="ind-input" style={{ flex: 1 }} value={item} onChange={e => updateRepeaterItem('indicadoresRelacionados', index, e.target.value)} />
                      <button type="button" className="ind-btn-remove" onClick={() => removeRepeaterItem('indicadoresRelacionados', index)}>
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  ))}
                  <button type="button" className="ind-btn-add" onClick={() => addRepeaterItem('indicadoresRelacionados', '')}>
                    <FontAwesomeIcon icon={faPlus} /> Adicionar Relacionado
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* SEÇÃO 6 — Limitações */}
          <section className="ind-section">
            <div className="ind-section-header">
              <span className="ind-section-title">SEÇÃO 6 — Limitações</span>
            </div>
            <div className="ind-field ind-full-width">
              <label className="ind-label">Limitações do Indicador</label>
              <textarea className="ind-textarea" value={formData.limitacoes} onChange={e => updateField('limitacoes', e.target.value)} />
            </div>
          </section>

          {/* SEÇÃO 7 — Responsabilidades */}
          <section className="ind-section">
            <div className="ind-section-header">
              <span className="ind-section-title">SEÇÃO 7 — Responsabilidades</span>
            </div>
            <div className="ind-section-grid">
              <div className="ind-field">
                <label className="ind-label">Responsabilidade Gerencial</label>
                <input className="ind-input" value={formData.responsabilidades.gerencial} onChange={e => updateNestedField('responsabilidades', 'gerencial', e.target.value)} />
              </div>
              <div className="ind-field">
                <label className="ind-label">Responsabilidade Técnica</label>
                <input className="ind-input" value={formData.responsabilidades.tecnica} onChange={e => updateNestedField('responsabilidades', 'tecnica', e.target.value)} />
              </div>
            </div>
          </section>

          <footer className="ind-modal-footer">
            <button type="button" className="ind-btn ind-btn-ghost" onClick={aoFechar}>Cancelar</button>
            <button type="submit" className="ind-btn ind-btn-primary" disabled={salvando}>
              <FontAwesomeIcon icon={faSave} />
              {salvando ? 'Salvando...' : 'Salvar Indicador Metodológico'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

// Labels para Selects
const PeriodicidadeLabels = PeriodicidadeLabel;
const StatusLabels = StatusIndicadorLabel;
const PolaridadeLabels = PolaridadeLabel;
