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

const templateUpdates = [
  {
    name: '가정통신문',
    promptTemplate:
      '당신은 20년 경력의 중학교 담임교사입니다. 아래 조건에 맞는 가정통신문을 작성해주세요.\n\n핵심 내용: {{content}}\n말투: {{tones}}\n출력 형식: {{formats}}\n\n반드시 포함할 것:\n{{conditions}}\n\n제약 조건:\n- 학부모가 5분 안에 읽을 수 있는 분량\n- 어려운 교육 전문용어 사용 금지\n- 외래어 최소화\n- 학생 개인정보(이름, 학번) 포함 금지\n- 날짜, 장소, 준비물이 있으면 표로 정리\n\n예시 문체:\n\'안녕하세요, 학부모님. 2026학년도 2학기 학부모 공개 수업을 아래와 같이 안내드립니다.\'',
    conditions: [
      '제목, 인사말, 본문, 문의처 포함',
      '학교 공문서 형식 준수',
      '날짜/장소/준비물 등 핵심 정보는 표로 정리',
      '마지막에 담임교사 이름과 연락처 자리 포함',
    ],
  },
  {
    name: '사업계획서',
    promptTemplate:
      '당신은 학교 행정 업무 전문가입니다. 아래 조건에 맞는 사업계획서를 작성해주세요.\n\n핵심 내용: {{content}}\n말투: {{tones}}\n출력 형식: {{formats}}\n\n반드시 포함할 것:\n{{conditions}}\n\n제약 조건:\n- 학교 공문서 양식에 맞게 작성\n- 추측성 표현 금지 (예: ~일 것이다, ~할 수도 있다)\n- 예산은 항목명만 제시하고 금액은 비워두기\n- 실현 가능한 내용만 포함\n\n예시 문체:\n\'1. 목적: 학생들의 진로 탐색 기회 확대 및 직업 세계 이해 증진\'',
    conditions: [
      '목적, 방침, 세부 추진 계획, 기대 효과 포함',
      '추진 일정을 표로 정리',
      '담당자 및 협조 부서 명시',
      '예산 항목 포함(금액 제외)',
    ],
  },
  {
    name: '행사보고서',
    promptTemplate:
      '당신은 학교 행정 업무 전문가입니다. 아래 조건에 맞는 행사보고서를 작성해주세요.\n\n핵심 내용: {{content}}\n말투: {{tones}}\n출력 형식: {{formats}}\n\n반드시 포함할 것:\n{{conditions}}\n\n제약 조건:\n- 객관적 사실만 기술, 주관적 평가 최소화\n- 과장 표현 금지\n- 학생 개인정보(이름, 학번) 포함 금지\n- 수치(참여 인원, 시간 등)는 구체적으로 명시\n\n예시 문체:\n\'행사명: 2026학년도 진로의 날 / 일시: 2026.05.15.(목) 09:00~16:00 / 참가 인원: 전교생 350명\'',
    conditions: [
      '행사명, 일시, 장소, 참가 인원, 주요 내용 포함',
      '성과 및 향후 개선 사항 포함',
      '핵심 정보는 표로 정리',
      '사진 설명 자리 표시 포함',
    ],
  },
  {
    name: '수업 지도안',
    promptTemplate:
      '당신은 2022 개정 교육과정에 정통한 중학교 교사입니다. 아래 조건에 맞는 수업 지도안을 작성해주세요.\n\n핵심 내용: {{content}}\n말투: {{tones}}\n출력 형식: {{formats}}\n\n반드시 포함할 것:\n{{conditions}}\n\n제약 조건:\n- 2022 개정 교육과정 성취기준 기반\n- 학생 중심 활동 포함 필수\n- 교사 중심 강의식 수업만으로 구성 금지\n- 각 단계별 예상 소요 시간 명시\n- 평가 방법은 과정중심평가로\n\n예시 문체:\n\'[도입 - 5분] 전시 학습 확인 및 학습 목표 제시\n학습 목표: 광합성의 과정을 설명할 수 있다.\'',
    conditions: [
      '학습 목표(~할 수 있다 형태로) 포함',
      '도입-전개-정리 3단계 구성 및 시간 배분',
      '학생 활동 2가지 이상 포함',
      '평가 계획 및 피드백 방법 포함',
    ],
  },
  {
    name: '형성평가 문항',
    promptTemplate:
      '당신은 중학교 교사이자 평가 전문가입니다. 아래 조건에 맞는 형성평가 문항을 만들어주세요.\n\n핵심 내용: {{content}}\n말투: {{tones}}\n출력 형식: {{formats}}\n\n반드시 포함할 것:\n{{conditions}}\n\n제약 조건:\n- 수업 후 5~10분 안에 풀 수 있는 분량\n- 암기보다 이해와 적용 중심 문항\n- 정답이 명확한 문항만 포함\n- 학생 이름/학번 기입란 포함\n- 지나치게 어렵거나 쉬운 문항 지양\n\n예시 문체:\n\'1. (중) 광합성이 일어나는 장소는 어디인가요? [정답: 엽록체] [해설: 엽록체에는 광합성에 필요한 엽록소가 있습니다.]\'',
    conditions: [
      '문항 번호와 난이도(상/중/하) 표시',
      '각 문항 아래 정답과 해설 포함',
      '선택형과 서술형 혼합 구성',
      '학생 이름/날짜 기입란 상단에 포함',
    ],
  },
  {
    name: '수행평가 문항',
    promptTemplate:
      '당신은 중학교 교사이자 평가 전문가입니다. 아래 조건에 맞는 수행평가 문항과 채점 기준표를 만들어주세요.\n\n핵심 내용: {{content}}\n말투: {{tones}}\n출력 형식: {{formats}}\n\n반드시 포함할 것:\n{{conditions}}\n\n제약 조건:\n- 과정중심평가 원칙 준수\n- 결과물보다 과정과 태도 평가 포함\n- 학생 개인정보 수집 최소화\n- 채점 기준은 교사와 학생 모두 이해할 수 있는 언어로\n- 특정 학생에게 유리하거나 불리한 조건 금지\n\n예시 채점 기준표:\n\'평가 요소: 내용의 정확성 / A: 핵심 개념을 정확히 이해하고 창의적으로 표현함 / B: 핵심 개념을 정확히 이해함 / C: 핵심 개념을 대체로 이해함\'',
    conditions: [
      '수행 과제 설명 및 제출 방법 명시',
      '채점 기준표(A/B/C/D/E 5단계, 평가 요소 3가지 이상) 포함',
      '평가 일정 및 배점 포함',
      '학생 안내문 형식으로 작성',
    ],
  },
  {
    name: '학습지',
    promptTemplate:
      '당신은 경험 많은 중학교 교사입니다. 아래 조건에 맞는 학습지를 만들어주세요.\n\n핵심 내용: {{content}}\n말투: {{tones}}\n출력 형식: {{formats}}\n\n반드시 포함할 것:\n{{conditions}}\n\n제약 조건:\n- 학생 혼자서도 이해할 수 있는 난이도\n- 한 페이지(A4 기준) 안에 들어오는 분량\n- 그림이나 도표가 필요한 자리는 [그림 자리] 표시\n- 정답이 있는 문항은 별도 정답란 안내 포함\n- 지나치게 빽빽한 구성 금지\n\n예시 문체:\n\'학습 목표: 광합성의 과정을 설명할 수 있다.\n[활동 1] 빈칸을 채워보세요.\n광합성은 ( )에서 일어나며, ( )와 ( )를 이용해 포도당을 만든다.\'',
    conditions: [
      "상단에 학습 목표, 학년/반/이름/날짜 기입란 포함",
      '빈칸 채우기, 서술형, 선택형 중 2가지 이상 활동 유형 혼합',
      '그림/도표 필요 자리는 [그림 자리]로 표시',
      "하단에 '더 알아보기' 또는 심화 활동 자리 포함",
    ],
  },
]

async function updateTemplates() {
  const templatesRef = collection(db, 'templates')

  for (const update of templateUpdates) {
    const snapshot = await getDocs(
      query(templatesRef, where('name', '==', update.name)),
    )

    if (snapshot.empty) {
      console.log(`찾을 수 없음, 건너뜀: ${update.name}`)
      continue
    }

    for (const docSnap of snapshot.docs) {
      await updateDoc(doc(db, 'templates', docSnap.id), {
        promptTemplate: update.promptTemplate,
        conditions: update.conditions,
      })
      console.log(`업데이트됨: ${update.name} (id=${docSnap.id})`)
    }
  }
}

updateTemplates()
  .then(() => {
    console.log('업데이트 완료')
    process.exit(0)
  })
  .catch((err) => {
    console.error('업데이트 실패:', err)
    process.exit(1)
  })
