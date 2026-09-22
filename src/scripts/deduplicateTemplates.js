import { initializeApp } from 'firebase/app'
import { collection, deleteDoc, doc, getDocs, getFirestore } from 'firebase/firestore'

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

function createdAtMillis(item) {
  return item.createdAt?.toMillis?.() ?? 0
}

async function deduplicateTemplates() {
  const snapshot = await getDocs(collection(db, 'templates'))
  const templates = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }))

  const groups = new Map()
  for (const template of templates) {
    const group = groups.get(template.name) ?? []
    group.push(template)
    groups.set(template.name, group)
  }

  let totalDeleted = 0

  for (const [name, group] of groups) {
    if (group.length <= 1) continue

    const sorted = [...group].sort((a, b) => {
      const orderA = a.order ?? Infinity
      const orderB = b.order ?? Infinity
      if (orderA !== orderB) return orderA - orderB
      return createdAtMillis(a) - createdAtMillis(b)
    })

    const [keep, ...duplicates] = sorted
    console.log(
      `중복 발견: "${name}" (${group.length}개) → id=${keep.id} (order=${keep.order}) 유지`,
    )

    for (const duplicate of duplicates) {
      await deleteDoc(doc(db, 'templates', duplicate.id))
      console.log(`  삭제됨: id=${duplicate.id} (order=${duplicate.order})`)
      totalDeleted += 1
    }
  }

  console.log(
    totalDeleted > 0
      ? `총 ${totalDeleted}개의 중복 템플릿을 삭제했습니다.`
      : '중복된 템플릿이 없습니다.',
  )
}

deduplicateTemplates()
  .then(() => {
    console.log('중복 제거 완료')
    process.exit(0)
  })
  .catch((err) => {
    console.error('중복 제거 실패:', err)
    process.exit(1)
  })
