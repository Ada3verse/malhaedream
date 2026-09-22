import { initializeApp } from 'firebase/app'
import {
  addDoc,
  collection,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
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

const DOCUMENT_QUICK_FIXES = [
  '더 구체적으로',
  '더 간결하게',
  '격식체로',
  '친근하게',
  '예시 추가',
  '표 추가',
  '항목 추가',
  '분량 늘려서',
]

const testTemplates = [
  {
    type: 'image',
    name: '이미지 생성 프롬프트',
    description: '수업에 활용할 이미지를 만드는 프롬프트를 생성해요.',
    isActive: true,
    order: 1,
    quickFixes: [
      '더 밝게',
      '더 어둡게',
      '인물 추가',
      '배경 강조',
      '색감 더 풍부하게',
      '단순하게',
      '더 사실적으로',
      '더 추상적으로',
    ],
    promptTemplate: '',
    conditions: [],
  },
  {
    type: 'document',
    name: '가정통신문',
    description: '학부모에게 보내는 각종 안내문',
    isActive: true,
    order: 2,
    quickFixes: DOCUMENT_QUICK_FIXES,
    promptTemplate:
      '당신은 중학교 교사입니다. 아래 조건에 맞는 가정통신문을 작성해주세요.\n\n핵심 내용: {{content}}\n말투: {{tones}}\n출력 형식: {{formats}}\n\n조건:\n{{conditions}}',
    conditions: ['학부모가 읽기 쉽게 작성', '학교 공문서 형식 준수', '제목, 본문, 문의처 포함'],
  },
  {
    type: 'document',
    name: '사업계획서',
    description: '학교 사업 추진을 위한 계획서',
    isActive: true,
    order: 3,
    quickFixes: DOCUMENT_QUICK_FIXES,
    promptTemplate:
      '당신은 학교 업무 전문가입니다. 아래 조건에 맞는 사업계획서를 작성해주세요.\n\n사업 내용: {{content}}\n말투: {{tones}}\n출력 형식: {{formats}}\n\n조건:\n{{conditions}}',
    conditions: ['목적, 대상, 일정, 예산(항목만), 기대효과 포함', '학교 공문서 형식 준수'],
  },
  {
    type: 'document',
    name: '행사보고서',
    description: '학교 행사 진행 결과 보고서',
    isActive: true,
    order: 4,
    quickFixes: DOCUMENT_QUICK_FIXES,
    promptTemplate:
      '당신은 학교 업무 전문가입니다. 아래 조건에 맞는 행사보고서를 작성해주세요.\n\n행사 내용: {{content}}\n말투: {{tones}}\n출력 형식: {{formats}}\n\n조건:\n{{conditions}}',
    conditions: ['행사명, 일시, 장소, 참가인원, 주요내용, 성과 포함', '객관적이고 명확하게 작성'],
  },
  {
    type: 'document',
    name: '기타',
    description: '위 유형에 해당하지 않는 일반 문서',
    isActive: true,
    order: 5,
    quickFixes: DOCUMENT_QUICK_FIXES,
    promptTemplate:
      '당신은 학교 업무 전문가입니다. 아래 조건에 맞는 문서를 작성해주세요.\n\n내용: {{content}}\n말투: {{tones}}\n출력 형식: {{formats}}',
    conditions: [],
  },
]

async function seedTemplates() {
  const templatesRef = collection(db, 'templates')

  for (const template of testTemplates) {
    const existing = await getDocs(
      query(
        templatesRef,
        where('type', '==', template.type),
        where('name', '==', template.name),
      ),
    )

    if (!existing.empty) {
      console.log(`이미 존재함, 건너뜀: [${template.type}] ${template.name}`)
      continue
    }

    await addDoc(templatesRef, {
      ...template,
      createdAt: serverTimestamp(),
    })
    console.log(`추가됨: [${template.type}] ${template.name}`)
  }
}

seedTemplates()
  .then(() => {
    console.log('시드 완료')
    process.exit(0)
  })
  .catch((err) => {
    console.error('시드 실패:', err)
    process.exit(1)
  })
