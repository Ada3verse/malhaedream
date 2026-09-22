import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'

const PROMPTS_COLLECTION = 'prompts'

function belongsToDevice(promptData, deviceId) {
  return !promptData.deviceId || promptData.deviceId === deviceId
}

export async function savePrompt({
  nickname,
  deviceId,
  type,
  content,
  templateName,
  tags,
}) {
  await addDoc(collection(db, PROMPTS_COLLECTION), {
    nickname,
    deviceId,
    type,
    content,
    templateName: templateName ?? null,
    tags: tags ?? [],
    isShared: true,
    isFavorite: false,
    copyCount: 0,
    createdAt: serverTimestamp(),
  })
}

export async function toggleFavorite(id, isFavorite) {
  await updateDoc(doc(db, PROMPTS_COLLECTION, id), { isFavorite })
}

export async function incrementCopyCount(id) {
  await updateDoc(doc(db, PROMPTS_COLLECTION, id), { copyCount: increment(1) })
}

export async function getSharedPrompts() {
  const snapshot = await getDocs(
    query(collection(db, PROMPTS_COLLECTION), where('isShared', '==', true)),
  )

  return snapshot.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
}

export async function getPromptsByNickname(nickname, deviceId) {
  const snapshot = await getDocs(
    query(collection(db, PROMPTS_COLLECTION), where('nickname', '==', nickname)),
  )

  return snapshot.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    .filter((item) => belongsToDevice(item, deviceId))
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
}

export async function deletePrompt(id, { nickname, deviceId }) {
  const docRef = doc(db, PROMPTS_COLLECTION, id)
  const snapshot = await getDoc(docRef)

  if (!snapshot.exists()) return

  const data = snapshot.data()
  const isOwner = data.nickname === nickname && belongsToDevice(data, deviceId)

  if (!isOwner) {
    throw new Error('삭제 권한이 없습니다.')
  }

  await deleteDoc(docRef)
}

export async function getAllPrompts() {
  const snapshot = await getDocs(collection(db, PROMPTS_COLLECTION))

  return snapshot.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
}

export async function unsharePrompt(id) {
  await updateDoc(doc(db, PROMPTS_COLLECTION, id), { isShared: false })
}

export async function getPromptById(id) {
  const snapshot = await getDoc(doc(db, PROMPTS_COLLECTION, id))
  if (!snapshot.exists()) return null
  return { id: snapshot.id, ...snapshot.data() }
}
