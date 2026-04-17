/**
 * Triagem Clínica — Domínio Central (Fase 5 — P1 + P3 + P4 + P5)
 *
 * Premissa fundamental:
 * - A triagem NÃO é prontuário eletrônico.
 * - Captura apenas o mínimo para posicionamento em linhas de cuidado
 *   e geração de pendências para monitoramento futuro.
 * - Cada triagem está vinculada a uma PASSAGEM (detencao) específica.
 *
 * Notas metodológicas aplicadas:
 * - P1: Mais Acesso à Atenção Primária Prisional
 * - P3: Cuidado da pessoa com diabetes e/ou hipertensão
 * - P4: Rastreio de Infecções Sexualmente Transmissíveis (Sífilis, HIV, Hep B, Hep C)
 * - P5: Cuidado da pessoa com Tuberculose (Rastreio e Preparação de Monitoramento)
 */

// ---------------------------------------------------------------------------
// Status da Triagem
// ---------------------------------------------------------------------------

export const StatusTriagem = {
  PENDENTE:     'PENDENTE',
  EM_ANDAMENTO: 'EM_ANDAMENTO',
  CONCLUIDA:    'CONCLUIDA',
} as const;
export type StatusTriagem = typeof StatusTriagem[keyof typeof StatusTriagem];

export const StatusTriagemLabel: Record<StatusTriagem, string> = {
  PENDENTE:     'Pendente',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDA:    'Concluída',
};

// ---------------------------------------------------------------------------
// Perfil de cuidado / identidade de gênero
// ---------------------------------------------------------------------------

export const PerfilCuidado = {
  HOMEM_CIS:   'HOMEM_CIS',
  HOMEM_TRANS: 'HOMEM_TRANS',
  MULHER_CIS:  'MULHER_CIS',
  MULHER_TRANS:'MULHER_TRANS',
} as const;
export type PerfilCuidado = typeof PerfilCuidado[keyof typeof PerfilCuidado];

export const PerfilCuidadoLabel: Record<PerfilCuidado, string> = {
  HOMEM_CIS:    'Homem cis',
  HOMEM_TRANS:  'Homem trans',
  MULHER_CIS:   'Mulher cis',
  MULHER_TRANS: 'Mulher trans',
};

// ---------------------------------------------------------------------------
// Origem de cada dado (retroatividade estruturada)
// ---------------------------------------------------------------------------

export const OrigemDado = {
  RETROATIVO:     'RETROATIVO',      // Informado pela equipe como dado pré-existente
  TRIAGEM_ATUAL:  'TRIAGEM_ATUAL',   // Coletado/registrado nesta triagem
  REAPROVEITADO:  'REAPROVEITADO',   // Importado da triagem anterior (retorno de egresso)
  NAO_INFORMADO:  'NAO_INFORMADO',
} as const;
export type OrigemDado = typeof OrigemDado[keyof typeof OrigemDado];

export const OrigemDadoLabel: Record<OrigemDado, string> = {
  RETROATIVO:    'Retroativo (pré-existente)',
  TRIAGEM_ATUAL: 'Registrado na triagem',
  REAPROVEITADO: 'Reaproveitado da passagem anterior',
  NAO_INFORMADO: 'Não informado',
};

export const StatusBoaPratica = {
  OK:       'OK',
  PENDENTE: 'PENDENTE',
} as const;
export type StatusBoaPratica = typeof StatusBoaPratica[keyof typeof StatusBoaPratica];

// ---------------------------------------------------------------------------
// Identificação complementar
// ---------------------------------------------------------------------------

export const SituacaoMoradia = {
  CASA_PROPRIA: 'CASA_PROPRIA',
  ALUGADA: 'ALUGADA',
  CEDIDA: 'CEDIDA',
  SITUACAO_RUA: 'SITUACAO_RUA',
  ALOJAMENTO: 'ALOJAMENTO',
} as const;
export type SituacaoMoradia = typeof SituacaoMoradia[keyof typeof SituacaoMoradia];

export const SituacaoMoradiaLabel: Record<SituacaoMoradia, string> = {
  CASA_PROPRIA: 'Casa própria',
  ALUGADA: 'Alugada',
  CEDIDA: 'Cedida',
  SITUACAO_RUA: 'Situação de rua',
  ALOJAMENTO: 'Alojamento / Abrigo',
};

export const GrupoMinoritario = {
  LGBTQIA: 'LGBTQIA',
  INDIGENA: 'INDIGENA',
  QUILOMBOLA: 'QUILOMBOLA',
  ESTRANGEIRO: 'ESTRANGEIRO',
} as const;
export type GrupoMinoritario = typeof GrupoMinoritario[keyof typeof GrupoMinoritario];

export const GrupoMinoritarioLabel: Record<GrupoMinoritario, string> = {
  LGBTQIA: 'LGBTQIA+',
  INDIGENA: 'Comunidade Indígena',
  QUILOMBOLA: 'Comunidade Quilombola',
  ESTRANGEIRO: 'Estrangeiro',
};

export interface IdentificacaoComplementar {
  dataNascimento?: string;       // DD/MM/AAAA
  prontuarioOlostech?: string;
  numeroDetentoIpen?: string;
  perfilCuidado?: PerfilCuidado; // Identidade para elegibilidade futura
  situacaoMoradia?: SituacaoMoradia;
  gruposMinoritarios?: GrupoMinoritario[];
}

// ---------------------------------------------------------------------------
// Uso de Substâncias Psicoativas
// ---------------------------------------------------------------------------

export const SubstanciaPsicoativa = {
  MACONHA: 'MACONHA',
  COCAINA: 'COCAINA',
  CRACK: 'CRACK',
  DROGAS_K: 'DROGAS_K',
  ECSTASY: 'ECSTASY',
  LSD: 'LSD',
  ALCOOL: 'ALCOOL',
  TABACO: 'TABACO',
  BENZODIAZEPINICOS: 'BENZODIAZEPINICOS',
  OPIOIDES: 'OPIOIDES',
  ANFETAMINAS: 'ANFETAMINAS',
  INALANTES: 'INALANTES',
  HEROINA: 'HEROINA',
  PASTA_BASE: 'PASTA_BASE',
  ESTEROIDES: 'ESTEROIDES',
  MEDICAMENTOS_CONTROLADOS: 'MEDICAMENTOS_CONTROLADOS',
  OUTROS: 'OUTROS',
} as const;
export type SubstanciaPsicoativa = typeof SubstanciaPsicoativa[keyof typeof SubstanciaPsicoativa];

export const SubstanciaPsicoativaLabel: Record<SubstanciaPsicoativa, string> = {
  MACONHA: 'Maconha',
  COCAINA: 'Cocaína',
  CRACK: 'Crack',
  DROGAS_K: 'K2 / K4 / K9 (Drogas K)',
  ECSTASY: 'Ecstasy (MDMA)',
  LSD: 'LSD',
  ALCOOL: 'Álcool',
  TABACO: 'Tabaco',
  BENZODIAZEPINICOS: 'Benzodiazepínicos (Calmantes)',
  OPIOIDES: 'Opioides (Morfina / Codeína)',
  ANFETAMINAS: 'Anfetaminas (Rebites)',
  INALANTES: 'Inalantes (Solventes)',
  HEROINA: 'Heroína',
  PASTA_BASE: 'Pasta Base',
  ESTEROIDES: 'Esteroides Anabolizantes',
  MEDICAMENTOS_CONTROLADOS: 'Medicamentos Controlados (Sem prescrição)',
  OUTROS: 'Outros (especificar)',
};

export const FrequenciaUso = {
  DIARIO: 'DIARIO',
  SEMANAL: 'SEMANAL',
  OCASIONAL: 'OCASIONAL',
  OUTRO: 'OUTRO',
} as const;
export type FrequenciaUso = typeof FrequenciaUso[keyof typeof FrequenciaUso];

// Removed ViaAdministracao

export interface RegistroUsoSubstancia {
  id: string; // Internal id for list key iteration
  substancia: SubstanciaPsicoativa;
  substanciaOutro?: string;
  tempoUso?: string;
  frequencia?: FrequenciaUso;
  dataUltimoUso?: string; // DD/MM/AAAA
}

export interface ModuloSubstanciasPsicoativas {
  registros: RegistroUsoSubstancia[];
}

// ---------------------------------------------------------------------------
// P3 — Hipertensão e Diabetes
// ---------------------------------------------------------------------------

export interface DadoConsulta {
  data?: string;             // DD/MM/AAAA
  origem: OrigemDado;
}

export interface DadoPressaoArterial {
  data?: string;             // DD/MM/AAAA
  pas?: number;              // mmHg — sistólica
  pad?: number;              // mmHg — diastólica
  origem: OrigemDado;
}

export interface DadoAntropometria {
  data?: string;             // DD/MM/AAAA
  peso?: number;             // kg
  altura?: number;           // cm
  origem: OrigemDado;
}

export interface ModuloHipertensao {
  ativa: boolean;
  consulta: DadoConsulta;
  pressaoArterial: DadoPressaoArterial;
  antropometria: DadoAntropometria;
  observacao?: string;
  statusConsulta?: StatusBoaPratica;
  statusPressaoArterial?: StatusBoaPratica;
  statusAntropometria?: StatusBoaPratica;
}

export const TipoRegistroHba1c = {
  SOLICITADA: 'SOLICITADA',
  AVALIADA:   'AVALIADA',
} as const;
export type TipoRegistroHba1c = typeof TipoRegistroHba1c[keyof typeof TipoRegistroHba1c];

export const TipoRegistroHba1cLabel: Record<TipoRegistroHba1c, string> = {
  SOLICITADA: 'Solicitada',
  AVALIADA:   'Avaliada (resultado disponível)',
};

export interface DadoHba1c {
  data?: string;                  // DD/MM/AAAA
  tipoRegistro?: TipoRegistroHba1c;
  valor?: number;                 // Percentual
  origem: OrigemDado;
}

export interface ModuloDiabetes {
  ativa: boolean;
  consulta: DadoConsulta;
  pressaoArterial: DadoPressaoArterial;
  antropometria: DadoAntropometria;
  hemoglobinaGlicada: DadoHba1c;
  observacao?: string;
  statusConsulta?: StatusBoaPratica;
  statusPressaoArterial?: StatusBoaPratica;
  statusAntropometria?: StatusBoaPratica;
  statusHba1c?: StatusBoaPratica;
}

// ---------------------------------------------------------------------------
// P4 — Rastreio de IST (Fase 4)
// ---------------------------------------------------------------------------

export const StatusTestagemIST = {
  REALIZADO:     'REALIZADO',
  NAO_REALIZADO: 'NAO_REALIZADO',
  PENDENTE:      'PENDENTE',
} as const;
export type StatusTestagemIST = typeof StatusTestagemIST[keyof typeof StatusTestagemIST];

export const StatusTestagemISTLabel: Record<StatusTestagemIST, string> = {
  REALIZADO:     'Realizado',
  NAO_REALIZADO: 'Não realizado',
  PENDENTE:      'Pendente',
};

export const ResultadoIST = {
  REAGENTE:     'REAGENTE',
  NAO_REAGENTE: 'NAO_REAGENTE',
} as const;
export type ResultadoIST = typeof ResultadoIST[keyof typeof ResultadoIST];

export const ResultadoISTLabel: Record<ResultadoIST, string> = {
  REAGENTE:     'Reagente',
  NAO_REAGENTE: 'Não reagente',
};

export const TipoRegistroIST = {
  TESTE_RAPIDO:   'TESTE_RAPIDO',
  EXAME_AVALIADO: 'EXAME_AVALIADO',
} as const;
export type TipoRegistroIST = typeof TipoRegistroIST[keyof typeof TipoRegistroIST];

export const TipoRegistroISTLabel: Record<TipoRegistroIST, string> = {
  TESTE_RAPIDO:   'Teste rápido',
  EXAME_AVALIADO: 'Exame avaliado',
};

export interface DadoIST {
  statusTestagem: StatusTestagemIST;
  dataRegistroOuTeste?: string;     // Obrigatorio se REALIZADO (DD/MM/AAAA)
  tipoRegistro?: TipoRegistroIST;   // TESTE_RAPIDO | EXAME_AVALIADO
  resultado?: ResultadoIST;         // Obrigatorio se REALIZADO
  motivoNaoRealizado?: string;      // Obrigatorio se NAO_REALIZADO
  origemDado: OrigemDado;
}

export interface ModuloRastreioIST {
  sifilis: DadoIST;
  hiv: DadoIST;
  hepatiteB: DadoIST;
  hepatiteC: DadoIST;
  
  // Derivados / Motor de pendências
  // Pendências de preenchimento que impedem o salvamento da triagem
  pendenciasBloqueantesP4: boolean; 
  // Flag que aciona pendência clínica no futuro módulo de acompanhamento
  possuiResultadoReagenteP4: boolean; 
  // Array com o nome das ISTs que deram reagente ('sifilis', 'hiv', etc)
  istReagentes: string[];
}

// ---------------------------------------------------------------------------
// P5 — Tuberculose (Fase 5)
// ---------------------------------------------------------------------------

export interface RastreioTB {
  rastreamentoTbPositivo: boolean | null;
  relatoTbConfirmadaOuIndefinida: boolean | null;
  observacoes?: string;
}

export const EstadoAssistencialTB = {
  SEM_SUSPEITA: 'SEM_SUSPEITA',
  SUSPEITA_CLINICA: 'SUSPEITA_CLINICA',
  RELATO_TB_CONFIRMADA_OU_INDEFINIDA: 'RELATO_TB_CONFIRMADA_OU_INDEFINIDA',
} as const;
export type EstadoAssistencialTB = typeof EstadoAssistencialTB[keyof typeof EstadoAssistencialTB];

export const EstadoAssistencialTBLabel: Record<EstadoAssistencialTB, string> = {
  SEM_SUSPEITA: 'Sem suspeita / Assintomático',
  SUSPEITA_CLINICA: 'Suspeita clínica',
  RELATO_TB_CONFIRMADA_OU_INDEFINIDA: 'Relato de TB confirmada ou situação indefinida',
};

export interface ModuloTuberculose {
  rastreio: RastreioTB;
  estadoAssistencialDerivado: EstadoAssistencialTB;
}

// ---------------------------------------------------------------------------
// Registro P1
// ---------------------------------------------------------------------------

export const OrigemAtendimentoP1 = {
  TRIAGEM_INICIAL:  'TRIAGEM_INICIAL',
  TRIAGEM_RETORNO:  'TRIAGEM_RETORNO',
} as const;
export type OrigemAtendimentoP1 = typeof OrigemAtendimentoP1[keyof typeof OrigemAtendimentoP1];

export interface RegistroP1 {
  atendimentoGerado: true;
  dataAtendimento: string;    // ISO timestamp
  origemAtendimento: OrigemAtendimentoP1;
  profissionalId?: string;
}

// ---------------------------------------------------------------------------
// Pendências geradas ao salvar (motor inicial)
// ---------------------------------------------------------------------------

export interface PendenciasTriagem {
  // P3
  has_consulta?: boolean;
  has_pressaoArterial?: boolean;
  has_antropometria?: boolean;
  dm_consulta?: boolean;
  dm_pressaoArterial?: boolean;
  dm_antropometria?: boolean;
  dm_hba1c?: boolean;
  // P4
  monitoramento_ist?: boolean;
  monitoramento_ist_detalhes?: string[];
  // P5 e Investigação
  investigacao_tb?: boolean;
  confirmacao_ou_monitoramento_tb?: boolean;
  prioridade_reinicio_tratamento?: boolean;
}

// ---------------------------------------------------------------------------
// Origem da triagem (ciclo)
// ---------------------------------------------------------------------------

export const OrigemTriagem = {
  NOVA:                'NOVA',
  RETORNO_EGRESSO:     'RETORNO_EGRESSO',
  PREENCHIDA_ANTERIOR: 'PREENCHIDA_ANTERIOR',
} as const;
export type OrigemTriagem = typeof OrigemTriagem[keyof typeof OrigemTriagem];

// ---------------------------------------------------------------------------
// Entidade principal: Triagem
// ---------------------------------------------------------------------------

export interface Triagem {
  id: string;
  internoId: string;
  detencaoId: string;
  numeroDetencao: number;
  status: StatusTriagem;
  origem: OrigemTriagem;
  triagemAnteriorId: string | null;
  reaproveitouDadosAnteriores: boolean;
  identificacao: IdentificacaoComplementar;
  registroP1: RegistroP1;
  hipertensao: ModuloHipertensao;
  diabetes: ModuloDiabetes;
  substancias: ModuloSubstanciasPsicoativas;
  
  /** Módulo P4 - Rastreio de IST */
  rastreioIST: ModuloRastreioIST;

  /** Módulo P5 - Tuberculose */
  tuberculose: ModuloTuberculose;

  pendencias: PendenciasTriagem;
  criadoEm: Date;
  atualizadoEm: Date;
  criadoPor: string;
  atualizadoPor: string;
}

// ---------------------------------------------------------------------------
// Resto dos tipos do Formulário
// ---------------------------------------------------------------------------

export type FormDataTriagem = Omit<Triagem, 'id' | 'criadoEm' | 'atualizadoEm' | 'criadoPor' | 'atualizadoPor'>;

export interface EstadoFormTriagem {
  identificacao: IdentificacaoComplementar;
  hipertensao: ModuloHipertensao;
  diabetes: ModuloDiabetes;
  rastreioIST: ModuloRastreioIST;
  tuberculose: ModuloTuberculose;
  substancias: ModuloSubstanciasPsicoativas;
  reaproveitouDadosAnteriores: boolean;
}

const dadoConsultaVazio = (): DadoConsulta => ({ origem: OrigemDado.NAO_INFORMADO });
const dadoPaVazio = (): DadoPressaoArterial => ({ origem: OrigemDado.NAO_INFORMADO });
const dadoAntropVazio = (): DadoAntropometria => ({ origem: OrigemDado.NAO_INFORMADO });
const dadoHba1cVazio = (): DadoHba1c => ({ origem: OrigemDado.NAO_INFORMADO });
const dadoIstVazio = (): DadoIST => ({ statusTestagem: StatusTestagemIST.PENDENTE, origemDado: OrigemDado.NAO_INFORMADO });

export const MODULO_HAS_VAZIO = (): ModuloHipertensao => ({
  ativa: false, consulta: dadoConsultaVazio(), pressaoArterial: dadoPaVazio(), antropometria: dadoAntropVazio(),
});

export const MODULO_DM_VAZIO = (): ModuloDiabetes => ({
  ativa: false, consulta: dadoConsultaVazio(), pressaoArterial: dadoPaVazio(), antropometria: dadoAntropVazio(), hemoglobinaGlicada: dadoHba1cVazio(),
});

export const MODULO_IST_VAZIO = (): ModuloRastreioIST => ({
  sifilis: dadoIstVazio(),
  hiv: dadoIstVazio(),
  hepatiteB: dadoIstVazio(),
  hepatiteC: dadoIstVazio(),
  pendenciasBloqueantesP4: true,
  possuiResultadoReagenteP4: false,
  istReagentes: [],
});

export const MODULO_TB_VAZIO = (): ModuloTuberculose => ({
  rastreio: {
    rastreamentoTbPositivo: null,
    relatoTbConfirmadaOuIndefinida: null,
  },
  estadoAssistencialDerivado: EstadoAssistencialTB.SEM_SUSPEITA,
});

export const ESTADO_FORM_VAZIO = (): EstadoFormTriagem => ({
  identificacao: { gruposMinoritarios: [] },
  hipertensao: MODULO_HAS_VAZIO(),
  diabetes: MODULO_DM_VAZIO(),
  rastreioIST: MODULO_IST_VAZIO(),
  tuberculose: MODULO_TB_VAZIO(),
  substancias: { registros: [] },
  reaproveitouDadosAnteriores: false,
});

export interface ItemFilaTriagem {
  triagem: Triagem;
  internoId: string;
  nomeCompleto: string;
  prontuario: string;
  localizacaoAtual: string;
  reativado: boolean;
}
