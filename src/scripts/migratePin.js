import { initializeApp } from 'firebase/app'
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  updateDoc,
} from 'firebase/firestore'
import { hashPin } from '../utils/hash.js'

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

const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/

async function migratePins() {
  const snapshot = await getDocs(collection(db, 'users'))

  for (const docSnap of snapshot.docs) {
    const user = docSnap.data()
    const updates = {}

    if (!SHA256_HEX_PATTERN.test(user.pin ?? '')) {
      updates.pin = await hashPin(user.pin)
    }

    if (user.loginFailCount === undefined) {
      updates.loginFailCount = 0
    }

    if (Object.keys(updates).length === 0) {
      console.log(`변경 없음(이미 해시됨): ${user.nickname}`)
      continue
    }

    await updateDoc(doc(db, 'users', docSnap.id), updates)
    console.log(`마이그레이션됨: ${user.nickname}`)
  }
}

migratePins()
  .then(() => {
    console.log('마이그레이션 완료')
    process.exit(0)
  })
  .catch((err) => {
    console.error('마이그레이션 실패:', err)
    process.exit(1)
  })
