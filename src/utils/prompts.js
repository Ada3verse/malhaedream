import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'

const HISTORY_LIMIT = 30 // 사용자당 자동저장 최대 보관 수

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
    isSaved: true,
    isFavorite: false,
    copyCount: 0,
    createdAt: serverTimestamp(),
  })
}

// 프롬프트 생성 시 자동저장 (isSaved: false)
// 반환값: 생성된 문서 id (저장 버튼 클릭 시 업데이트용)
export async function autoSavePrompt({ nickname, deviceId, type, content, templateName }) {
  // 30개 초과 시 오래된 미저장 항목 삭제
  const oldQuery = query(
    collection(db, PROMPTS_COLLECTION),
    where('nickname', '==', nickname),
    where('deviceId', '==', deviceId),
    where('isSaved', '==', false),
    orderBy('createdAt', 'asc'),
  )
  const oldSnap = await getDocs(oldQuery)
  if (oldSnap.size >= HISTORY_LIMIT) {
    const toDelete = oldSnap.docs.slice(0, oldSnap.size - HISTORY_LIMIT + 1)
    await Promise.all(toDelete.map((d) => deleteDoc(d.ref)))
  }

  const docRef = await addDoc(collection(db, PROMPTS_COLLECTION), {
    nickname,
    deviceId,
    type,
    content,
    templateName: templateName ?? null,
    tags: [],
    isShared: false,
    isSaved: false,
    isFavorite: false,
    copyCount: 0,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

// 자동저장 항목을 정식 저장으로 업데이트
export async function markPromptSaved(id, { tags, isShared = true }) {
  await updateDoc(doc(db, PROMPTS_COLLECTION, id), {
    isSaved: true,
    tags: tags ?? [],
    isShared,
  })
}

// 생성 내역 조회 (isSaved 무관, 최신순)
export async function getHistoryByUser(nickname, deviceId) {
  const snapshot = await getDocs(
    query(
      collection(db, PROMPTS_COLLECTION),
      where('nickname', '==', nickname),
      where('deviceId', '==', deviceId),
      orderBy('createdAt', 'desc'),
      limit(HISTORY_LIMIT),
    ),
  )
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
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
