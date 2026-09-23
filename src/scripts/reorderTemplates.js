import { initializeApp } from 'firebase/app'
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const orderUpdates = [
  { name: '이미지 생성 프롬프트', order: 1 },
  { name: '수업 지도안', order: 2 },
  { name: '학습지', order: 3 },
  { name: '독서 활동지', order: 4 },
  { name: '진로 탐색 활동지', order: 5 },
  { name: '지필평가 문제', order: 6 },
  { name: '형성평가 문항', order: 7 },
  { name: '수행평가 문항', order: 8 },
  { name: '쪽지 시험', order: 9 },
  { name: '학생 피드백', order: 10 },
  { name: '가정통신문', order: 11 },
  { name: '사업계획서', order: 12 },
  { name: '행사보고서', order: 13 },
  { name: '공문 초안', order: 14 },
  { name: '회의록', order: 15 },
  { name: '출장 보고서', order: 16 },
  { name: '학급 규칙 안내문', order: 17 },
  { name: '상담 일지', order: 18 },
  { name: '기타', order: 19 },
]

async function reorderTemplates() {
  const templatesRef = collection(db, 'templates')

  for (const update of orderUpdates) {
    const snapshot = await getDocs(
      query(templatesRef, where('name', '==', update.name)),
    )

    if (snapshot.empty) {
      console.log(`찾을 수 없음, 건너뜀: ${update.name}`)
      continue
    }

    for (const docSnap of snapshot.docs) {
      await updateDoc(doc(db, 'templates', docSnap.id), {
        order: update.order,
      })
      console.log(`업데이트됨: ${update.name} -> order ${update.order} (id=${docSnap.id})`)
    }
  }
}

reorderTemplates()
  .then(() => {
    console.log('순서 업데이트 완료')
    process.exit(0)
  })
  .catch((err) => {
    console.error('업데이트 실패:', err)
    process.exit(1)
  })
