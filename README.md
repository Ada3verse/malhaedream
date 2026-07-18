# 말해드림 (Malhaedream)

> AI에게 대신 말해드립니다. 복사만 하세요.

교사들이 생성형 AI를 활용할 때 가장 어려워하는 '프롬프트 작성'을 도와주는 교사 특화 웹 서비스입니다.
키워드와 조건을 선택하면 ChatGPT·Claude·Gemini에 바로 붙여넣을 수 있는 최적의 프롬프트를 자동으로 생성해드립니다.

🔗 **서비스 바로가기**: https://malhaedream.vercel.app

---

## 기획 배경

교사 연수 현장에서 생성형 AI 활용 교육을 진행하다 보면, 대부분의 교사들이 AI 자체보다 **'어떻게 말해야 할지'** 를 가장 어려워합니다. 역할 부여, 구체적인 요구사항, 출력 형식 지정 등 프롬프트 작성 원칙을 알아도 막상 실전에서 적용하기 어렵기 때문입니다.

말해드림은 이 문제를 해결하기 위해, 교사가 단어와 키워드만 선택하면 AI가 최적의 프롬프트를 자동으로 생성해주는 서비스입니다.

---

## 주요 기능

### 프롬프트 생성
- **이미지 생성 프롬프트**: ChatGPT(Duct-tape), Gemini(nano banana2) 툴별 최적화
  - ChatGPT·Gemini 선택 시 영문 프롬프트 + 한국어 해석 병기
  - 스타일·분위기 키워드 선택으로 구체적인 프롬프트 생성
- **문서 작성 프롬프트**: 가정통신문, 사업계획서, 행사보고서 등
  - 말투·출력 형식 선택 가능

### 계정 및 보안
- 닉네임 + PIN 4자리 로그인 (첫 입력 시 자동 가입)
- PIN SHA-256 해싱 저장
- 로그인 실패 5회 초과 시 잠금, 관리자 해제
- 개인정보처리방침 동의 후 서비스 이용

### 개인 보관함
- 생성된 프롬프트 저장·복사·삭제
- 본인 계정 프롬프트만 조회 가능

### 관리자 페이지
- 교사 계정 목록 조회
- PIN 초기화·잠금 해제·계정 삭제
- 전체 가입자 수 통계

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | React, Vite, Tailwind CSS |
| AI 엔진 | Claude API (claude-sonnet-4-6) |
| Backend | Firebase Functions (Node.js) |
| Database | Firebase Firestore |
| 인증 | 커스텀 닉네임+PIN (SHA-256 해싱) |
| 배포 | Vercel (Frontend), Firebase (Functions) |

---

## 보안 설계

- API 키는 Firebase Functions 서버에서만 호출 (프론트 미노출)
- PIN 평문 저장 없음 (SHA-256 해싱)
- 로그인 실패 횟수 제한 (5회 초과 시 잠금)
- .env.local은 .gitignore 처리
- 개인정보처리방침 고지 및 동의 절차 포함

---

## 프로젝트 구조

```
src/
├── components/       # 공통 컴포넌트
├── pages/
│   ├── LoginPage.jsx
│   ├── HomePage.jsx
│   ├── ImagePromptPage.jsx
│   ├── DocumentPromptPage.jsx
│   ├── MyPage.jsx
│   └── AdminPage.jsx
├── utils/
│   ├── hash.js        # PIN 해싱
│   ├── prompts.js      # 프롬프트 Firestore 연동
│   └── api.js          # Firebase Functions 호출
└── firebase.js
functions/
└── index.js            # Claude API 호출 (서버)
```

---

## 개인정보처리방침

- 수집 항목: 닉네임, PIN(해싱 저장)
- 수집 목적: 서비스 이용 및 본인 확인
- 보유 기간: 해당 학년도 종료 시(매년 12월 31일) 일괄 삭제
- 시행일: 2026년 6월 30일
- 문의: 동신중학교 정보교육 담당 (정경원)

---

## 개발자

- 정경원 (동신중학교 정보 교사 / IT 관리자)
- 개발 도구: VS Code, Claude Code
