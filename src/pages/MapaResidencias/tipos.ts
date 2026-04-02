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
  CELA_ESPECIAL:      'CELA_ESPECIAL',
  CELA:               'CELA',
  ALOJAMENTO_INTERNO: 'ALOJAMENTO_INTERNO',
  ADAPTACAO:          'ADAPTACAO',
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
  CELA_ESPECIAL:      'Cela Especial',
  CELA:               'Cela',
  ALOJAMENTO_INTERNO: 'Alojamento Interno',
  ADAPTACAO:          'Adaptação',
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
>;

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
