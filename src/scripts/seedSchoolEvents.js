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

const schoolEvents = [
  // 1학기
  {
    title: '입학식·시업식',
    startDate: '2026-03-03',
    endDate: '2026-03-03',
    reminderDays: 3,
    templates: ['가정통신문', '학급 규칙 안내문'],
    description: '새 학기가 시작됐어요. 학급 운영에 필요한 문서를 만들어보세요.',
    semester: 1,
  },
  {
    title: '학생상담주간',
    startDate: '2026-03-09',
    endDate: '2026-03-27',
    reminderDays: 3,
    templates: ['상담 일지'],
    description: '학생상담주간이에요. 상담 일지를 미리 준비해보세요.',
    semester: 1,
  },
  {
    title: '학부모상담주간',
    startDate: '2026-04-06',
    endDate: '2026-04-17',
    reminderDays: 5,
    templates: ['가정통신문', '상담 일지'],
    description: '학부모 상담 주간이에요. 안내문과 상담 일지를 준비해보세요.',
    semester: 1,
  },
  {
    title: '중간고사(2,3학년)',
    startDate: '2026-04-30',
    endDate: '2026-04-30',
    reminderDays: 14,
    templates: ['지필평가 문제', '형성평가 문항'],
    description: '중간고사까지 얼마 남지 않았어요. 시험 문제를 미리 준비해보세요.',
    semester: 1,
  },
  {
    title: '체육대회',
    startDate: '2026-05-28',
    endDate: '2026-05-28',
    reminderDays: 7,
    templates: ['가정통신문', '행사보고서'],
    description: '체육대회가 다가오고 있어요. 안내문과 보고서를 미리 준비해보세요.',
    semester: 1,
  },
  {
    title: '체험학습·수련활동·수학여행',
    startDate: '2026-06-08',
    endDate: '2026-06-10',
    reminderDays: 14,
    templates: ['가정통신문', '행사보고서'],
    description: '체험학습·수련활동·수학여행이 다가오고 있어요. 안내문을 미리 준비해보세요.',
    semester: 1,
  },
  {
    title: '기말고사(2,3학년)',
    startDate: '2026-07-08',
    endDate: '2026-07-10',
    reminderDays: 14,
    templates: ['지필평가 문제', '수행평가 문항'],
    description: '기말고사까지 얼마 남지 않았어요. 시험 문제와 수행평가를 준비해보세요.',
    semester: 1,
  },
  {
    title: '진로의 날',
    startDate: '2026-07-16',
    endDate: '2026-07-16',
    reminderDays: 7,
    templates: ['진로 탐색 활동지', '행사보고서'],
    description: '진로의 날이 다가오고 있어요. 활동지와 보고서를 미리 준비해보세요.',
    semester: 1,
  },
  {
    title: '방학식',
    startDate: '2026-07-22',
    endDate: '2026-07-22',
    reminderDays: 5,
    templates: ['가정통신문'],
    description: '방학식이 다가오고 있어요. 방학 안내 가정통신문을 준비해보세요.',
    semester: 1,
  },
  // 2학기
  {
    title: '2학기 개학',
    startDate: '2026-08-18',
    endDate: '2026-08-18',
    reminderDays: 3,
    templates: ['가정통신문', '학급 규칙 안내문'],
    description: '2학기가 시작됐어요. 학급 운영에 필요한 문서를 만들어보세요.',
    semester: 2,
  },
  {
    title: '학생상담주간(2학기)',
    startDate: '2026-08-25',
    endDate: '2026-09-04',
    reminderDays: 3,
    templates: ['상담 일지'],
    description: '학생상담주간이에요. 상담 일지를 미리 준비해보세요.',
    semester: 2,
  },
  {
    title: '학부모상담주간(2학기)',
    startDate: '2026-09-07',
    endDate: '2026-09-18',
    reminderDays: 5,
    templates: ['가정통신문', '상담 일지'],
    description: '학부모 상담 주간이에요. 안내문과 상담 일지를 준비해보세요.',
    semester: 2,
  },
  {
    title: '중간고사(1,2학년)',
    startDate: '2026-10-15',
    endDate: '2026-10-16',
    reminderDays: 14,
    templates: ['지필평가 문제', '형성평가 문항'],
    description: '중간고사까지 얼마 남지 않았어요. 시험 문제를 미리 준비해보세요.',
    semester: 2,
  },
  {
    title: '기말고사(3학년)',
    startDate: '2026-11-05',
    endDate: '2026-11-09',
    reminderDays: 14,
    templates: ['지필평가 문제', '수행평가 문항'],
    description: '3학년 기말고사가 다가오고 있어요. 시험 문제를 미리 준비해보세요.',
    semester: 2,
  },
  {
    title: '기말고사(1,2학년)',
    startDate: '2026-12-10',
    endDate: '2026-12-11',
    reminderDays: 14,
    templates: ['지필평가 문제', '수행평가 문항'],
    description: '기말고사까지 얼마 남지 않았어요. 시험 문제와 수행평가를 준비해보세요.',
    semester: 2,
  },
  {
    title: '동련제',
    startDate: '2026-12-24',
    endDate: '2026-12-24',
    reminderDays: 14,
    templates: ['행사보고서'],
    description: '동련제가 다가오고 있어요. 보고서를 미리 준비해보세요.',
    semester: 2,
  },
  {
    title: '종업식·졸업식',
    startDate: '2027-01-08',
    endDate: '2027-01-08',
    reminderDays: 7,
    templates: ['가정통신문', '행사보고서'],
    description: '종업식·졸업식이 다가오고 있어요. 안내문과 보고서를 미리 준비해보세요.',
    semester: 2,
  },
]

async function seedSchoolEvents() {
  const schoolEventsRef = collection(db, 'school_events')

  for (const event of schoolEvents) {
    const existing = await getDocs(
      query(
        schoolEventsRef,
        where('title', '==', event.title),
        where('startDate', '==', event.startDate),
      ),
    )

    if (!existing.empty) {
      console.log(`이미 존재함, 건너뜀: ${event.title} (${event.startDate})`)
      continue
    }

    await addDoc(schoolEventsRef, {
      ...event,
      createdAt: serverTimestamp(),
    })
    console.log(`추가됨: ${event.title} (${event.startDate})`)
  }
}

seedSchoolEvents()
  .then(() => {
    console.log('시드 완료')
    process.exit(0)
  })
  .catch((err) => {
    console.error('시드 실패:', err)
    process.exit(1)
  })
