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

const educationTemplates = [
  {
    type: 'document',
    name: '수업 지도안',
    description: '교과별 수업 지도안 작성을 도와줘요',
    isActive: true,
    order: 6,
    promptTemplate:
      '당신은 경험 많은 중학교 교사입니다. 아래 조건에 맞는 수업 지도안을 작성해주세요.\n\n핵심 내용: {{content}}\n말투: {{tones}}\n출력 형식: {{formats}}\n\n조건:\n{{conditions}}',
    conditions: [
      '학습 목표, 학습 활동, 평가 계획 포함',
      '2022 개정 교육과정 기반으로 작성',
      '단계별 활동(도입-전개-정리)로 구성',
    ],
    quickFixes: ['더 구체적으로', '활동 추가', '평가 기준 추가', '시간 배분 추가', '더 간결하게'],
  },
  {
    type: 'document',
    name: '형성평가 문항',
    description: '수업 중 활용할 형성평가 문제를 만들어줘요',
    isActive: true,
    order: 7,
    promptTemplate:
      '당신은 중학교 교사입니다. 아래 조건에 맞는 형성평가 문항을 만들어주세요.\n\n핵심 내용: {{content}}\n말투: {{tones}}\n출력 형식: {{formats}}\n\n조건:\n{{conditions}}',
    conditions: ['문항 번호 포함', '정답과 해설 포함', '난이도 표시(상/중/하)'],
    quickFixes: [
      '문항 수 늘려서',
      '난이도 높게',
      '난이도 낮게',
      '서술형으로',
      '선택형으로',
      '해설 더 자세히',
    ],
  },
  {
    type: 'document',
    name: '수행평가 문항',
    description: '수행평가 과제 및 채점 기준을 만들어줘요',
    isActive: true,
    order: 8,
    promptTemplate:
      '당신은 중학교 교사입니다. 아래 조건에 맞는 수행평가 문항과 채점 기준표를 만들어주세요.\n\n핵심 내용: {{content}}\n말투: {{tones}}\n출력 형식: {{formats}}\n\n조건:\n{{conditions}}',
    conditions: [
      '수행 과제 설명 포함',
      '채점 기준표(A/B/C/D/E 5단계) 포함',
      '평가 요소 3가지 이상 포함',
    ],
    quickFixes: [
      '채점 기준 더 구체적으로',
      '과제 설명 보완',
      '예시 추가',
      '배점 추가',
      '더 간결하게',
    ],
  },
  {
    type: 'document',
    name: '학습지',
    description: '수업 활동지 및 학습지를 만들어줘요',
    isActive: true,
    order: 9,
    promptTemplate:
      '당신은 중학교 교사입니다. 아래 조건에 맞는 학습지를 만들어주세요.\n\n핵심 내용: {{content}}\n말투: {{tones}}\n출력 형식: {{formats}}\n\n조건:\n{{conditions}}',
    conditions: [
      '학습 목표 상단에 포함',
      '빈칸 채우기, 서술, 토론 등 다양한 활동 유형 포함',
      '학생 이름/날짜 기입란 포함',
    ],
    quickFixes: ['활동 추가', '더 쉽게', '더 어렵게', '빈칸 늘려서', '더 간결하게'],
  },
]

async function seedEducationTemplates() {
  const templatesRef = collection(db, 'templates')

  for (const template of educationTemplates) {
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

seedEducationTemplates()
  .then(() => {
    console.log('시드 완료')
    process.exit(0)
  })
  .catch((err) => {
    console.error('시드 실패:', err)
    process.exit(1)
  })
