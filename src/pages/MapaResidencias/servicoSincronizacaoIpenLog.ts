/* eslint-disable @typescript-eslint/no-explicit-any */
import { collection, doc, getDocs, setDoc, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import type { ResumoSincronizacao, ImpactoSincronizacao } from './servicoSincronizacao';

export interface SincronizacaoIpenLog {
  id: string;
  tipoRelatorio: 'RELATORIO_1_8_ALOCADOS';
  sincronizadoEm: any; // Timestamp
  sincronizadoPor: string;
  sincronizacaoAnteriorEm: any | null; // Timestamp
  resumo: ResumoSincronizacao;
  detalhes: {
    novos: any[];
    realocados: any[];
    reativados: any[];
    inativados: any[];
  };
  origem: 'MAPA_RESIDENCIAS';
}

export async function buscarUltimaSincronizacao(): Promise<SincronizacaoIpenLog | null> {
  const q = query(
    collection(db, 'sincronizacoesIpen'),
    orderBy('sincronizadoEm', 'desc'),
    limit(1)
  );
  
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as SincronizacaoIpenLog;
}

export async function registrarHistoricoSincronizacao(
  impacto: ImpactoSincronizacao,
  resumo: ResumoSincronizacao,
  ultimaSincronizacaoEm: any | null,
  idUsuario: string
): Promise<SincronizacaoIpenLog> {
  const ref = doc(collection(db, 'sincronizacoesIpen'));
  const agora = serverTimestamp();

  // Mapeamos detalhes simplificados para o log para não exceder tamanho do documento FireStore
  const mapearReg = (r: any) => ({
    prontuario: r.prontuario,
    nomeCompleto: r.nomeCompleto || r.nome,
    ala: r.ala || '',
    pavilhao: r.pavilhao || '',
    galeria: r.galeria || '',
    piso: r.piso || '',
    tipoResidencia: r.tipoResidencia || '',
    numeroResidencia: r.numeroResidencia || '',
  });

  const loadData: Omit<SincronizacaoIpenLog, 'id'> = {
    tipoRelatorio: 'RELATORIO_1_8_ALOCADOS',
    sincronizadoEm: agora,
    sincronizadoPor: idUsuario,
    sincronizacaoAnteriorEm: ultimaSincronizacaoEm,
    resumo,
    origem: 'MAPA_RESIDENCIAS',
    detalhes: {
      novos: impacto.novos.map(mapearReg),
      realocados: impacto.realocados.map(r => ({
        ...mapearReg(r.registro),
        residenciaAnteriorId: r.residenciaAnteriorId
      })),
      reativados: impacto.reativados.map(r => mapearReg(r.registro)),
      inativados: impacto.inativados.map(i => ({
        prontuario: i.prontuario,
        nomeCompleto: i.nome,
        internoId: i.internoId
      }))
    }
  };

  await setDoc(ref, loadData);

  return { id: ref.id, ...loadData };
}
