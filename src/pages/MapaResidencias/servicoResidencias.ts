/**
 * Mapa de Residências — Serviço Firestore (Português)
 *
 * Coleção: `residencias`
 * Soft delete: inativa o documento (ativo = false, inativadoEm = agora)
 * Leitura: sob demanda (sem listener em tempo real para esta listagem)
 *
 * NOTA: O projeto PRISMA utiliza os termos "Pavilhão" e "Galeria",
 * que equivalem a "Galeria" e "Bloco" no IPEN, respectivamente.
 */

import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Ala, TipoResidencia, Regime } from './tipos';
import type { Residencia, FormDataResidencia } from './tipos';
import { gerarChaveUnica, gerarRotuloExibicao } from './tipos';

const NOME_COLECAO = 'residencias';

// ---------------------------------------------------------------------------
// Helpers Internos de Conversão
// ---------------------------------------------------------------------------

function firebaseToResidencia(id: string, data: Record<string, unknown>): Residencia {
  return {
    id,
    ala: data.ala as Residencia['ala'],
    pavilhao: data.pavilhao as string,
    galeria: data.galeria as string,
    piso: data.piso as string,
    tipoResidencia: data.tipoResidencia as Residencia['tipoResidencia'],
    numeroResidencia: data.numeroResidencia as string,
    capacidade: data.capacidade as number,
    regime: data.regime as Residencia['regime'],
    chaveUnica: data.chaveUnica as string,
    rotuloExibicao: data.rotuloExibicao as string,
    chaveOrdenacao: data.chaveOrdenacao as string,
    ativo: data.ativo as boolean,
    criadoEm: (data.criadoEm as Timestamp)?.toDate?.() ?? new Date(),
    atualizadoEm: (data.atualizadoEm as Timestamp)?.toDate?.() ?? new Date(),
    criadoPor: data.criadoPor as string,
    atualizadoPor: data.atualizadoPor as string,
    inativadoEm: (data.inativadoEm as Timestamp)?.toDate?.(),
  };
}

// ---------------------------------------------------------------------------
// Funções de Leitura
// ---------------------------------------------------------------------------

/** 
 * Busca todas as residências ativas ordenadas pela chave de ordenação.
 * Implementa tratamento de erro robusto.
 */
export async function buscarResidencias(): Promise<Residencia[]> {
  try {
    const q = query(
      collection(db, NOME_COLECAO),
      where('ativo', '==', true),
      orderBy('chaveOrdenacao', 'asc'),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => firebaseToResidencia(d.id, d.data() as Record<string, unknown>));
  } catch (erro) {
    console.error('[Service] Erro ao buscar residências:', erro);
    throw new Error('Falha ao conectar com o banco de dados das residências.');
  }
}

// ---------------------------------------------------------------------------
// Funções de Escrita
// ---------------------------------------------------------------------------

/**
 * Cadastra uma nova residência.
 * Valida unicidade via chave composta antes de gravar.
 */
export async function cadastrarResidencia(
  dados: FormDataResidencia,
  idUsuario: string,
): Promise<Residencia> {
  try {
    const chaveUnica = gerarChaveUnica(dados);

    // Verificação de duplicidade lógica
    const qDuplicado = query(
      collection(db, NOME_COLECAO),
      where('chaveUnica', '==', chaveUnica),
      where('ativo', '==', true),
    );
    const snapDuplicado = await getDocs(qDuplicado);
    
    if (!snapDuplicado.empty) {
      throw new Error('Já existe uma residência ativa nesta Ala / Pavilhão / Galeria / Piso com este número.');
    }

    const agora = serverTimestamp();
    const rotuloExibicao = gerarRotuloExibicao(dados);
    const chaveOrdenacao = chaveUnica;

    const docRef = await addDoc(collection(db, NOME_COLECAO), {
      ala: dados.ala,
      pavilhao: dados.pavilhao.trim(),
      galeria: dados.galeria.trim(),
      piso: dados.piso.trim(),
      tipoResidencia: dados.tipoResidencia,
      numeroResidencia: dados.numeroResidencia.trim(),
      capacidade: dados.capacidade,
      regime: dados.regime,
      chaveUnica,
      rotuloExibicao,
      chaveOrdenacao,
      ativo: true,
      criadoEm: agora,
      atualizadoEm: agora,
      criadoPor: idUsuario,
      atualizadoPor: idUsuario,
    });

    return firebaseToResidencia(docRef.id, {
      ...dados,
      chaveUnica,
      rotuloExibicao,
      chaveOrdenacao,
      ativo: true,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
      criadoPor: idUsuario,
      atualizadoPor: idUsuario,
    });
  } catch (erro: any) {
    console.error('[Service] Erro ao cadastrar residência:', erro);
    
    // Tratamento explícito para erro de inicialização do Firestore
    if (erro?.message?.includes('Database \'(default)\' not found')) {
      throw new Error('O banco de dados Firestore não foi configurado ou está inacessível. Verifique a infraestrutura.');
    }
    
    throw erro;
  }
}

/**
 * Atualiza os dados de uma residência existente.
 */
export async function atualizarResidencia(
  id: string,
  dados: FormDataResidencia,
  idUsuario: string,
): Promise<void> {
  try {
    const chaveUnica = gerarChaveUnica(dados);

    // Verifica se a nova chave únicos já pertence a outro registro ativo
    const qDuplicado = query(
      collection(db, NOME_COLECAO),
      where('chaveUnica', '==', chaveUnica),
      where('ativo', '==', true),
    );
    const snapDuplicado = await getDocs(qDuplicado);
    const existeOutro = snapDuplicado.docs.some(d => d.id !== id);

    if (existeOutro) {
      throw new Error('A combinação informada conflita com outra residência ativa cadastrada.');
    }

    const rotuloExibicao = gerarRotuloExibicao(dados);
    
    await updateDoc(doc(db, NOME_COLECAO, id), {
      ala: dados.ala,
      pavilhao: dados.pavilhao.trim(),
      galeria: dados.galeria.trim(),
      piso: dados.piso.trim(),
      tipoResidencia: dados.tipoResidencia,
      numeroResidencia: dados.numeroResidencia.trim(),
      capacidade: dados.capacidade,
      regime: dados.regime,
      chaveUnica,
      rotuloExibicao,
      chaveOrdenacao: chaveUnica,
      atualizadoEm: serverTimestamp(),
      atualizadoPor: idUsuario,
    });
  } catch (erro: any) {
    console.error('[Service] Erro ao atualizar residência:', erro);
    throw erro;
  }
}

/**
 * Executa exclusão lógica (inativação) da residência.
 */
export async function inativarResidencia(
  id: string,
  idUsuario: string,
): Promise<void> {
  try {
    const agora = serverTimestamp();
    await updateDoc(doc(db, NOME_COLECAO, id), {
      ativo: false,
      inativadoEm: agora,
      atualizadoEm: agora,
      atualizadoPor: idUsuario,
    });
  } catch (erro: any) {
    console.error('[Service] Erro ao inativar residência:', erro);
    throw new Error('Não foi possível excluir o registro. Tente novamente.');
  }
}

// ---------------------------------------------------------------------------
// Importação em Lote (Carga Inicial)
// ---------------------------------------------------------------------------

export interface ResultadoImportacao {
  totalLido: number;
  totalImportado: number;
  totalIgnorado: number;
  erros: string[];
}

/**
 * Realiza a importação em lote a partir do conteúdo bruto do CSV.
 * Implementa lógica de idempotência baseada na chave única.
 */
export async function importarResidenciasCSV(
  conteudoCSV: string,
  idUsuario: string,
): Promise<ResultadoImportacao> {
  const resultado: ResultadoImportacao = {
    totalLido: 0,
    totalImportado: 0,
    totalIgnorado: 0,
    erros: [],
  };

  try {
    const linhas = conteudoCSV.split('\n').filter(l => l.trim() !== '');
    if (linhas.length < 2) throw new Error('O arquivo CSV está vazio ou inválido.');

    // Remove cabeçalho
    const registrosRaw = linhas.slice(1);
    resultado.totalLido = registrosRaw.length;

    // Busca chaves únicas já existentes para evitar duplicatas (idempotência)
    const snapshotExistentes = await getDocs(query(collection(db, NOME_COLECAO), where('ativo', '==', true)));
    const chavesExistentes = new Set(snapshotExistentes.docs.map(d => d.data().chaveUnica));

    const batch = writeBatch(db);
    let countNoBatch = 0;
    const agora = serverTimestamp();

    for (const linha of registrosRaw) {
      try {
        const colunas = linha.split(',').map(c => c.trim());
        if (colunas.length < 8) continue; // Linha inválida

        const [alaStr, pavilhao, galeria, piso, tipoStr, numero, capacidadeStr, regimeStr] = colunas;

        // Mapeamento de Ala
        let ala: Ala = Ala.NAO_INFORMADA;
        if (alaStr.toUpperCase() === 'MASCULINA') ala = Ala.MASCULINA;
        if (alaStr.toUpperCase() === 'FEMININA') ala = Ala.FEMININA;
        if (alaStr.toUpperCase() === 'NÃO INFORMADA') ala = Ala.NAO_INFORMADA;

        // Mapeamento de Tipo
        let tipoResidencia: TipoResidencia = TipoResidencia.CELA;
        const t = tipoStr.toUpperCase();
        if (t === 'SEGURO') tipoResidencia = TipoResidencia.SEGURO;
        if (t === 'TRIAGEM') tipoResidencia = TipoResidencia.TRIAGEM;
        if (t === 'CELA ESPECIAL') tipoResidencia = TipoResidencia.CELA_ESPECIAL;
        if (t === 'CELA') tipoResidencia = TipoResidencia.CELA;
        if (t === 'ALOJAMENTO INTERNO') tipoResidencia = TipoResidencia.ALOJAMENTO_INTERNO;
        if (t === 'ADAPTAÇÃO') tipoResidencia = TipoResidencia.ADAPTACAO;

        // Mapeamento de Regime
        let regime: Regime = Regime.NAO_INFORMADO;
        const r = regimeStr.toUpperCase();
        if (r === 'NÃO INFORMADO') regime = Regime.NAO_INFORMADO;
        if (r === 'PROVISÓRIO') regime = Regime.PROVISORIO;
        if (r === 'FECHADO') regime = Regime.FECHADO;

        const dados: FormDataResidencia = {
          ala,
          pavilhao,
          galeria,
          piso,
          tipoResidencia,
          numeroResidencia: numero,
          capacidade: parseInt(capacidadeStr, 10) || 0,
          regime,
        };

        const chaveUnica = gerarChaveUnica(dados);

        // Ignora se já existir (Idempotência)
        if (chavesExistentes.has(chaveUnica)) {
          resultado.totalIgnorado++;
          continue;
        }

        const docRef = doc(collection(db, NOME_COLECAO));
        batch.set(docRef, {
          ala,
          pavilhao,
          galeria,
          piso,
          tipoResidencia,
          numeroResidencia: numero,
          capacidade: dados.capacidade,
          regime,
          chaveUnica,
          rotuloExibicao: gerarRotuloExibicao(dados),
          chaveOrdenacao: chaveUnica,
          ativo: true,
          criadoEm: agora,
          atualizadoEm: agora,
          criadoPor: idUsuario,
          atualizadoPor: idUsuario,
        });

        countNoBatch++;
        resultado.totalImportado++;
        chavesExistentes.add(chaveUnica); // Evita duplicatas dentro do próprio CSV

      } catch (e: any) {
        resultado.erros.push(`Erro na linha: ${linha} -> ${e.message}`);
      }
    }

    if (countNoBatch > 0) {
      await batch.commit();
    }

    return resultado;
  } catch (erro: any) {
    console.error('[Service] Erro crítico na importação CSV:', erro);
    throw erro;
  }
}
