/**
 * Mapa de Residências — Domínio Central
 *
 * Fonte primária de enums, labels e tipos do módulo.
 * Nota: o campo "Pavilhão" corresponde ao que o operacional histórico chama de "Bloco".
 * O sistema adota "Pavilhão" como nomenclatura de produto.
 *
 * Nota técnica: O projeto usa erasableSyntaxOnly=true no tsconfig,
 * portanto os enums são implementados como const objects + union types.
 */

// ---------------------------------------------------------------------------
// Ala
// ---------------------------------------------------------------------------

export const Ala = {
  MASCULINA: 'MASCULINA',
  FEMININA:  'FEMININA',
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
// Label maps (UI → humano)
// ---------------------------------------------------------------------------

export const AlaLabel: Record<Ala, string> = {
  MASCULINA: 'Masculina',
  FEMININA:  'Feminina',
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
// Data model — Estrutura física de residência
// ---------------------------------------------------------------------------

/**
 * Documento Firestore na coleção `residences`.
 *
 * uniqueKey: chave composta de negócio = `${ala}__${pavilion}__${gallery}__${floor}__${residenceNumber}`
 * Garante unicidade lógica e permite consultas por hierarquia sem índices compostos extras.
 *
 * Coleções futuras planejadas (não implementadas nesta fase):
 *   - `residence_assignments`: vínculo de interno → residência (id, residenceId, patientId,
 *      status, startedAt, endedAt, snapshot da hierarquia física)
 */
export interface Residence {
  id: string;

  // Hierarquia física
  ala: Ala;
  pavilion: string;   // produto: "Pavilhão" | origem operacional: "Bloco"
  gallery: string;    // produto: "Galeria"
  floor: string;      // produto: "Piso"

  // Identificação
  residenceType: TipoResidencia;
  residenceNumber: string; // armazenado como string para fidelidade de exibição
  capacity: number;
  regime: Regime;

  // Chaves auxiliares para consulta e ordenação
  uniqueKey: string;    // chave composta de negócio
  displayLabel: string; // ex.: "Pav. A / Gal. 1 / Piso T / Res. 04"
  sortKey: string;      // para ordenação natural: igual ao uniqueKey

  // Estado
  active: boolean;

  // Auditoria
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  inactivatedAt?: Date;
}

// Payload para criação/edição (sem campos gerados automaticamente)
export type ResidenceFormData = Omit<
  Residence,
  'id' | 'uniqueKey' | 'displayLabel' | 'sortKey' | 'active' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'inactivatedAt'
>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function buildUniqueKey(data: ResidenceFormData): string {
  return [
    data.ala,
    data.pavilion.trim().toUpperCase(),
    data.gallery.trim().toUpperCase(),
    data.floor.trim().toUpperCase(),
    data.residenceNumber.trim().toUpperCase(),
  ].join('__');
}

export function buildDisplayLabel(data: ResidenceFormData): string {
  return `Pav. ${data.pavilion} / Gal. ${data.gallery} / Piso ${data.floor} / Res. ${data.residenceNumber}`;
}
