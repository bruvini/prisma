/**
 * Mapa de Residências — Serviço Firestore
 *
 * Coleção: `residences`
 * Soft delete: inativa o documento (active = false, inactivatedAt = now)
 * Leitura: sob demanda com reuso em sessão (sem listener em tempo real para esta listagem)
 *
 * Decisões de cache:
 *   - Nenhum listener onSnapshot é registrado para a listagem.
 *   - Após mutação (create/update/delete), o chamador deve chamar fetchResidences() novamente.
 *   - O módulo não guarda estado fora do componente para evitar staleness silencioso.
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
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import type { Residence, ResidenceFormData } from './types';
import { buildUniqueKey, buildDisplayLabel } from './types';

const COLLECTION = 'residences';

// ---------------------------------------------------------------------------
// Leitura
// ---------------------------------------------------------------------------

function docToResidence(id: string, data: Record<string, unknown>): Residence {
  return {
    id,
    ala: data.ala as Residence['ala'],
    pavilion: data.pavilion as string,
    gallery: data.gallery as string,
    floor: data.floor as string,
    residenceType: data.residenceType as Residence['residenceType'],
    residenceNumber: data.residenceNumber as string,
    capacity: data.capacity as number,
    regime: data.regime as Residence['regime'],
    uniqueKey: data.uniqueKey as string,
    displayLabel: data.displayLabel as string,
    sortKey: data.sortKey as string,
    active: data.active as boolean,
    createdAt: (data.createdAt as Timestamp)?.toDate?.() ?? new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate?.() ?? new Date(),
    createdBy: data.createdBy as string,
    updatedBy: data.updatedBy as string,
    inactivatedAt: data.inactivatedAt
      ? (data.inactivatedAt as Timestamp).toDate()
      : undefined,
  };
}

/** Busca todas residências ativas, ordenadas pelo sortKey. */
export async function fetchResidences(): Promise<Residence[]> {
  const q = query(
    collection(db, COLLECTION),
    where('active', '==', true),
    orderBy('sortKey', 'asc'),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => docToResidence(d.id, d.data() as Record<string, unknown>));
}

// ---------------------------------------------------------------------------
// Escrita
// ---------------------------------------------------------------------------

/**
 * Cria uma nova residência.
 * Verifica unicidade pelo uniqueKey antes de gravar.
 */
export async function createResidence(
  data: ResidenceFormData,
  userId: string,
): Promise<Residence> {
  const uniqueKey = buildUniqueKey(data);

  // Verificar duplicidade
  const dupQ = query(
    collection(db, COLLECTION),
    where('uniqueKey', '==', uniqueKey),
    where('active', '==', true),
  );
  const dupSnap = await getDocs(dupQ);
  if (!dupSnap.empty) {
    throw new Error('Já existe uma residência ativa com essa combinação de Ala / Pavilhão / Galeria / Piso / Número.');
  }

  const now = serverTimestamp();
  const sortKey = uniqueKey;
  const displayLabel = buildDisplayLabel(data);

  const docRef = await addDoc(collection(db, COLLECTION), {
    ala: data.ala,
    pavilion: data.pavilion.trim(),
    gallery: data.gallery.trim(),
    floor: data.floor.trim(),
    residenceType: data.residenceType,
    residenceNumber: data.residenceNumber.trim(),
    capacity: data.capacity,
    regime: data.regime,
    uniqueKey,
    displayLabel,
    sortKey,
    active: true,
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
    updatedBy: userId,
  });

  return {
    id: docRef.id,
    ...data,
    pavilion: data.pavilion.trim(),
    gallery: data.gallery.trim(),
    floor: data.floor.trim(),
    residenceNumber: data.residenceNumber.trim(),
    uniqueKey,
    displayLabel,
    sortKey,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: userId,
    updatedBy: userId,
  };
}

/**
 * Atualiza uma residência existente.
 * Verifica unicidade para evitar colisão com outro registro ativo.
 */
export async function updateResidence(
  id: string,
  data: ResidenceFormData,
  userId: string,
): Promise<void> {
  const uniqueKey = buildUniqueKey(data);

  // Verificar duplicidade excluindo o próprio documento
  const dupQ = query(
    collection(db, COLLECTION),
    where('uniqueKey', '==', uniqueKey),
    where('active', '==', true),
  );
  const dupSnap = await getDocs(dupQ);
  const hasDuplicate = dupSnap.docs.some(d => d.id !== id);
  if (hasDuplicate) {
    throw new Error('Já existe outra residência ativa com essa combinação de Ala / Pavilhão / Galeria / Piso / Número.');
  }

  const displayLabel = buildDisplayLabel(data);
  const sortKey = uniqueKey;

  await updateDoc(doc(db, COLLECTION, id), {
    ala: data.ala,
    pavilion: data.pavilion.trim(),
    gallery: data.gallery.trim(),
    floor: data.floor.trim(),
    residenceType: data.residenceType,
    residenceNumber: data.residenceNumber.trim(),
    capacity: data.capacity,
    regime: data.regime,
    uniqueKey,
    displayLabel,
    sortKey,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
}

/**
 * Soft delete: marca como inativa com trilha de auditoria.
 * Não remove o documento para preservar referências futuras (ex.: residence_assignments).
 */
export async function inactivateResidence(
  id: string,
  userId: string,
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    active: false,
    inactivatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
}
