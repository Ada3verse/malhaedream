import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'

const PRESETS_COLLECTION = 'presets'
const PRESETS_LIMIT = 10

export async function savePreset({ nickname, deviceId, type, name, inputs }) {
  // 10개 초과 시 가장 오래된 항목 삭제
  const existingQuery = query(
    collection(db, PRESETS_COLLECTION),
    where('nickname', '==', nickname),
    where('deviceId', '==', deviceId),
    where('type', '==', type),
    orderBy('createdAt', 'asc'),
  )
  const existingSnap = await getDocs(existingQuery)
  if (existingSnap.size >= PRESETS_LIMIT) {
    const toDelete = existingSnap.docs.slice(0, existingSnap.size - PRESETS_LIMIT + 1)
    await Promise.all(toDelete.map((d) => deleteDoc(d.ref)))
  }

  await addDoc(collection(db, PRESETS_COLLECTION), {
    nickname,
    deviceId,
    type,
    name,
    inputs,
    createdAt: serverTimestamp(),
  })
}

export async function getPresets({ nickname, deviceId, type }) {
  const snapshot = await getDocs(
    query(
      collection(db, PRESETS_COLLECTION),
      where('nickname', '==', nickname),
      where('deviceId', '==', deviceId),
      where('type', '==', type),
    ),
  )
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
}

export async function deletePreset(id) {
  await deleteDoc(doc(db, PRESETS_COLLECTION, id))
}
