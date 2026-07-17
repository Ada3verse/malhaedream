import { initializeApp } from 'firebase/app'
import {
  addDoc,
  collection,
  getDocs,
  getFirestore,
  query,
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

const testUsers = [
  { nickname: '테스트교사', pin: '1234', role: 'teacher' },
  { nickname: '관리자', pin: '0000', role: 'admin' },
]

async function seedUsers() {
  const usersRef = collection(db, 'users')

  for (const user of testUsers) {
    const existing = await getDocs(
      query(usersRef, where('nickname', '==', user.nickname)),
    )

    if (!existing.empty) {
      console.log(`이미 존재함, 건너뜀: ${user.nickname}`)
      continue
    }

    await addDoc(usersRef, user)
    console.log(`추가됨: ${user.nickname} (${user.role})`)
  }
}

seedUsers()
  .then(() => {
    console.log('시드 완료')
    process.exit(0)
  })
  .catch((err) => {
    console.error('시드 실패:', err)
    process.exit(1)
  })
