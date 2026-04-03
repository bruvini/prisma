import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot
} from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import type { Indicador, FormDataIndicador } from './tipos';

const COLLECTION_NAME = 'indicadores';

/**
 * Converte documento Firestore para Indicador.
 */
const converterIndicador = (doc: QueryDocumentSnapshot<DocumentData>): Indicador => {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    criadoEm: data.criadoEm instanceof Timestamp ? data.criadoEm.toDate() : new Date(data.criadoEm),
    atualizadoEm: data.atualizadoEm instanceof Timestamp ? data.atualizadoEm.toDate() : new Date(data.atualizadoEm),
  } as Indicador;
};

/**
 * Lista todos os indicadores ativos.
 */
export async function listarIndicadores(): Promise<Indicador[]> {
  const q = query(
    collection(db, COLLECTION_NAME), 
    where('ativo', '==', true)
  );
  
  const querySnapshot = await getDocs(q);
  const lista = querySnapshot.docs.map(converterIndicador);
  
  // Ordenação em memória para evitar a necessidade de índice composto imediato
  return lista.sort((a, b) => a.tituloResumido.localeCompare(b.tituloResumido));
}

/**
 * Cria um novo indicador.
 */
export async function criarIndicador(dados: FormDataIndicador): Promise<string> {
  const user = auth.currentUser;
  const agora = new Date();
  
  const payload = {
    ...dados,
    ativo: true,
    criadoEm: agora,
    atualizadoEm: agora,
    criadoPor: user?.email || 'sistema',
    atualizadoPor: user?.email || 'sistema'
  };
  
  const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);
  return docRef.id;
}

/**
 * Atualiza um indicador existente.
 */
export async function atualizarIndicador(id: string, dados: Partial<FormDataIndicador>): Promise<void> {
  const user = auth.currentUser;
  const docRef = doc(db, COLLECTION_NAME, id);
  
  const payload = {
    ...dados,
    atualizadoEm: new Date(),
    atualizadoPor: user?.email || 'sistema'
  };
  
  await updateDoc(docRef, payload);
}

/**
 * Inativa (exclusão lógica) um indicador.
 */
export async function inativarIndicador(id: string): Promise<void> {
  const user = auth.currentUser;
  const docRef = doc(db, COLLECTION_NAME, id);
  
  await updateDoc(docRef, {
    ativo: false,
    atualizadoEm: new Date(),
    atualizadoPor: user?.email || 'sistema'
  });
}
