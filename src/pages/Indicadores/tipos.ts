/**
 * Módulo de Indicadores — Domínio Metodológico (Português)
 * 
 * Este arquivo centraliza todas as interfaces e enums relacionados ao cadastro
 * completo de indicadores de saúde prisional do PRISMA-SP.
 */

// ---------------------------------------------------------------------------
// Tipos Auxiliares
// ---------------------------------------------------------------------------

export interface ConceitoImportante {
  nome: string;
  descricao: string;
}

export interface FormulaCalculo {
  numerador: string;
  denominador: string;
}

export interface ParametroQualitativo {
  nivel: 'otimo' | 'bom' | 'suficiente' | 'regular';
  valor: string; // Faixa ou valor correspondente
}

export interface Responsabilidades {
  gerencial: string;
  tecnica: string;
}

// ---------------------------------------------------------------------------
// Enums para Campos Controlados
// ---------------------------------------------------------------------------

export const Periodicidade = {
  DIARIA: 'DIARIA',
  SEMANAL: 'SEMANAL',
  QUINZENAL: 'QUINZENAL',
  MENSAL: 'MENSAL',
  BIMESTRAL: 'BIMESTRAL',
  TRIMESTRAL: 'TRIMESTRAL',
  QUADRIMESTRAL: 'QUADRIMESTRAL',
  SEMESTRAL: 'SEMESTRAL',
  ANUAL: 'ANUAL',
  FLUXO_CONTINUO: 'FLUXO_CONTINUO',
  OUTRA: 'OUTRA'
} as const;
export type Periodicidade = typeof Periodicidade[keyof typeof Periodicidade];

export const PeriodicidadeLabel: Record<Periodicidade, string> = {
  DIARIA: 'Diária',
  SEMANAL: 'Semanal',
  QUINZENAL: 'Quinzenal',
  MENSAL: 'Mensal',
  BIMESTRAL: 'Bimestral',
  TRIMESTRAL: 'Trimestral',
  QUADRIMESTRAL: 'Quadrimestral',
  SEMESTRAL: 'Semestral',
  ANUAL: 'Anual',
  FLUXO_CONTINUO: 'Fluxo Contínuo',
  OUTRA: 'Outra'
};

export const StatusIndicador = {
  ATIVO: 'ATIVO',
  EM_REVISAO: 'EM_REVISAO',
  DESCONTINUADO: 'DESCONTINUADO',
  PLANEJADO: 'PLANEJADO'
} as const;
export type StatusIndicador = typeof StatusIndicador[keyof typeof StatusIndicador];

export const StatusIndicadorLabel: Record<StatusIndicador, string> = {
  ATIVO: 'Ativo',
  EM_REVISAO: 'Em Revisão',
  DESCONTINUADO: 'Descontinuado',
  PLANEJADO: 'Planejado'
};

export const Polaridade = {
  MAIOR_MELHOR: 'MAIOR_MELHOR',
  MENOR_MELHOR: 'MENOR_MELHOR',
  DENTRO_FAIXA: 'DENTRO_FAIXA',
  NAO_APLICAVEL: 'NAO_APLICAVEL'
} as const;
export type Polaridade = typeof Polaridade[keyof typeof Polaridade];

export const PolaridadeLabel: Record<Polaridade, string> = {
  MAIOR_MELHOR: 'Quanto maior, melhor',
  MENOR_MELHOR: 'Quanto menor, melhor',
  DENTRO_FAIXA: 'Dentro da faixa esperada',
  NAO_APLICAVEL: 'Não aplicável'
};

// ---------------------------------------------------------------------------
// Modelo Principal — Indicador
// ---------------------------------------------------------------------------

export interface Indicador {
  id: string;
  
  // SEÇÃO 1 — Contextualização do indicador
  tituloResumido: string;
  tituloCompleto: string;
  palavrasChave: string; // Separadas por vírgula ou lista
  contextualizacaoIndicador: string;
  conceitosImportantes: ConceitoImportante[];
  objetivo: string;
  usoAplicabilidade: string;

  // SEÇÃO 2 — Regularidade do Indicador
  periodicidadeAtualizacao: Periodicidade;
  periodicidadeMonitoramento: Periodicidade;
  diaExtracaoDados: string;

  // SEÇÃO 3 — Escopo da base de dados de acompanhamento
  evento: string;
  periodoAcompanhamento: string;
  entradaAcompanhamento: string;
  interrupcoesAcompanhamento: string[]; // Múltiplos motivos
  boasPraticas: string;
  datasRelevantes: string;

  // SEÇÃO 4 — Procedimentos para o desenvolvimento do indicador
  unidadeMedida: string;
  descritivoUnidadeMedida: string;
  statusIndicador: StatusIndicador;
  granularidade: string;
  polaridade: Polaridade;
  formulaCalculo: FormulaCalculo;
  metodoCalculo: string;
  categoriasAnalise: string[];
  fontesDados: string[];

  // SEÇÃO 5 — Análise do indicador
  interpretacaoEmSaude: string;
  anoReferencia: number;
  indicadoresRelacionados: string[];
  parametrosQualitativos: ParametroQualitativo[];
  classificacaoGerencial: string;
  classificacaoDesempenho: string;

  // SEÇÃO 6 — Limitações
  limitacoes: string;

  // SEÇÃO 7 — Responsabilidades
  responsabilidades: Responsabilidades;

  // Metadados Adicionais (conforme sugestão)
  origemNormativa?: string;
  versao: string;
  
  // Controle de Estado e Auditoria
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
  criadoPor: string;
  atualizadoPor: string;
}

// Payload para criação/edição
export type FormDataIndicador = Omit<
  Indicador,
  | 'id'
  | 'ativo'
  | 'criadoEm'
  | 'atualizadoEm'
  | 'criadoPor'
  | 'atualizadoPor'
>;
