import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase'

const TEMPLATES_COLLECTION = 'templates'

export async function getAllTemplates() {
  const snapshot = await getDocs(collection(db, TEMPLATES_COLLECTION))

  return snapshot.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

export async function addTemplate(data) {
  await addDoc(collection(db, TEMPLATES_COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
  })
}

export async function updateTemplate(id, data) {
  await updateDoc(doc(db, TEMPLATES_COLLECTION, id), data)
}

export async function deleteTemplate(id) {
  await deleteDoc(doc(db, TEMPLATES_COLLECTION, id))
}
