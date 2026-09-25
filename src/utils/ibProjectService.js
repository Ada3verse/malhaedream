import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'

const IB_PROJECTS_COLLECTION = 'ib_projects'

export const IB_PROJECT_SECTIONS = [
  { key: 'briefing', label: '전체 브리핑', icon: '📋' },
  { key: 'inquiry_questions', label: '탐구질문', icon: '❓' },
  { key: 'statement', label: '탐구진술문', icon: '📝' },
  { key: 'assessment', label: '총괄평가', icon: '🎯' },
  { key: 'atl', label: 'ATL', icon: '🧠' },
  { key: 'formative', label: '형성평가', icon: '📊' },
]

export async function createIBProject({
  userId,
  title,
  subject,
  mypYear,
  keyConcept,
  relatedConcepts,
  globalContext,
  exploration,
  statementKeyword,
}) {
  const docRef = await addDoc(collection(db, IB_PROJECTS_COLLECTION), {
    userId,
    title,
    subject: subject ?? '',
    mypYear: mypYear ?? '',
    keyConcept: keyConcept ?? '',
    relatedConcepts: relatedConcepts ?? '',
    globalContext: globalContext ?? '',
    exploration: exploration ?? '',
    statementKeyword: statementKeyword ?? '',
    sections: {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return docRef.id
}

export async function getIBProjects(userId) {
  const snapshot = await getDocs(
    query(collection(db, IB_PROJECTS_COLLECTION), where('userId', '==', userId)),
  )

  return snapshot.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    .sort((a, b) => (b.updatedAt?.seconds ?? 0) - (a.updatedAt?.seconds ?? 0))
}

export async function getIBProject(projectId) {
  const snapshot = await getDoc(doc(db, IB_PROJECTS_COLLECTION, projectId))
  if (!snapshot.exists()) return null
  return { id: snapshot.id, ...snapshot.data() }
}

export async function updateIBProjectInfo(projectId, {
  title,
  subject,
  mypYear,
  keyConcept,
  relatedConcepts,
  globalContext,
  exploration,
  statementKeyword,
}) {
  await updateDoc(doc(db, IB_PROJECTS_COLLECTION, projectId), {
    title,
    subject,
    mypYear,
    keyConcept,
    relatedConcepts,
    globalContext,
    exploration,
    statementKeyword,
    updatedAt: serverTimestamp(),
  })
}

export async function saveIBProjectSection(projectId, sectionKey, { prompt }) {
  await updateDoc(doc(db, IB_PROJECTS_COLLECTION, projectId), {
    [`sections.${sectionKey}`]: {
      prompt,
      savedAt: new Date().toISOString(),
    },
    updatedAt: serverTimestamp(),
  })
}

export async function deleteIBProjectSection(projectId, sectionKey) {
  await updateDoc(doc(db, IB_PROJECTS_COLLECTION, projectId), {
    [`sections.${sectionKey}`]: deleteField(),
    updatedAt: serverTimestamp(),
  })
}

export async function deleteIBProject(projectId) {
  await deleteDoc(doc(db, IB_PROJECTS_COLLECTION, projectId))
}
