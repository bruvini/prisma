/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Triagem Clínica — Serviço Firestore (Fase 5 — P1 + P3 + P4 + P5)
 *
 * Regras de negócio:
 * - P1: salvar a triagem = criar automaticamente o registro de atendimento individual
 * - P3: a triagem NÃO gera consulta automática; evidência retroativa pode reconstituir cuidado
 * - P4: Rastreio de IST (Sífilis, HIV, Hep B/C) - gera pendência de monitoramento se reagente,
 *       bloqueia salvamento se houver pendências de preenchimento.
 * - P5: Rastreio Clínico de Tuberculose.
 *   - Suspeição não embutida na nota de acompanhamento automático até ser confirmado.
 *   - "Em investigação" ou "Suspeito" ativam fila paralela de exames e rx.
 *
 * Compatibilidade:
 * - firebaseToTriagem lida graciosamente com documentos legados mapeando para vazios.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import type {
  Triagem,
  FormDataTriagem,
  ItemFilaTriagem,
  PendenciasTriagem,
  ModuloHipertensao,
  ModuloDiabetes,
  ModuloRastreioIST,
  ModuloTuberculose,
} from './tipos';
import {
  StatusTriagem,
  OrigemTriagem,
  OrigemAtendimentoP1,
  StatusBoaPratica,
  MODULO_HAS_VAZIO,
  MODULO_DM_VAZIO,
  MODULO_IST_VAZIO,
  MODULO_TB_VAZIO,
  OrigemDado,
  StatusTestagemIST,
  ResultadoIST,
  EstadoAssistencialTB,
} from './tipos';

const NOME_COLECAO = 'triagens';

// ---------------------------------------------------------------------------
// Conversão Firestore → Domínio (tolerante a documentos de fases anteriores)
// ---------------------------------------------------------------------------

function firebaseToTriagem(id: string, data: Record<string, unknown>): Triagem {
  const d = data as any;

  const legadoHasDm = d.dadosClinicos?.hasDm;
  const legadoLinhas = d.linhasDeCuidado;

  const hipertensao: ModuloHipertensao = d.hipertensao ?? {
    ativa: legadoLinhas?.hipertensao ?? false,
    consulta: { data: legadoHasDm?.dataUltimaConsulta, origem: OrigemDado.REAPROVEITADO },
    pressaoArterial: { data: legadoHasDm?.dataUltimaAfericaoPa, origem: OrigemDado.REAPROVEITADO },
    antropometria: { data: legadoHasDm?.dataUltimoAntropometrico, origem: OrigemDado.REAPROVEITADO },
    observacao: legadoHasDm?.observacao,
  };

  const diabetes: ModuloDiabetes = d.diabetes ?? {
    ativa: legadoLinhas?.diabetes ?? false,
    consulta: { data: legadoHasDm?.dataUltimaConsulta, origem: OrigemDado.REAPROVEITADO },
    pressaoArterial: { data: legadoHasDm?.dataUltimaAfericaoPa, origem: OrigemDado.REAPROVEITADO },
    antropometria: { data: legadoHasDm?.dataUltimoAntropometrico, origem: OrigemDado.REAPROVEITADO },
    hemoglobinaGlicada: { data: legadoHasDm?.dataUltimaHba1c, origem: OrigemDado.REAPROVEITADO },
    observacao: legadoHasDm?.observacao,
  };

  const rastreioIST: ModuloRastreioIST = d.rastreioIST ?? MODULO_IST_VAZIO();
  const tuberculose: ModuloTuberculose = d.tuberculose ?? MODULO_TB_VAZIO();

  return {
    id,
    internoId:      d.internoId as string,
    detencaoId:     d.detencaoId as string,
    numeroDetencao: (d.numeroDetencao as number) ?? 1,
    status:         d.status as Triagem['status'],
    origem:         (d.origem as Triagem['origem']) ?? OrigemTriagem.NOVA,
    triagemAnteriorId: (d.triagemAnteriorId as string | null) ?? null,
    reaproveitouDadosAnteriores: (d.reaproveitouDadosAnteriores as boolean) ?? false,
    identificacao: d.identificacao ?? {},
    registroP1:    d.registroP1 ?? { atendimentoGerado: true, dataAtendimento: '', origemAtendimento: OrigemAtendimentoP1.TRIAGEM_INICIAL },
    hipertensao,
    diabetes,
    rastreioIST,
    tuberculose,
    substancias: d.substancias ?? { registros: [] },
    pendencias:    d.pendencias ?? {},
    criadoEm:    (d.criadoEm as Timestamp)?.toDate?.()    ?? new Date(),
    atualizadoEm:(d.atualizadoEm as Timestamp)?.toDate?.() ?? new Date(),
    criadoPor:   d.criadoPor as string,
    atualizadoPor: d.atualizadoPor as string,
  };
}

// ---------------------------------------------------------------------------
// Motor de pendências (executa no momento do save)
// ---------------------------------------------------------------------------

export function calcularPendencias(
  hipertensao: ModuloHipertensao,
  diabetes: ModuloDiabetes,
  ist: ModuloRastreioIST,
  tb: ModuloTuberculose,
): PendenciasTriagem {
  const pendencias: PendenciasTriagem = {};

  // -- P3 --
  if (hipertensao.ativa) {
    pendencias.has_consulta        = !hipertensao.consulta.data;
    pendencias.has_pressaoArterial = !hipertensao.pressaoArterial.data;
    pendencias.has_antropometria   = !hipertensao.antropometria.data;
  }
  if (diabetes.ativa) {
    pendencias.dm_consulta        = !diabetes.consulta.data;
    pendencias.dm_pressaoArterial = !diabetes.pressaoArterial.data;
    pendencias.dm_antropometria   = !diabetes.antropometria.data;
    pendencias.dm_hba1c           = !diabetes.hemoglobinaGlicada.data;
  }

  // -- P4 --
  if (ist.possuiResultadoReagenteP4) {
    pendencias.monitoramento_ist = true;
    pendencias.monitoramento_ist_detalhes = ist.istReagentes;
  }

  // -- P5 / Investigação TB --
  const eTB = tb.estadoAssistencialDerivado;
  if (eTB === EstadoAssistencialTB.SUSPEITA_CLINICA) {
    pendencias.investigacao_tb = true;
  } else if (eTB === EstadoAssistencialTB.RELATO_TB_CONFIRMADA_OU_INDEFINIDA) {
    pendencias.confirmacao_ou_monitoramento_tb = true;
    pendencias.prioridade_reinicio_tratamento = true; // simplifying logic to tie it to the confirmed state if it was interrupted
  }

  return pendencias;
}

// ---------------------------------------------------------------------------
// Enriquecedores (Derivam estados internos baseados na regra de negócio local)
// ---------------------------------------------------------------------------

function enriquecerModuloHas(m: ModuloHipertensao): ModuloHipertensao {
  return {
    ...m,
    statusConsulta:        m.consulta.data        ? StatusBoaPratica.OK : StatusBoaPratica.PENDENTE,
    statusPressaoArterial: m.pressaoArterial.data ? StatusBoaPratica.OK : StatusBoaPratica.PENDENTE,
    statusAntropometria:   m.antropometria.data   ? StatusBoaPratica.OK : StatusBoaPratica.PENDENTE,
  };
}

function enriquecerModuloDm(m: ModuloDiabetes): ModuloDiabetes {
  return {
    ...m,
    statusConsulta:        m.consulta.data             ? StatusBoaPratica.OK : StatusBoaPratica.PENDENTE,
    statusPressaoArterial: m.pressaoArterial.data      ? StatusBoaPratica.OK : StatusBoaPratica.PENDENTE,
    statusAntropometria:   m.antropometria.data        ? StatusBoaPratica.OK : StatusBoaPratica.PENDENTE,
    statusHba1c:           m.hemoglobinaGlicada.data   ? StatusBoaPratica.OK : StatusBoaPratica.PENDENTE,
  };
}

function enriquecerModuloIST(m: ModuloRastreioIST): ModuloRastreioIST {
  const ists = [
    { key: 'sifilis', val: m.sifilis },
    { key: 'hiv', val: m.hiv },
    { key: 'hepatiteB', val: m.hepatiteB },
    { key: 'hepatiteC', val: m.hepatiteC },
  ];

  let bloqueante = false;
  const reagentes: string[] = [];

  for (const { key, val } of ists) {
    if (val.statusTestagem === StatusTestagemIST.PENDENTE) {
      bloqueante = true;
    }
    if (val.statusTestagem === StatusTestagemIST.NAO_REALIZADO && !val.motivoNaoRealizado) {
      bloqueante = true;
    }
    if (val.statusTestagem === StatusTestagemIST.REALIZADO) {
      if (!val.dataRegistroOuTeste || !val.resultado) {
        bloqueante = true;
      } else if (val.resultado === ResultadoIST.REAGENTE) {
        reagentes.push(key);
      }
    }
  }

  return {
    ...m,
    pendenciasBloqueantesP4: bloqueante,
    possuiResultadoReagenteP4: reagentes.length > 0,
    istReagentes: reagentes,
  };
}

function enriquecerModuloTB(m: ModuloTuberculose): ModuloTuberculose {
  const r = m.rastreio;
  
  let derivado: EstadoAssistencialTB = EstadoAssistencialTB.SEM_SUSPEITA;

  if (r.relatoTbConfirmadaOuIndefinida === true) {
    derivado = EstadoAssistencialTB.RELATO_TB_CONFIRMADA_OU_INDEFINIDA;
  } else if (r.rastreamentoTbPositivo === true) {
    derivado = EstadoAssistencialTB.SUSPEITA_CLINICA;
  }

  return {
    ...m,
    estadoAssistencialDerivado: derivado,
  };
}

// ---------------------------------------------------------------------------
// Leitura
// ---------------------------------------------------------------------------

export async function buscarTriagemPorId(id: string): Promise<Triagem | null> {
  try {
    const snap = await getDoc(doc(db, NOME_COLECAO, id));
    if (!snap.exists()) return null;
    return firebaseToTriagem(snap.id, snap.data() as Record<string, unknown>);
  } catch { return null; }
}

export async function buscarDadosTriagemAnterior(
  internoId: string,
  detencaoAtualId: string,
): Promise<Triagem | null> {
  try {
    const q = query(
      collection(db, NOME_COLECAO),
      where('internoId', '==', internoId),
      orderBy('criadoEm', 'desc'),
    );
    const snap = await getDocs(q);
    const anterior = snap.docs
      .map(d => firebaseToTriagem(d.id, d.data() as Record<string, unknown>))
      .find(t => t.detencaoId !== detencaoAtualId && t.status === StatusTriagem.CONCLUIDA);
    return anterior ?? null;
  } catch {
    console.warn('[servicoTriagem] buscarDadosTriagemAnterior: falhou silenciosamente.');
    return null;
  }
}

// ---------------------------------------------------------------------------
// Fila de Triagem Pendente
// ---------------------------------------------------------------------------

export async function buscarFilaTriagemPendente(): Promise<ItemFilaTriagem[]> {
  const qInternos = query(collection(db, 'internos'), where('statusSistema', '==', 'ATIVO'));
  const snapInternos = await getDocs(qInternos);
  const internos = snapInternos.docs.map(d => ({ id: d.id, ...d.data() as any }));
  if (internos.length === 0) return [];

  const snapDetencoes = await getDocs(query(collection(db, 'detencoes'), where('status', '==', 'ATIVA')));
  const detencoesAtivas = new Map<string, any>();
  snapDetencoes.docs.forEach(d => {
    const dados = d.data() as any;
    detencoesAtivas.set(dados.internoId, { id: d.id, ...dados });
  });

  const detencaoIds = Array.from(detencoesAtivas.values()).map((d: any) => d.id);
  const triagensPorDetencao = new Map<string, boolean>();
  if (detencaoIds.length > 0) {
    const LOTE = 30;
    for (let i = 0; i < detencaoIds.length; i += LOTE) {
      const lote = detencaoIds.slice(i, i + LOTE);
      const snap = await getDocs(query(collection(db, NOME_COLECAO), where('detencaoId', 'in', lote)));
      snap.docs.forEach(d => triagensPorDetencao.set((d.data() as any).detencaoId, true));
    }
  }

  const snapOcupacoes = await getDocs(query(collection(db, 'ocupacoesAtuais'), where('ativa', '==', true)));
  const ocupacoesPorInterno = new Map<string, any>();
  snapOcupacoes.docs.forEach(d => {
    const dados = d.data() as any;
    ocupacoesPorInterno.set(dados.internoId, { id: d.id, ...dados });
  });

  const snapResidencias = await getDocs(collection(db, 'residencias'));
  const residenciasMap = new Map<string, any>();
  snapResidencias.docs.forEach(d => residenciasMap.set(d.id, { id: d.id, ...d.data() as any }));

  const fila: ItemFilaTriagem[] = [];

  for (const interno of internos) {
    const detencao = detencoesAtivas.get(interno.id);
    if (!detencao || triagensPorDetencao.has(detencao.id)) continue;

    const ocupacao = ocupacoesPorInterno.get(interno.id);
    let localizacaoAtual = 'Localização não informada';
    if (ocupacao?.residenciaId) {
      const res = residenciasMap.get(ocupacao.residenciaId);
      if (res?.rotuloExibicao) localizacaoAtual = res.rotuloExibicao;
      else if (res) localizacaoAtual = `Pav. ${res.pavilhao} / Gal. ${res.galeria} / Res. ${res.numeroResidencia}`;
    }

    const triagemVirtual: Triagem = {
      id: '', internoId: interno.id, detencaoId: detencao.id,
      numeroDetencao: detencao.numeroDetencao ?? 1,
      status: StatusTriagem.PENDENTE,
      origem: (detencao.numeroDetencao ?? 1) > 1 ? OrigemTriagem.RETORNO_EGRESSO : OrigemTriagem.NOVA,
      triagemAnteriorId: null, reaproveitouDadosAnteriores: false,
      identificacao: {},
      registroP1: { atendimentoGerado: true, dataAtendimento: '', origemAtendimento: OrigemAtendimentoP1.TRIAGEM_INICIAL },
      hipertensao: MODULO_HAS_VAZIO(), diabetes: MODULO_DM_VAZIO(), 
      rastreioIST: MODULO_IST_VAZIO(),
      tuberculose: MODULO_TB_VAZIO(),
      substancias: { registros: [] },
      pendencias: {},
      criadoEm: new Date(), atualizadoEm: new Date(), criadoPor: '', atualizadoPor: '',
    };

    fila.push({
      triagem: triagemVirtual,
      internoId: interno.id,
      nomeCompleto: interno.nomeCompleto ?? 'Nome não informado',
      prontuario: interno.prontuario ?? '',
      localizacaoAtual,
      reativado: (detencao.numeroDetencao ?? 1) > 1,
    });
  }

  fila.sort((a, b) => {
    if (a.reativado !== b.reativado) return a.reativado ? -1 : 1;
    return a.nomeCompleto.localeCompare(b.nomeCompleto, 'pt-BR');
  });

  return fila;
}

// ---------------------------------------------------------------------------
// Criação da triagem com P1 automático e motor de pendências
// ---------------------------------------------------------------------------

export async function criarTriagem(
  dados: FormDataTriagem,
  idUsuario: string,
): Promise<Triagem> {
  const agora = serverTimestamp();
  const agoraDate = new Date();

  const has = dados.hipertensao.ativa ? enriquecerModuloHas(dados.hipertensao) : dados.hipertensao;
  const dm  = dados.diabetes.ativa    ? enriquecerModuloDm(dados.diabetes)      : dados.diabetes;
  const ist = enriquecerModuloIST(dados.rastreioIST);
  const tb  = enriquecerModuloTB(dados.tuberculose);

  if (ist.pendenciasBloqueantesP4) {
    throw new Error('Não é possível salvar a triagem com pendências obrigatórias no rastreio de IST.');
  }

  const pendencias = calcularPendencias(has, dm, ist, tb);

  const payload = {
    internoId:                   dados.internoId,
    detencaoId:                  dados.detencaoId,
    numeroDetencao:              dados.numeroDetencao,
    status:                      dados.status,
    origem:                      dados.origem,
    triagemAnteriorId:           dados.triagemAnteriorId ?? null,
    reaproveitouDadosAnteriores: dados.reaproveitouDadosAnteriores ?? false,
    identificacao:               dados.identificacao ?? {},
    registroP1:                  dados.registroP1,
    hipertensao:                 has,
    diabetes:                    dm,
    rastreioIST:                 ist,
    tuberculose:                 tb,
    substancias:                 dados.substancias,
    pendencias,
    criadoEm:     agora,
    atualizadoEm: agora,
    criadoPor:    idUsuario,
    atualizadoPor: idUsuario,
  };

  const docRef = await addDoc(collection(db, NOME_COLECAO), payload);

  return {
    id: docRef.id,
    ...dados,
    hipertensao: has,
    diabetes: dm,
    rastreioIST: ist,
    tuberculose: tb,
    substancias: dados.substancias,
    pendencias,
    triagemAnteriorId: dados.triagemAnteriorId ?? null,
    reaproveitouDadosAnteriores: dados.reaproveitouDadosAnteriores ?? false,
    criadoEm: agoraDate,
    atualizadoEm: agoraDate,
    criadoPor: idUsuario,
    atualizadoPor: idUsuario,
  };
}

export async function atualizarTriagem(
  id: string,
  dados: Partial<FormDataTriagem>,
  idUsuario: string,
): Promise<void> {
  const payloadToUpdate: any = {
    ...dados,
    atualizadoEm: serverTimestamp(),
    atualizadoPor: idUsuario,
  };

  if (dados.rastreioIST) {
    const enrichedIST = enriquecerModuloIST(dados.rastreioIST);
    if (enrichedIST.pendenciasBloqueantesP4) {
       throw new Error('Não é possível salvar a triagem com pendências obrigatórias no rastreio de IST.');
    }
    payloadToUpdate.rastreioIST = enrichedIST;
  }
  
  if (dados.tuberculose) {
    payloadToUpdate.tuberculose = enriquecerModuloTB(dados.tuberculose);
  }

  await updateDoc(doc(db, NOME_COLECAO, id), payloadToUpdate);
}
