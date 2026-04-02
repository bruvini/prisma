/**
 * Mapa de Residências — Domínio Central (Português)
 *
 * Mapeamento de Terminologia PRISMA x IPEN:
 * - PRISMA: ALA                 | IPEN: ALA
 * - PRISMA: Pavilhão            | IPEN: Galeria
 * - PRISMA: Galeria             | IPEN: Bloco
 * - PRISMA: Piso                | IPEN: Piso
 * - PRISMA: Tipo de Residência  | IPEN: Tipo Residência
 * - PRISMA: Residência          | IPEN: Residência
 * - PRISMA: Capacidade          | IPEN: Capacidade
 * - PRISMA: Regime              | IPEN: Regime
 *
 * Nota técnica: O projeto usa erasableSyntaxOnly=true no tsconfig,
 * logo os enums são implementados como objetos const + union types.
 */

// ---------------------------------------------------------------------------
// Ala
// ---------------------------------------------------------------------------
export const Ala = {
  MASCULINA: 'MASCULINA',
  FEMININA:  'FEMININA',
  NAO_INFORMADA: 'NAO_INFORMADA',
} as const;
export type Ala = typeof Ala[keyof typeof Ala];

// ---------------------------------------------------------------------------
// TipoResidencia
// ---------------------------------------------------------------------------
export const TipoResidencia = {
  SEGURO:             'SEGURO',
  TRIAGEM:            'TRIAGEM',
  TRIAGEM_PNE:        'TRIAGEM_PNE',
  CELA_ESPECIAL:      'CELA_ESPECIAL',
  CELA:               'CELA',
  ALOJAMENTO_INTERNO: 'ALOJAMENTO_INTERNO',
  ADAPTACAO:          'ADAPTACAO',
  LGBT:               'LGBT',
  PRISAO_CIVIL:       'PRISAO_CIVIL',
} as const;
export type TipoResidencia = typeof TipoResidencia[keyof typeof TipoResidencia];

// ---------------------------------------------------------------------------
// Regime
// ---------------------------------------------------------------------------
export const Regime = {
  NAO_INFORMADO: 'NAO_INFORMADO',
  PROVISORIO:    'PROVISORIO',
  FECHADO:       'FECHADO',
} as const;
export type Regime = typeof Regime[keyof typeof Regime];

// ---------------------------------------------------------------------------
// Mapeamento de Rótulos (UI Humana)
// ---------------------------------------------------------------------------
export const AlaLabel: Record<Ala, string> = {
  MASCULINA: 'Masculina',
  FEMININA:  'Feminina',
  NAO_INFORMADA: 'Não Informada',
};

export const TipoResidenciaLabel: Record<TipoResidencia, string> = {
  SEGURO:             'Seguro',
  TRIAGEM:            'Triagem',
  TRIAGEM_PNE:        'Triagem PNE',
  CELA_ESPECIAL:      'Cela Especial',
  CELA:               'Cela',
  ALOJAMENTO_INTERNO: 'Alojamento Interno',
  ADAPTACAO:          'Adaptação',
  LGBT:               'LGBT',
  PRISAO_CIVIL:       'Prisão Civil',
};

export const RegimeLabel: Record<Regime, string> = {
  NAO_INFORMADO: 'Não Informado',
  PROVISORIO:    'Provisório',
  FECHADO:       'Fechado',
};

// ---------------------------------------------------------------------------
// Modelo de Dados — Estrutura física de residência
// ---------------------------------------------------------------------------

/**
 * Documento Firestore na coleção `residencias`.
 *
 * chaveUnica: `${ala}__${pavilhao}__${galeria}__${piso}__${numeroResidencia}`
 * rotuloExibicao: ex.: "Pav. A / Gal. 1 / Piso T / Res. 01"
 */
export interface Residencia {
  id: string;

  // Hierarquia física (Terminologia PRISMA)
  ala: Ala;
  pavilhao: string;        // IPEN Corresponde a: Galeria
  galeria: string;         // IPEN Corresponde a: Bloco
  piso: string;            // IPEN Corresponde a: Piso

  // Identificação
  tipoResidencia: TipoResidencia;
  numeroResidencia: string;
  capacidade: number;      // Capacidade total
  regime: Regime;

  // Metadados de busca e organização
  chaveUnica: string;      // Identificador lógico único para evitar duplicados
  rotuloExibicao: string;  // String amigável formatada
  chaveOrdenacao: string;  // Geralmente igual à chaveUnica

  // Controle de estado
  ativo: boolean;          // Para soft delete

  // Auditoria
  criadoEm: Date;
  atualizadoEm: Date;
  criadoPor: string;
  atualizadoPor: string;
  inativadoEm?: Date;
  
  // Metadados para Cadastro Automático via Sincronizador
  cadastroProvisorio?: boolean;
  pendenteRevisao?: boolean;
  origemCadastro?: 'RELATORIO_IPEN_1_8' | 'MANUAL';
  criadoViaSincronizador?: boolean;
  quantidadeInternosDetectados?: number;
}

// Payload para criação/edição (omite campos gerados pelo backend/serviço)
export type FormDataResidencia = Omit<
  Residencia,
  | 'id' 
  | 'chaveUnica' 
  | 'rotuloExibicao' 
  | 'chaveOrdenacao' 
  | 'ativo' 
  | 'criadoEm' 
  | 'atualizadoEm' 
  | 'criadoPor' 
  | 'atualizadoPor' 
  | 'inativadoEm'
  | 'cadastroProvisorio'
  | 'pendenteRevisao'
  | 'origemCadastro'
  | 'criadoViaSincronizador'
  | 'quantidadeInternosDetectados'
>;

// ---------------------------------------------------------------------------
// Novas Entidades para Sincronização e Operação
// ---------------------------------------------------------------------------

/**
 * Representa a pessoa custodiada.
 * Coleção: `internos`
 * Unicidade: `prontuario`
 */
export interface Interno {
  id: string;
  prontuario: string;       // Chave de negócio (I-PEN)
  nomeCompleto: string;
  situacaoAtual: string;    // Texto original do I-PEN
  statusSistema: 'ATIVO' | 'INATIVO';
  
  // Referências de localização atual
  detencaoAtualId: string | null;
  residenciaAtualId: string | null;
  
  // Datas do período atual
  dataEntradaAtual: Date | null;
  dataSaidaAtual: Date | null;

  // Auditoria
  criadoEm: Date;
  atualizadoEm: Date;
  criadoPor: string;
}

/**
 * Ciclo de vida de uma passagem pelo sistema.
 * Coleção: `detencoes`
 */
export interface Detencao {
  id: string;
  internoId: string;
  numeroDetencao: number;   // 1, 2, 3...
  status: 'ATIVA' | 'ENCERRADA';
  iniciadaEm: Date;
  encerradaEm: Date | null;
  
  // Metadados da origem (ex.: Sincronização 1.8)
  origem: string;
  snapshotSituacaoInicial: string;

  criadoEm: Date;
}

/**
 * Histórico de trocas de residência dentro de uma detenção.
 * Coleção: `movimentacoes`
 */
export interface Movimentacao {
  id: string;
  internoId: string;
  detencaoId: string;
  ordemNaDetencao: number;
  
  residenciaOrigemId: string | null; // null se for entrada inicial
  residenciaDestinoId: string | null; // null se for saída/inativação
  
  tipoMovimentacao: 'ENTRADA' | 'MOVIMENTACAO_INTERNA' | 'SAIDA' | 'REATIVACAO';
  origemSincronizacao: boolean;
  situacaoIpenOriginal: string;
  
  registradaEm: Date;
  criadoPor: string;
}

/**
 * Link ativo entre interno e residência.
 * Coleção: `ocupacoesAtuais`
 */
export interface OcupacaoAtual {
  id: string;
  internoId: string;
  residenciaId: string;
  detencaoId: string;
  iniciadaEm: Date;
  ativa: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Gera a chave única de negócio */
export function gerarChaveUnica(dados: FormDataResidencia): string {
  return [
    dados.ala,
    dados.pavilhao.trim().toUpperCase(),
    dados.galeria.trim().toUpperCase(),
    dados.piso.trim().toUpperCase(),
    dados.numeroResidencia.trim().toUpperCase(),
  ].join('__');
}

/** Gera o rótulo de exibição formatado */
export function gerarRotuloExibicao(dados: FormDataResidencia): string {
  return `Pav. ${dados.pavilhao} / Gal. ${dados.galeria} / Piso ${dados.piso} / Res. ${dados.numeroResidencia}`;
}
