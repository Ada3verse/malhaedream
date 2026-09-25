import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'

const IB_PROJECTS_COLLECTION = 'ibProjects'

// project.sections 안에서 xlsx 내보내기 등에서 사용하는 섹션 키 목록
export const IB_PROJECT_SECTION_KEYS = ['unitPlan', 'inquiry', 'statement', 'assessment', 'atl']

function belongsToDevice(projectData, deviceId) {
  return !projectData.deviceId || projectData.deviceId === deviceId
}

function cleanBasicInfo(info = {}) {
  const cleaned = {}
  for (const [key, value] of Object.entries(info)) {
    if (value !== undefined && value !== null && value !== '') {
      cleaned[key] = value
    }
  }
  return cleaned
}

export async function createIBProject({ nickname, deviceId, ...basicInfo }) {
  const docRef = await addDoc(collection(db, IB_PROJECTS_COLLECTION), {
    nickname,
    deviceId,
    ...cleanBasicInfo(basicInfo),
    sections: {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateIBProjectInfo(id, basicInfo) {
  const cleaned = cleanBasicInfo(basicInfo)
  if (Object.keys(cleaned).length === 0) return
  await updateDoc(doc(db, IB_PROJECTS_COLLECTION, id), {
    ...cleaned,
    updatedAt: serverTimestamp(),
  })
}

export async function updateIBProjectSection(id, sectionKey, { prompt, aiTool }) {
  await updateDoc(doc(db, IB_PROJECTS_COLLECTION, id), {
    [`sections.${sectionKey}`]: {
      prompt: prompt ?? '',
      aiTool: aiTool ?? 'ChatGPT',
      updatedAt: new Date().toISOString(),
    },
    updatedAt: serverTimestamp(),
  })
}

export async function getIBProjectsByNickname(nickname, deviceId) {
  const snapshot = await getDocs(
    query(collection(db, IB_PROJECTS_COLLECTION), where('nickname', '==', nickname)),
  )

  return snapshot.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    .filter((item) => belongsToDevice(item, deviceId))
    .sort((a, b) => (b.updatedAt?.seconds ?? 0) - (a.updatedAt?.seconds ?? 0))
}

export async function getIBProjectById(id) {
  const snapshot = await getDoc(doc(db, IB_PROJECTS_COLLECTION, id))
  if (!snapshot.exists()) return null
  return { id: snapshot.id, ...snapshot.data() }
}

export async function deleteIBProject(id, { nickname, deviceId }) {
  const docRef = doc(db, IB_PROJECTS_COLLECTION, id)
  const snapshot = await getDoc(docRef)

  if (!snapshot.exists()) return

  const data = snapshot.data()
  const isOwner = data.nickname === nickname && belongsToDevice(data, deviceId)

  if (!isOwner) {
    throw new Error('삭제 권한이 없습니다.')
  }

  await deleteDoc(docRef)
}
