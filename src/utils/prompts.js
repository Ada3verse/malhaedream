import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'

const PROMPTS_COLLECTION = 'prompts'

export async function savePrompt({ nickname, type, content }) {
  await addDoc(collection(db, PROMPTS_COLLECTION), {
    nickname,
    type,
    content,
    createdAt: serverTimestamp(),
  })
}

export async function getPromptsByNickname(nickname) {
  const snapshot = await getDocs(
    query(collection(db, PROMPTS_COLLECTION), where('nickname', '==', nickname)),
  )

  return snapshot.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
}

export async function deletePrompt(id) {
  await deleteDoc(doc(db, PROMPTS_COLLECTION, id))
}
