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
  realocados: { registro: RegistroExtraido; internoId: string; residenciaAnteriorId: string }[];
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
}

// ---------------------------------------------------------------------------
// Parser do Relatório 1.8 (Bruto)
// ---------------------------------------------------------------------------

/**
 * Extrai registros do texto bruto do relatório 1.8.
 * Lida com quebras de linha e repetições de cabeçalho.
 */
export function extrairDadosRelatorio(textoBruto: string): RegistroExtraido[] {
  const registros: RegistroExtraido[] = [];
  const linhas = textoBruto.split('\n').map(l => l.trim()).filter(l => l !== '');
  
  let registroAtual: Partial<RegistroExtraido> & { bufferNome?: string[]; bufferSituacao?: string[] } = {};

  const regexProntuario = /^\d{6,10}$/; // Exemplo: 123456

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];

    // Ignora cabeçalhos institucionais conhecidos
    if (linha.includes('SISTEMA DE GESTÃO PRISIONAL') || 
        linha.includes('Relatório 1.8') || 
        linha.includes('LISTAGEM DE INTERNOS ALOCADOS')) {
      continue;
    }

    // Se a linha começa com o prontuário, iniciamos um novo registro
    const partes = linha.split(/\s+/);
    if (regexProntuario.test(partes[0])) {
      // Salva o anterior se estiver completo
      if (registroAtual.prontuario) {
        finalizarRegistro(registroAtual, registros);
      }

      // Reinicia
      registroAtual = {
        prontuario: partes[0],
        bufferNome: [],
        bufferSituacao: [],
      };

      // Tenta extrair o que sobrar da linha
      // No relatório 1.8, geralmente o nome segue o prontuário na mesma linha
      if (partes.length > 1) {
        // Encontra onde começa a Ala (M, F ou N I)
        const indexAla = partes.findIndex((p, idx) => idx > 0 && (p === 'M' || p === 'F' || (p === 'N' && partes[idx+1] === 'I')));
        
        if (indexAla !== -1) {
          registroAtual.bufferNome = partes.slice(1, indexAla);
          
          // Mapeia Ala
          if (partes[indexAla] === 'M') registroAtual.ala = Ala.MASCULINA;
          else if (partes[indexAla] === 'F') registroAtual.ala = Ala.FEMININA;
          else {
            registroAtual.ala = Ala.NAO_INFORMADA;
            // partes[indexAla] é 'N', partes[indexAla+1] é 'I'
          }

          // A estrutura após a ala costuma ser: GAL BLOCO PISO TIPO RESIDENCIA
          // Mas como os nomes e situações podem quebrar linha, o parser precisa ser astuto.
          // Para esta versão, vamos assumir que o restande da linha contém os dados residenciais
          // se ela for longa o suficiente, ou deixaremos para as próximas linhas.
        } else {
          // Ala não encontrada na primeira linha, o resto é nome
          registroAtual.bufferNome = partes.slice(1);
        }
      }
    } else if (registroAtual.prontuario) {
      // Se não é prontuário e temos um registro em aberto, a linha pode ser:
      // 1. Continuação do nome
      // 2. Situação
      // 3. Bloco de localização (Ala, Gal, Bloco, Piso, Tipo, Res)

      // Se a linha contém marcadores de localização (ex: Galeria/Bloco/Piso)
      // costumam ser números curtos ou letras.
      // Uma heurística comum é procurar o Tipo Residência
      const tipoIdentificado = identificarTipoResidencia(linha);
      
      if (tipoIdentificado) {
        registroAtual.tipoResidencia = tipoIdentificado;
        // Se identificou o tipo, esta linha provavelmente contém a localização completa
        // Tentamos extrair: Ala Gal Bloco Piso Tipo Resid
        // Mas a Ala já pode ter sido pega.
        processarLinhaLocalizacao(linha, registroAtual);
      } else {
        // Se ainda não temos a localização, e não identificamos o tipo,
        // pode ser parte da situação ou continuação do nome.
        // Geralmente nomes são MAIÚSCULOS, situações são Capitalizadas ou mistas.
        if (linha === linha.toUpperCase() && !/\d/.test(linha)) {
          registroAtual.bufferNome?.push(linha);
        } else {
          registroAtual.bufferSituacao?.push(linha);
        }
      }
    }
  }

  // Salva o último
  if (registroAtual.prontuario) {
    finalizarRegistro(registroAtual, registros);
  }

  return registros;
}

function identificarTipoResidencia(linha: string): TipoResidencia | null {
  const l = linha.toUpperCase();
  if (l.includes('CELA ESPECIAL')) return TipoResidencia.CELA_ESPECIAL;
  if (l.includes('ALOJAMENTO INTERNO')) return TipoResidencia.ALOJAMENTO_INTERNO;
  if (l.includes('TRIAGEM PNE')) return TipoResidencia.TRIAGEM_PNE;
  if (l.includes('PRISÃO CIVIL')) return TipoResidencia.PRISAO_CIVIL;
  if (l.includes('SEGURO')) return TipoResidencia.SEGURO;
  if (l.includes('TRIAGEM')) return TipoResidencia.TRIAGEM;
  if (l.includes('CELA')) return TipoResidencia.CELA;
  if (l.includes('ADAPTAÇÃO')) return TipoResidencia.ADAPTACAO;
  if (l.includes('LGBT')) return TipoResidencia.LGBT;
  return null;
}

function processarLinhaLocalizacao(linha: string, registro: Partial<RegistroExtraido>) {
  const partes = linha.split(/\s+/).map(p => p.trim());
  
  // Exemplo de linha: M 01 A T CELA 005
  // Ala (M), Galeria (01), Bloco (A), Piso (T), Tipo (CELA), Resid (005)
  // Lembre-se: Galeria IPEN -> Pavilhão PRISMA, Bloco IPEN -> Galeria PRISMA
  
  // Tenta encontrar a Ala se não tiver
  const indexAla = partes.findIndex(p => p === 'M' || p === 'F' || p === 'N');
  let offset = 0;
  if (indexAla !== -1) {
    if (partes[indexAla] === 'M') registro.ala = Ala.MASCULINA;
    else if (partes[indexAla] === 'F') registro.ala = Ala.FEMININA;
    else if (partes[indexAla] === 'N' && partes[indexAla+1] === 'I') registro.ala = Ala.NAO_INFORMADA;
    offset = (partes[indexAla] === 'N') ? indexAla + 2 : indexAla + 1;
  }

  // Se temos as partes restantes (Gal Bloco Piso Tipo Res)
  const restantes = partes.slice(offset);
  if (restantes.length >= 4) {
    registro.pavilhao = restantes[0]; // Galeria IPEN
    registro.galeria = restantes[1];  // Bloco IPEN
    registro.piso = restantes[2];
    // O tipo já foi identificado pela função chamadora ou podemos confirmar aqui
    // A residência costuma ser o último elemento
    registro.numeroResidencia = restantes[restantes.length - 1];
  }
}

function finalizarRegistro(reg: any, lista: RegistroExtraido[]) {
  if (!reg.prontuario) return;

  const nomeCompleto = (reg.bufferNome || []).join(' ').trim();
  const situacaoIpen = (reg.bufferSituacao || []).join(' ').trim();

  // Consolida o registro
  // Garante valores padrão caso falte algo
  const extraido: RegistroExtraido = {
    prontuario: reg.prontuario,
    nomeCompleto: nomeCompleto || 'NOME NÃO IDENTIFICADO',
    situacaoIpen: situacaoIpen || 'SITUAÇÃO NÃO INFORMADA',
    ala: reg.ala || Ala.NAO_INFORMADA,
    pavilhao: reg.pavilhao || '?',
    galeria: reg.galeria || '?',
    piso: reg.piso || '?',
    tipoResidencia: reg.tipoResidencia || TipoResidencia.CELA,
    numeroResidencia: reg.numeroResidencia || '?',
    chaveResidencial: '', // Será preenchido abaixo
  };

  // Gera a chave residential para bater com o banco
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

  lista.push(extraido);
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
  snapResidencias.forEach(d => residenciasMap.set(d.data().chaveUnica, d.id));

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
        impacto.realocados.push({
          registro: reg,
          internoId: internoExistente.id,
          residenciaAnteriorId: internoExistente.residenciaAtualId,
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
