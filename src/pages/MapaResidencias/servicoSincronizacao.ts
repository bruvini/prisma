/**
 * Mapa de Residências — Serviço de Sincronização I-PEN
 * Implementa o parser do relatório 1.8 e a lógica de reconcialidação de alocados.
 */

import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  serverTimestamp,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { 
  Ala, 
  TipoResidencia, 
  gerarChaveUnica 
} from './tipos';

// ---------------------------------------------------------------------------
// Tipos para a Prévia
// ---------------------------------------------------------------------------

export interface RegistroExtraido {
  prontuario: string;
  nomeCompleto: string;
  situacaoIpen: string;
  ala: Ala;
  pavilhao: string;
  galeria: string;
  piso: string;
  tipoResidencia: TipoResidencia;
  numeroResidencia: string;
  chaveResidencial: string; // Gerada via gerarChaveUnica
}

export interface ImpactoSincronizacao {
  novos: RegistroExtraido[];
  reativados: { registro: RegistroExtraido; internoId: string }[];
  realocados: { 
    registro: RegistroExtraido; 
    internoId: string; 
    residenciaAnteriorId: string;
    residenciaAnteriorDescricao?: string;
  }[];
  inativados: { internoId: string; nome: string; prontuario: string }[];
  semMudanca: string[]; // Listagem de prontuários
  conflitos: { registro: RegistroExtraido; motivo: string }[];
}

export interface ResumoSincronizacao {
  totalLido: number;
  totalValidos: number;
  totalNovos: number;
  totalReativados: number;
  totalRealocados: number;
  totalInativados: number;
  totalSemMudanca: number;
  totalConflitos: number;
  totalResidenciasAusentes: number; // Agrupado
}

export interface ConflitoResidencialAgrupado {
  chaveResidencial: string;
  ala: Ala;
  pavilhao: string;
  galeria: string;
  piso: string;
  tipoResidencia: TipoResidencia;
  numeroResidencia: string;
  quantidadeInternosDetectados: number;
  prontuariosExemplo: string[];
}

// ---------------------------------------------------------------------------
// Parser do Relatório 1.8 (Bruto)
// ---------------------------------------------------------------------------

/**
 * Extrai registros do texto bruto do relatório 1.8.
 * Estratégia orientada a blocos por prontuário com extração de cauda estrutural.
 */
export function extrairDadosRelatorio(textoBruto: string): RegistroExtraido[] {
  if (!textoBruto) return [];

  const registros: RegistroExtraido[] = [];
  const linhas = textoBruto.split('\n').map(l => l.trim()).filter(l => l !== '');
  
  const blocos: string[][] = [];
  let blocoAtual: string[] = [];

  // 1. Segmentação em blocos por prontuário
  // Aceita: "474943 -", "474943-", "474943 ", etc.
  const regexInicioBloco = /^(\d{5,10})\s*[-—–]?\s*/;

  for (const linha of linhas) {
    // Ignora ruído de cabeçalho/rodapé
    if (linha.includes('SISTEMA DE GESTÃO PRISIONAL') || 
        linha.includes('Relatório 1.8') || 
        linha.includes('LISTAGEM DE INTERNOS ALOCADOS') ||
        linha.includes('Secretaria de Estado') ||
        linha.includes('Departamento de Polícia') ||
        linha.includes('Pág.:')) {
      continue;
    }

    if (regexInicioBloco.test(linha)) {
      if (blocoAtual.length > 0) blocos.push(blocoAtual);
      blocoAtual = [linha];
    } else if (blocoAtual.length > 0) {
      blocoAtual.push(linha);
    }
  }
  if (blocoAtual.length > 0) blocos.push(blocoAtual);

  // 2. Processamento de cada bloco
  for (const bloco of blocos) {
    const registro = processarBloco(bloco);
    if (registro) {
      registros.push(registro);
    }
  }

  return registros;
}

/**
 * Processa um bloco de linhas pertencentes a um único prontuário.
 */
function processarBloco(linhas: string[]): RegistroExtraido | null {
  if (linhas.length === 0) return null;

  const primeiraLinha = linhas[0];
  // Captura Prontuário e o que sobrar
  const correspondencia = primeiraLinha.match(/^(\d{5,10})\s*[-—–]?\s*(.*)/);
  if (!correspondencia) return null;

  const prontuario = correspondencia[1];
  let textoRestante = (correspondencia[2] || '') + ' ' + linhas.slice(1).join(' ');
  textoRestante = textoRestante.replace(/\s+/g, ' ').trim();

  // 3. Extração da cauda estrutural (Direita para Esquerda)
  const partes = textoRestante.split(' ');
  if (partes.length < 6) return null;

  const infoLocalizacao = extrairCaudaLocalizacao(partes);
  if (!infoLocalizacao) return null;

  const { 
    ala, pavilhao, galeria, piso, tipoResidencia, numeroResidencia, indexInicioCauda 
  } = infoLocalizacao;

  // 4. Separação de Nome e Situação
  const textoNomeSituacao = partes.slice(0, indexInicioCauda).join(' ').trim();
  const { nome, situacao } = separarNomeSituacao(textoNomeSituacao);

  const extraido: RegistroExtraido = {
    prontuario,
    nomeCompleto: nome,
    situacaoIpen: situacao,
    ala,
    pavilhao,
    galeria,
    piso,
    tipoResidencia,
    numeroResidencia,
    chaveResidencial: '',
  };

  extraido.chaveResidencial = gerarChaveUnica({
    ala: extraido.ala,
    pavilhao: extraido.pavilhao,
    galeria: extraido.galeria,
    piso: extraido.piso,
    tipoResidencia: extraido.tipoResidencia,
    numeroResidencia: extraido.numeroResidencia,
    capacidade: 0,
    regime: 'NAO_INFORMADO',
  } as any);

  return extraido;
}

/**
 * Extrai a localização lendo a cauda do registro.
 */
function extrairCaudaLocalizacao(partes: string[]) {
  const tiposCompostos = [
    { texto: 'CELA ESPECIAL', valor: TipoResidencia.CELA_ESPECIAL },
    { texto: 'ALOJAMENTO INTERNO', valor: TipoResidencia.ALOJAMENTO_INTERNO },
    { texto: 'TRIAGEM PNE', valor: TipoResidencia.TRIAGEM_PNE },
    { texto: 'PRISÃO CIVIL', valor: TipoResidencia.PRISAO_CIVIL },
  ];

  const tiposSimples: Record<string, TipoResidencia> = {
    'SEGURO': TipoResidencia.SEGURO,
    'TRIAGEM': TipoResidencia.TRIAGEM,
    'CELA': TipoResidencia.CELA,
    'ADAPTAÇÃO': TipoResidencia.ADAPTACAO,
    'ADAPTACAO': TipoResidencia.ADAPTACAO,
    'LGBT': TipoResidencia.LGBT,
  };

  const len = partes.length;
  const numeroResidencia = partes[len - 1];
  
  let tipoResidencia: TipoResidencia | null = null;
  let indexTipo = -1;

  // Tenta tipos compostos (bi-gramas)
  if (len >= 3) {
    const biGram = (partes[len - 3] + ' ' + partes[len - 2]).toUpperCase();
    for (const tc of tiposCompostos) {
      if (biGram.includes(tc.texto)) {
        tipoResidencia = tc.valor;
        indexTipo = len - 3;
        break;
      }
    }
  }

  // Tenta tipos simples
  if (!tipoResidencia && len >= 2) {
    const uniGram = partes[len - 2].toUpperCase();
    if (tiposSimples[uniGram]) {
      tipoResidencia = tiposSimples[uniGram];
      indexTipo = len - 2;
    }
  }

  if (!tipoResidencia || indexTipo < 4) return null;

  const piso = partes[indexTipo - 1];
  const galeriaPoisBlocoIpen = partes[indexTipo - 2];
  const pavilhaoPoisGaleriaIpen = partes[indexTipo - 3];
  const alaIpen = partes[indexTipo - 4];

  let ala: Ala = Ala.NAO_INFORMADA;
  if (alaIpen === 'M') ala = Ala.MASCULINA;
  else if (alaIpen === 'F') ala = Ala.FEMININA;
  else if (alaIpen === 'N') ala = Ala.NAO_INFORMADA;

  return {
    ala,
    pavilhao: pavilhaoPoisGaleriaIpen,
    galeria: galeriaPoisBlocoIpen,
    piso,
    tipoResidencia,
    numeroResidencia,
    indexInicioCauda: indexTipo - 4
  };
}

/**
 * Separa Nome de Situação usando padrões prioritários.
 */
function separarNomeSituacao(texto: string): { nome: string; situacao: string } {
  const padroesSituacao = [
    'RECOLHIDO(A)',
    'RECOLHIDO -',
    'RECOLHIDO',
    'RECEBENDO VISITAÇÃO',
    'RECEBENDO VISITACAO',
    'SAÍDA PARA ESTUDO',
    'TRABALHO INTERNO',
    'TRABALHO EXTERNO',
    'EXAME EXTERNO',
    'INTERNAÇÃO HOSPITALAR',
  ];

  let indexMinimo = texto.length;

  for (const padrao of padroesSituacao) {
    const idx = texto.toUpperCase().indexOf(padrao);
    // Priorizamos a primeira ocorrência de qualquer padrão de situação
    if (idx !== -1 && idx < indexMinimo) {
      indexMinimo = idx;
    }
  }

  if (indexMinimo === texto.length) {
    return { nome: texto.trim(), situacao: 'SITUAÇÃO NÃO IDENTIFICADA' };
  }

  const nome = texto.substring(0, indexMinimo).trim();
  const situacao = texto.substring(indexMinimo).trim();

  // Limpeza final para evitar nomes que terminam em hífen espúrio
  const nomeLimpo = nome.replace(/\s+-\s*$/, '').trim();

  return { nome: nomeLimpo, situacao };
}


// ---------------------------------------------------------------------------
// Lógica de Reconciliação (Cálculo de Impacto)
// ---------------------------------------------------------------------------

export async function analisarImpactoSincronizacao(registros: RegistroExtraido[]): Promise<ImpactoSincronizacao> {
  const impacto: ImpactoSincronizacao = {
    novos: [],
    reativados: [],
    realocados: [],
    inativados: [],
    semMudanca: [],
    conflitos: [],
  };

  // 1. Busca todos os internos do banco (ativos para verificar movimentação/inativação)
  const qAtivos = query(collection(db, 'internos'), where('statusSistema', '==', 'ATIVO'));
  const snapAtivos = await getDocs(qAtivos);
  const internosAtivosMap = new Map<string, any>(); // prontuario -> dados
  snapAtivos.forEach(d => internosAtivosMap.set(d.data().prontuario, { id: d.id, ...d.data() }));

  // 2. Mapeia residências existentes por chave única para validar localizações
  const snapResidencias = await getDocs(query(collection(db, 'residencias'), where('ativo', '==', true)));
  const residenciasMap = new Map<string, string>(); // chaveUnica -> id
  const residenciasIdMap = new Map<string, any>();
  snapResidencias.forEach(d => {
    residenciasMap.set(d.data().chaveUnica, d.id);
    residenciasIdMap.set(d.id, d.data());
  });

  // 3. Processa registros extraídos do relatório
  const prontuariosNoRelatorio = new Set<string>();

  for (const reg of registros) {
    prontuariosNoRelatorio.add(reg.prontuario);
    
    // Verifica se a residência existe no PRISMA
    const residenciaId = residenciasMap.get(reg.chaveResidencial);
    if (!residenciaId) {
      impacto.conflitos.push({ registro: reg, motivo: `Residência não encontrada: ${reg.pavilhao}/${reg.galeria} Res ${reg.numeroResidencia}` });
      continue;
    }

    const internoExistente = internosAtivosMap.get(reg.prontuario);

    if (internoExistente) {
      // Já é ativo no sistema, verifica se mudou de lugar
      if (internoExistente.residenciaAtualId === residenciaId) {
        impacto.semMudanca.push(reg.prontuario);
      } else {
        const resObj = internoExistente.residenciaAtualId ? residenciasIdMap.get(internoExistente.residenciaAtualId) : null;
        const resDesc = resObj ? `${resObj.pavilhao}/${resObj.galeria}/${resObj.piso} / ${resObj.numeroResidencia}` : undefined;
        impacto.realocados.push({
          registro: reg,
          internoId: internoExistente.id,
          residenciaAnteriorId: internoExistente.residenciaAtualId,
          residenciaAnteriorDescricao: resDesc
        });
      }
    } else {
      // Não é ativo. Pode ser novo ou inativo.
      // Busca no banco se existe inativo
      const qInativo = query(collection(db, 'internos'), where('prontuario', '==', reg.prontuario));
      const snapInativo = await getDocs(qInativo);
      
      if (!snapInativo.empty) {
        impacto.reativados.push({
          registro: reg,
          internoId: snapInativo.docs[0].id,
        });
      } else {
        impacto.novos.push(reg);
      }
    }
  }

  // 4. Identifica inativados (estavam ativos no PRISMA mas não apareceram no relatório I-PEN 1.8)
  internosAtivosMap.forEach((dados, prontuario) => {
    if (!prontuariosNoRelatorio.has(prontuario)) {
      impacto.inativados.push({
        internoId: dados.id,
        nome: dados.nomeCompleto,
        prontuario: dados.prontuario,
      });
    }
  });

  return impacto;
}

// ---------------------------------------------------------------------------
// Execução da Sincronização
// ---------------------------------------------------------------------------

export async function executarSincronizacao(
  impacto: ImpactoSincronizacao,
  idUsuario: string
): Promise<void> {
  const batch = writeBatch(db);
  const agora = serverTimestamp();

  // Cache de residências para ID mapping
  const snapResidencias = await getDocs(query(collection(db, 'residencias'), where('ativo', '==', true)));
  const residenciasMap = new Map<string, string>();
  snapResidencias.forEach(d => residenciasMap.set(d.data().chaveUnica, d.id));

  // --- REGRA G: ORDEM DE NORMALIZAÇÃO ---
  
  // 1. Inativar quem saiu
  for (const inat of impacto.inativados) {
    const refInterno = doc(db, 'internos', inat.internoId);
    
    // Obtém dados atuais para fechar detenção/ocupação
    // NOTA: Em produção, seria ideal recuperar isso antes ou ter IDs no snapshot do impacto.
    // Para simplificar, assumimos que temos o internoId aqui.
    // Precisamos fechar a ocupação atual se houver.
    const qOcupacao = query(
      collection(db, 'ocupacoesAtuais'), 
      where('internoId', '==', inat.internoId),
      where('ativa', '==', true)
    );
    const snapOcup = await getDocs(qOcupacao);
    snapOcup.forEach(o => {
      batch.update(doc(db, 'ocupacoesAtuais', o.id), { ativa: false, encerradaEm: agora });
    });

    // Encerra detenção atual
    const qDetencao = query(
      collection(db, 'detencoes'),
      where('internoId', '==', inat.internoId),
      where('status', '==', 'ATIVA')
    );
    const snapDet = await getDocs(qDetencao);
    let detencaoIdEncerrada = '';
    snapDet.forEach(d => {
      detencaoIdEncerrada = d.id;
      batch.update(doc(db, 'detencoes', d.id), { status: 'ENCERRADA', encerradaEm: agora });
    });

    // Registra movimentação de SAÍDA
    const refMov = doc(collection(db, 'movimentacoes'));
    batch.set(refMov, {
      internoId: inat.internoId,
      detencaoId: detencaoIdEncerrada,
      tipoMovimentacao: 'SAIDA',
      registradaEm: agora,
      criadoPor: idUsuario,
      origemSincronizacao: true,
    });

    batch.update(refInterno, {
      statusSistema: 'INATIVO',
      dataSaidaAtual: agora,
      atualizadoEm: agora,
      residenciaAtualId: null,
      detencaoAtualId: null,
    });
  }

  // 2. Processar Realocações
  for (const mov of impacto.realocados) {
    const resId = residenciasMap.get(mov.registro.chaveResidencial)!;
    
    // Fecha ocupação anterior
    const qOcupAnt = query(
      collection(db, 'ocupacoesAtuais'),
      where('internoId', '==', mov.internoId),
      where('ativa', '==', true)
    );
    const snapOcupAnt = await getDocs(qOcupAnt);
    let detencaoId = '';
    snapOcupAnt.forEach(o => {
      detencaoId = o.data().detencaoId;
      batch.update(doc(db, 'ocupacoesAtuais', o.id), { ativa: false, encerradaEm: agora });
    });

    // Abre nova ocupação
    const refNovaOcup = doc(collection(db, 'ocupacoesAtuais'));
    batch.set(refNovaOcup, {
      internoId: mov.internoId,
      residenciaId: resId,
      detencaoId: detencaoId,
      iniciadaEm: agora,
      ativa: true,
    });

    // Calcula ordem na detenção (seria ideal buscar contagem, mas usaremos timestamp p/ simplicidade no momento)
    // Registro de Movimentação
    const refMov = doc(collection(db, 'movimentacoes'));
    batch.set(refMov, {
      internoId: mov.internoId,
      detencaoId: detencaoId,
      residenciaOrigemId: mov.residenciaAnteriorId,
      residenciaDestinoId: resId,
      tipoMovimentacao: 'MOVIMENTACAO_INTERNA',
      situacaoIpenOriginal: mov.registro.situacaoIpen,
      registradaEm: agora,
      criadoPor: idUsuario,
      origemSincronizacao: true,
    });

    batch.update(doc(db, 'internos', mov.internoId), {
      residenciaAtualId: resId,
      situacaoAtual: mov.registro.situacaoIpen,
      atualizadoEm: agora,
    });
  }

  // 3. Processar Reativações
  for (const reat of impacto.reativados) {
    const resId = residenciasMap.get(reat.registro.chaveResidencial)!;
    
    // Determina número da nova detenção
    const qDetAnt = query(collection(db, 'detencoes'), where('internoId', '==', reat.internoId), orderBy('numeroDetencao', 'desc'), limit(1));
    const snapDetAnt = await getDocs(qDetAnt);
    const proxNum = snapDetAnt.empty ? 1 : snapDetAnt.docs[0].data().numeroDetencao + 1;

    const refNovaDet = doc(collection(db, 'detencoes'));
    batch.set(refNovaDet, {
      internoId: reat.internoId,
      numeroDetencao: proxNum,
      status: 'ATIVA',
      iniciadaEm: agora,
      encerradaEm: null,
      origem: 'Sincronização 1.8 - Reativação',
      snapshotSituacaoInicial: reat.registro.situacaoIpen,
      criadoEm: agora,
    });

    const refMov = doc(collection(db, 'movimentacoes'));
    batch.set(refMov, {
      internoId: reat.internoId,
      detencaoId: refNovaDet.id,
      residenciaOrigemId: null,
      residenciaDestinoId: resId,
      tipoMovimentacao: 'REATIVACAO',
      situacaoIpenOriginal: reat.registro.situacaoIpen,
      registradaEm: agora,
      criadoPor: idUsuario,
      origemSincronizacao: true,
    });

    const refOcup = doc(collection(db, 'ocupacoesAtuais'));
    batch.set(refOcup, {
      internoId: reat.internoId,
      residenciaId: resId,
      detencaoId: refNovaDet.id,
      iniciadaEm: agora,
      ativa: true,
    });

    batch.update(doc(db, 'internos', reat.internoId), {
      statusSistema: 'ATIVO',
      detencaoAtualId: refNovaDet.id,
      residenciaAtualId: resId,
      situacaoAtual: reat.registro.situacaoIpen,
      dataEntradaAtual: agora,
      dataSaidaAtual: null,
      atualizadoEm: agora,
    });
  }

  // 4. Processar Novos Internos
  for (const novo of impacto.novos) {
    const resId = residenciasMap.get(novo.chaveResidencial)!;
    
    const refInterno = doc(collection(db, 'internos'));
    const refDetencao = doc(collection(db, 'detencoes'));
    const refOcupacao = doc(collection(db, 'ocupacoesAtuais'));
    const refMovimentacao = doc(collection(db, 'movimentacoes'));

    batch.set(refInterno, {
      prontuario: novo.prontuario,
      nomeCompleto: novo.nomeCompleto,
      situacaoAtual: novo.situacaoIpen,
      statusSistema: 'ATIVO',
      detencaoAtualId: refDetencao.id,
      residenciaAtualId: resId,
      dataEntradaAtual: agora,
      dataSaidaAtual: null,
      criadoEm: agora,
      atualizadoEm: agora,
      criadoPor: idUsuario,
    });

    batch.set(refDetencao, {
      internoId: refInterno.id,
      numeroDetencao: 1,
      status: 'ATIVA',
      iniciadaEm: agora,
      encerradaEm: null,
      origem: 'Sincronização 1.8 - Inclusão',
      snapshotSituacaoInicial: novo.situacaoIpen,
      criadoEm: agora,
    });

    batch.set(refOcupacao, {
      internoId: refInterno.id,
      residenciaId: resId,
      detencaoId: refDetencao.id,
      iniciadaEm: agora,
      ativa: true,
    });

    batch.set(refMovimentacao, {
      internoId: refInterno.id,
      detencaoId: refDetencao.id,
      ordemNaDetencao: 1,
      residenciaOrigemId: null,
      residenciaDestinoId: resId,
      tipoMovimentacao: 'ENTRADA',
      situacaoIpenOriginal: novo.situacaoIpen,
      registradaEm: agora,
      criadoPor: idUsuario,
      origemSincronizacao: true,
    });
  }

  await batch.commit();
}

/**
 * Agrupa os conflitos individuais por residência única ausente.
 */
export function agruparConflitosResidenciais(impacto: ImpactoSincronizacao): ConflitoResidencialAgrupado[] {
  const mapaConflitos = new Map<string, ConflitoResidencialAgrupado>();

  for (const conf of impacto.conflitos) {
    const reg = conf.registro;
    const existente = mapaConflitos.get(reg.chaveResidencial);

    if (existente) {
      existente.quantidadeInternosDetectados++;
      if (existente.prontuariosExemplo.length < 3) {
        existente.prontuariosExemplo.push(reg.prontuario);
      }
    } else {
      mapaConflitos.set(reg.chaveResidencial, {
        chaveResidencial: reg.chaveResidencial,
        ala: reg.ala,
        pavilhao: reg.pavilhao,
        galeria: reg.galeria,
        piso: reg.piso,
        tipoResidencia: reg.tipoResidencia,
        numeroResidencia: reg.numeroResidencia,
        quantidadeInternosDetectados: 1,
        prontuariosExemplo: [reg.prontuario],
      });
    }
  }

  return Array.from(mapaConflitos.values());
}
