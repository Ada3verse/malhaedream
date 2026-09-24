import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase'

const imageTemplates = {
  'ChatGPT (GPT Image 1.5 · Duct-tape)': {
    prefix: '',
    suffix: ', high quality, detailed, professional',
    styleMap: {
      사실적인: 'photorealistic, ultra detailed',
      일러스트: 'illustration style, artistic',
      수채화: 'watercolor painting style, soft colors',
      픽셀아트: 'pixel art style, 8-bit',
      미니멀: 'minimalist, clean, simple',
      '교과서 삽화풍': 'textbook illustration style, clean educational graphic',
      '선화(흑백)': 'line art, black and white, simple outline drawing',
      '귀여운 캐릭터': 'cute character design, kawaii style, friendly mascot',
    },
    moodMap: {
      '밝고 따뜻한': 'bright, warm lighting, cheerful atmosphere',
      '차갑고 세련된': 'cool tones, sleek, modern',
      몽환적인: 'dreamy, fantasy atmosphere, ethereal',
      역동적인: 'dynamic, energetic, action',
      차분한: 'calm, peaceful, serene',
      교육적인: 'educational, informative, clear and instructive',
      '집중하게 하는': 'focused, attention-grabbing, engaging',
      '호기심 자극하는': 'curiosity-inspiring, intriguing, thought-provoking',
    },
    format: (subject, styles, moods, extras) => {
      const styleStr = styles.map((s) => imageTemplates['ChatGPT (GPT Image 1.5 · Duct-tape)'].styleMap[s] || s).join(', ')
      const moodStr = moods.map((m) => imageTemplates['ChatGPT (GPT Image 1.5 · Duct-tape)'].moodMap[m] || m).join(', ')
      const combined = `[[SUBJECT]]${subject}[[/SUBJECT]], [[STYLE]]${styleStr}[[/STYLE]], [[MOOD]]${moodStr}[[/MOOD]]${extras ? ', ' + extras : ''}, [[SUFFIX]]high quality, detailed[[/SUFFIX]]`
      return { en: null, ko: combined }
    },
  },
  'Gemini (Imagen 4 · nano banana)': {
    format: (subject, styles, moods, extras) => {
      const styleStr = styles.map((s) => imageTemplates['ChatGPT (GPT Image 1.5 · Duct-tape)'].styleMap[s] || s).join(', ')
      const moodStr = moods.map((m) => imageTemplates['ChatGPT (GPT Image 1.5 · Duct-tape)'].moodMap[m] || m).join(', ')
      const combined = `[[SUBJECT]]${subject}[[/SUBJECT]], [[STYLE]]${styleStr}[[/STYLE]], [[MOOD]]${moodStr}[[/MOOD]]${extras ? ', ' + extras : ''}, [[SUFFIX]]high quality, detailed[[/SUFFIX]]`
      return { en: null, ko: combined }
    },
  },
}

export function generateImagePrompt(tool, subject, styles, moods, extras) {
  const template = imageTemplates[tool]
  if (!template) return null
  return template.format(subject, styles, moods, extras)
}

export async function getTemplates(type) {
  const snapshot = await getDocs(
    query(
      collection(db, 'templates'),
      where('type', '==', type),
      where('isActive', '==', true),
    ),
  )

  return snapshot.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

function splitRoleAndPurpose(text) {
  const match = text.match(/^([\s\S]*?다\.)\s*([\s\S]*)$/)
  if (!match) return { role: text, purpose: '' }
  return { role: match[1], purpose: match[2] }
}

export function generatePromptFromTemplate(template, content, tones, formats) {
  const conditionsStr = (template.conditions ?? []).map((item) => `- ${item}`).join('\n')
  const raw = template.promptTemplate ?? ''

  const substitute = (text) =>
    text
      .replaceAll('{{name}}', template.name ?? '')
      .replaceAll('{{content}}', content ?? '')
      .replaceAll('{{tones}}', tones.join(', '))
      .replaceAll('{{formats}}', formats.join(', '))
      .replaceAll('{{conditions}}', conditionsStr)

  const contentIdx = raw.indexOf('{{content}}')
  if (contentIdx === -1) {
    return { ko: substitute(raw), en: null }
  }

  // {{content}}가 포함된 줄 이전을 역할·목적 문장으로 간주
  const contentLineStart = raw.lastIndexOf('\n', contentIdx) + 1
  const rolePurposeRaw = raw.slice(0, contentLineStart).trim()

  // {{formats}} 줄까지를 맥락·조건 블록으로, 그 뒤를 제약조건 블록으로 간주
  const formatsIdx = raw.indexOf('{{formats}}')
  let afterConditionStart
  if (formatsIdx !== -1) {
    const formatsLineEnd = raw.indexOf('\n', formatsIdx)
    afterConditionStart = formatsLineEnd === -1 ? raw.length : formatsLineEnd
  } else {
    const contentLineEnd = raw.indexOf('\n', contentIdx)
    afterConditionStart = contentLineEnd === -1 ? raw.length : contentLineEnd
  }

  const contextConditionRaw = raw.slice(contentLineStart, afterConditionStart).trim()
  const restRaw = raw.slice(afterConditionStart).trim()

  const { role, purpose } = splitRoleAndPurpose(rolePurposeRaw)

  const contextLines = []
  const conditionLines = []
  for (const line of contextConditionRaw.split('\n')) {
    if (line.startsWith('말투') || line.startsWith('출력 형식')) {
      conditionLines.push(line)
    } else {
      contextLines.push(line)
    }
  }

  const rolePurposeBlock = [
    role.trim() && `[[ROLE]]${substitute(role.trim())}[[/ROLE]]`,
    purpose.trim() && `[[PURPOSE]]${substitute(purpose.trim())}[[/PURPOSE]]`,
  ]
    .filter(Boolean)
    .join(' ')

  const contextConditionBlock = [
    contextLines.length && `[[CONTEXT]]${substitute(contextLines.join('\n'))}[[/CONTEXT]]`,
    conditionLines.length && `[[CONDITION]]${substitute(conditionLines.join('\n'))}[[/CONDITION]]`,
  ]
    .filter(Boolean)
    .join('\n')

  const blocks = [
    rolePurposeBlock,
    contextConditionBlock,
    restRaw && `[[CONSTRAINT]]${substitute(restRaw)}[[/CONSTRAINT]]`,
  ].filter(Boolean)

  return { ko: blocks.join('\n\n'), en: null }
}

export function getAiToolIntro(aiTool) {
  const tool = aiTool || 'ChatGPT'
  return `다음 내용을 ${tool}에 붙여넣어 IB MYP 유닛 플랜 작성에 활용하세요.\n\n`
}

const GRASPS_LABELS = {
  goal: 'G(목표)',
  role: 'R(역할)',
  audience: 'A(청중)',
  situation: 'S(상황)',
  product: 'P(결과물)',
  standards: 'S(기준)',
}

function buildGraspsLines(grasps) {
  if (!grasps) return []
  return Object.entries(GRASPS_LABELS)
    .map(([key, label]) => {
      const value = grasps[key]
      return value && value.trim() ? `  · ${label}: ${value.trim()}` : null
    })
    .filter(Boolean)
}

function buildFormativeLines(formativeAssessments) {
  if (!Array.isArray(formativeAssessments) || formativeAssessments.length === 0) return []
  return formativeAssessments
    .map((stage, index) => {
      const parts = []
      if (stage.purposes?.length) parts.push(`목적: ${stage.purposes.join(', ')}`)
      if (stage.types?.length) parts.push(`유형: ${stage.types.join(', ')}`)
      if (stage.description && stage.description.trim()) parts.push(`설명: ${stage.description.trim()}`)
      if (parts.length === 0) return null
      return `  · 형성평가 계획 ${index + 1} - ${parts.join(' / ')}`
    })
    .filter(Boolean)
}

export function generateIBUnitPlanPrompt({
  subject,
  keyConceptsSelected,
  relatedConceptsInput,
  globalContext,
  explorationSelected,
  statementKeyword,
  mypYear,
  lessonActivity,
  lessonActivityDescription,
  summativeDescription,
  grasps,
  formativeAssessments,
  aiTool,
}) {
  const contextLines = [
    `- 교과군: ${subject}`,
    `- MYP 학년: ${mypYear}`,
    `- 핵심 개념(Key Concept): ${(keyConceptsSelected ?? []).join(', ')}`,
    `- 관련 개념(Related Concepts): ${relatedConceptsInput}`,
    `- 세계적 맥락(Global Context): ${globalContext}`,
    `- 탐구(세부, Exploration): ${explorationSelected}`,
    `- 탐구 진술문 키워드: ${statementKeyword}`,
  ]

  const joinedLessonActivity = joinIfArray(lessonActivity)
  if (joinedLessonActivity) contextLines.push(`- 선호하는 수업 활동 유형: ${joinedLessonActivity}`)
  if (lessonActivityDescription && lessonActivityDescription.trim()) {
    contextLines.push(`- 수업 활동 보충 설명: ${lessonActivityDescription.trim()}`)
  }

  const joinedSummativeDescription = joinIfArray(summativeDescription)
  if (joinedSummativeDescription) {
    contextLines.push(`- 선호하는 총괄 평가 유형: ${joinedSummativeDescription}`)
  }

  const graspsLines = buildGraspsLines(grasps)
  if (graspsLines.length) {
    contextLines.push('- 총괄 평가 상세(GRASPS):', ...graspsLines)
  }

  const formativeLines = buildFormativeLines(formativeAssessments)
  if (formativeLines.length) {
    contextLines.push('- 형성평가 계획:', ...formativeLines)
  }

  const ko = `[[ROLE]]당신은 IB MYP(중등교육프로그램) 교육과정 설계 전문가입니다.[[/ROLE]] [[PURPOSE]]아래 조건에 맞는 IB MYP 유닛 플랜(Unit Plan) 초안을 작성해주세요.[[/PURPOSE]]

[[CONTEXT]]${contextLines.join('\n')}[[/CONTEXT]]

[[CONDITION]]- 탐구 진술문(Statement of Inquiry)을 먼저 한 문장으로 제시해주세요.
- 사실적(Factual)/개념적(Conceptual)/논쟁적(Debatable) 탐구 질문을 각 1개 이상 제시해주세요.
- 총괄평가(Summative Assessment) 개요를 GRASPS(목표-역할-대상-상황-결과물-기준) 요소를 포함해 제시해주세요.
- 이 단원과 관련된 ATL(학습접근방법) 기능을 2~3개 제안하고 각각 수업에서 어떻게 드러나는지 설명해주세요.
- 학습 경험 및 수업 활동의 흐름을 차시별로 간략히 제시해주세요.
- MYP 학년 수준에 맞는 난이도와 분량으로 작성해주세요.[[/CONDITION]]`

  return { ko: `${getAiToolIntro(aiTool)}${ko}` }
}

export function generateIBInquiryQuestionsPrompt({
  subject,
  keyConceptsSelected,
  globalContext,
  explorationSelected,
  statementKeyword,
  aiTool,
}) {
  const ko = `[[ROLE]]당신은 IB MYP 교육과정 설계 전문가입니다.[[/ROLE]] [[PURPOSE]]아래 조건에 맞는 탐구 질문(Inquiry Questions)을 사실적/개념적/논쟁적 질문 각 1개씩, 총 3개 만들어주세요.[[/PURPOSE]]

[[CONTEXT]]- 교과군: ${subject}
- 핵심 개념(Key Concept): ${(keyConceptsSelected ?? []).join(', ')}
- 세계적 맥락(Global Context): ${globalContext}
- 탐구(세부, Exploration): ${explorationSelected}
- 단원 키워드: ${statementKeyword}[[/CONTEXT]]

[[CONDITION]]- 사실적 질문(Factual Question): 구체적 지식이나 사실을 확인하는 질문
- 개념적 질문(Conceptual Question): 핵심 개념을 이해와 연결하는 질문
- 논쟁적 질문(Debatable Question): 다양한 관점에서 토론할 수 있는 열린 질문
- 각 질문 아래에 해당 질문이 왜 그 유형에 해당하는지 한 줄로 설명을 덧붙여주세요.[[/CONDITION]]`

  return { ko: `${getAiToolIntro(aiTool)}${ko}` }
}

export function generateIBStatementPrompt({
  subject,
  keyConceptsSelected,
  relatedConceptsInput,
  globalContext,
  explorationSelected,
  statementKeyword,
  aiTool,
}) {
  const contextLines = [
    `- 교과군: ${subject}`,
    `- 핵심 개념(Key Concept): ${(keyConceptsSelected ?? []).join(', ')}`,
    `- 관련 개념(Related Concepts): ${relatedConceptsInput}`,
    `- 세계적 맥락(Global Context): ${globalContext}`,
    `- 탐구(세부, Exploration): ${explorationSelected}`,
  ]

  if (statementKeyword && statementKeyword.trim()) {
    contextLines.push(`- 단원 키워드: ${statementKeyword.trim()}`)
  }

  const ko = `[[ROLE]]당신은 IB MYP 교육과정 설계 전문가입니다.[[/ROLE]] [[PURPOSE]]아래 조건을 반영한 탐구 진술문(Statement of Inquiry) 초안을 2~3개 제안해주세요.[[/PURPOSE]]

[[CONTEXT]]${contextLines.join('\n')}[[/CONTEXT]]

[[CONDITION]]- 핵심 개념과 관련 개념, 세계적 맥락이 하나의 문장 안에 자연스럽게 연결되도록 작성해주세요.
- 학생 수준에서 이해할 수 있는 명확하고 간결한 문장으로 작성해주세요.
- 특정 사실이 아닌, 전이 가능한 이해(transferable understanding)를 담아주세요.[[/CONDITION]]`

  return { ko: `${getAiToolIntro(aiTool)}${ko}` }
}

function joinIfArray(value) {
  return Array.isArray(value) ? value.join(', ') : value
}

export function generateIBAssessmentPrompt({
  subject,
  mypYear,
  summativeDescription,
  grasps,
  formativeNotes,
  aiTool,
}) {
  const contextLines = [
    `- 교과군: ${subject}`,
    `- MYP 학년: ${mypYear}`,
    `- 총괄평가 간략 설명: ${joinIfArray(summativeDescription)}`,
  ]

  const graspsLines = buildGraspsLines(grasps)
  if (graspsLines.length) {
    contextLines.push('- 총괄 평가 상세(GRASPS):', ...graspsLines)
  }

  const joinedFormativeNotes = joinIfArray(formativeNotes)
  if (joinedFormativeNotes) {
    contextLines.push(`- 참고할 형성평가 계획: ${joinedFormativeNotes}`)
  }

  const ko = `[[ROLE]]당신은 IB MYP 평가 설계 전문가입니다.[[/ROLE]] [[PURPOSE]]아래 조건에 맞는 총괄평가(Summative Assessment)를 GRASPS 모델을 기반으로 설계해주세요.[[/PURPOSE]]

[[CONTEXT]]${contextLines.join('\n')}[[/CONTEXT]]

[[CONDITION]]- G(Goal, 목표): 학생이 달성해야 할 목표
- R(Role, 역할): 과제 수행 중 학생이 맡는 역할
- A(Audience, 대상): 결과물을 전달받는 대상
- S(Situation, 상황): 과제가 주어지는 맥락과 도전 과제
- P(Product/Performance, 결과물): 학생이 만들어낼 산출물
- S(Standards, 기준): 평가 기준(루브릭 기준을 간략히 함께 제시)
- 위에 이미 입력된 GRASPS 항목이 있다면 그 내용을 우선 반영해주세요.
- 해당 MYP 학년 수준에 적합한 난이도로 설계해주세요.[[/CONDITION]]`

  return { ko: `${getAiToolIntro(aiTool)}${ko}` }
}

export function generateIBFormativePrompt({ subject, mypYear, formativeAssessments, aiTool }) {
  const formativeLines = buildFormativeLines(formativeAssessments)
  const formativeBlock = formativeLines.length ? formativeLines.join('\n') : '  (입력된 단계 없음)'

  const ko = `[[ROLE]]당신은 IB MYP 평가 설계 전문가입니다.[[/ROLE]] [[PURPOSE]]아래 단계별 형성평가(Formative Assessment) 계획을 바탕으로, 각 단계에서 어떤 형성평가를 어떻게 실시할지 구체적으로 작성해주세요.[[/PURPOSE]]

[[CONTEXT]]- 교과군: ${subject}
- MYP 학년: ${mypYear}
- 형성평가 계획:
${formativeBlock}[[/CONTEXT]]

[[CONDITION]]- 각 단계별로 구체적인 평가 도구·문항·관찰 기준을 제안해주세요.
- 학생의 이해도를 어떻게 확인하고, 그 결과를 다음 수업에 어떻게 반영할지 설명해주세요.
- 총괄평가로 자연스럽게 이어지도록 난이도와 연계성을 고려해주세요.[[/CONDITION]]`

  return { ko: `${getAiToolIntro(aiTool)}${ko}` }
}

export function generateIBATLPrompt({ subject, atlSelected, lessonActivity, aiTool }) {
  const ko = `[[ROLE]]당신은 IB MYP 교육과정 설계 전문가입니다.[[/ROLE]] [[PURPOSE]]아래 수업 활동에서 드러나는 ATL(학습접근방법) 기능 서술 문장을 만들어주세요.[[/PURPOSE]]

[[CONTEXT]]- 교과군: ${subject}
- ATL 카테고리: ${atlSelected}
- 수업 활동: ${joinIfArray(lessonActivity)}[[/CONTEXT]]

[[CONDITION]]- 선택한 ATL 카테고리에 해당하는 구체적인 기능(skill) 서술 문장을 2~3개 만들어주세요.
- "학생은 ~할 수 있다" 형태로, 수업 활동과 직접 연결되도록 작성해주세요.
- 관찰 가능하고 평가 가능한 표현을 사용해주세요.[[/CONDITION]]`

  return { ko: `${getAiToolIntro(aiTool)}${ko}` }
}

export function refinePrompt(originalPrompt, quickFixes, customRequest) {
  const items = [
    ...quickFixes,
    ...(customRequest && customRequest.trim() ? [customRequest.trim()] : []),
  ]
  const additions = items.map((item) => `- ${item}`).join('\n')
  return `${originalPrompt}\n\n추가 조건:\n${additions}`
}

export function generateFollowUpPrompt(issues, customRequest) {
  const issueMap = {
    '너무 길어요': '분량을 절반 정도로 줄여줘.',
    '너무 짧아요': '내용을 2배 정도 더 자세하게 늘려줘.',
    '너무 어려워요': '더 쉬운 단어와 표현으로 바꿔줘. 중학생도 이해할 수 있게.',
    '너무 쉬워요': '더 전문적이고 심화된 내용으로 수준을 높여줘.',
    '형식이 달라요': '형식을 바꿔줘. ' + (customRequest || ''),
    '내용이 빠진 것 같아요': '빠진 내용을 보완해서 더 완성도 있게 작성해줘.',
    '톤이 맞지 않아요': '말투와 톤을 조정해줘. ' + (customRequest || ''),
    '더 구체적으로 써줬으면 해요': '더 구체적인 예시와 세부 내용을 추가해줘.',
    '예시가 필요해요': '실제 예시를 2~3개 추가해줘.',
    '표로 정리해줬으면 해요': '주요 내용을 표 형태로 정리해줘.',

    // 📏 분량·형식
    '더 짧게': '전체 분량을 절반 정도로 줄여줘. 핵심 내용만 남기고 나머지는 삭제해.',
    '더 길게': '내용을 2배 정도 더 자세하고 풍부하게 늘려줘.',
    '표로 정리': '주요 내용을 보기 쉬운 표 형태로 정리해줘.',
    '개조식으로': '줄글 대신 개조식(항목별로 짧게 나열하는 방식)으로 바꿔줘.',
    '줄글로': '개조식이나 목록 대신 자연스러운 줄글 형태로 바꿔줘.',
    '항목 수 줄이기': '항목이나 문항 수를 절반으로 줄여줘.',
    '항목 수 늘리기': '항목이나 문항 수를 2배로 늘려줘.',

    // 🎯 수준·톤
    '더 쉽게': '더 쉬운 단어와 표현으로 바꿔줘. 중학생도 이해할 수 있는 수준으로.',
    '더 전문적으로': '더 전문적이고 학문적인 표현으로 수준을 높여줘.',
    '더 친근하게': '딱딱한 표현을 부드럽고 친근한 말투로 바꿔줘.',
    '더 격식있게': '격식 있고 공식적인 문체로 바꿔줘.',
    '중학생 눈높이로': '중학생이 읽고 바로 이해할 수 있는 수준으로 쉽게 바꿔줘.',
    '학부모 눈높이로': '학부모가 읽기 쉽고 이해하기 쉬운 표현으로 바꿔줘.',

    // 📝 내용 보완
    '예시 추가': '실제 예시를 2~3개 추가해줘. 구체적일수록 좋아.',
    '근거·이유 추가': '각 항목에 근거나 이유를 함께 설명해줘.',
    '구체적인 수치 추가': '추상적인 내용 대신 구체적인 수치나 데이터를 추가해줘.',
    '빠진 내용 채워줘': '중요한데 빠진 내용이 있으면 보완해서 완성도를 높여줘.',
    '핵심만 남기고 나머지 삭제': '불필요한 내용은 과감히 삭제하고 핵심만 남겨줘.',
    '처음부터 다른 방식으로': '지금과 완전히 다른 방식이나 구조로 처음부터 다시 작성해줘.',

    // 🏫 교육 현장 특화
    '2022 개정 교육과정에 맞게': '2022 개정 교육과정의 핵심역량과 성취기준에 맞게 수정해줘.',
    'NEIS 형식에 맞게': 'NEIS 학교생활기록부 입력 형식에 맞게 수정해줘. 명사형 어미로 종결하고 현재형으로 작성해줘.',
    '학년별로 버전 나눠줘': '같은 내용을 1학년용, 2학년용, 3학년용으로 각각 나눠서 작성해줘.',
    '교사 입장에서 다시 써줘': '학생이 아닌 교사가 활용하는 관점에서 다시 작성해줘.',
    '학생 활동 중심으로': '교사 설명 중심이 아니라 학생이 직접 참여하는 활동 중심으로 바꿔줘.',

    // 🎨 스타일 조정
    '더 사실적으로': 'photorealistic style, ultra detailed, real photo quality로 변경해줘.',
    '더 일러스트처럼': 'illustration style, artistic, hand-drawn feeling으로 변경해줘.',
    '더 단순하게': '더 단순하고 깔끔한 구성으로 변경해줘. 불필요한 요소 제거.',
    '더 화려하게': '더 화려하고 풍부한 디테일로 변경해줘.',
    '수채화 느낌으로': 'watercolor painting style, soft colors, artistic으로 변경해줘.',
    '픽셀아트 스타일로': 'pixel art style, 8-bit, retro game aesthetic으로 변경해줘.',
    '미니멀하게': 'minimalist design, clean, simple, lots of white space로 변경해줘.',

    // 🌈 색감·분위기
    '더 밝고 따뜻하게': 'bright lighting, warm colors, cheerful atmosphere, golden hour로 변경해줘.',
    '더 차갑고 세련되게': 'cool tones, sleek, modern, blue-grey palette로 변경해줘.',
    '더 몽환적으로': 'dreamy atmosphere, soft focus, fantasy elements, ethereal light로 변경해줘.',
    '더 역동적으로': 'dynamic composition, action, motion blur, energetic로 변경해줘.',
    '더 차분하게': 'calm, peaceful, serene, muted colors, gentle lighting으로 변경해줘.',
    '색감 더 풍부하게': 'vibrant colors, high saturation, colorful, rich palette로 변경해줘.',
    '흑백으로': 'black and white, monochrome, grayscale로 변경해줘.',

    // 👥 구성·배치
    '인물 추가': '프롬프트에 인물(사람)을 추가해줘. 자연스럽게 구성에 녹여줘.',
    '인물 제거': '인물 없이 배경이나 사물 중심으로 변경해줘.',
    '배경 더 강조': '배경을 더 상세하고 풍부하게 묘사하도록 변경해줘.',
    '배경 단순하게': '배경을 단순하게 처리하고 주요 대상에 집중하도록 변경해줘.',
    '클로즈업으로': 'close-up shot, macro photography style로 변경해줘.',
    '전체 풍경으로': 'wide angle, panoramic view, establishing shot으로 변경해줘.',
    '좌우 여백 추가': '프롬프트에 여백을 강조하는 표현 추가. negative space, minimalist composition.',

    // ✨ 품질·디테일
    '더 세밀하게': 'highly detailed, intricate details, fine textures로 변경해줘.',
    '더 고해상도 느낌으로': '8K, ultra high resolution, sharp focus, professional quality로 변경해줘.',
    '텍스처 추가': 'rich textures, tactile feeling, material details를 강조하도록 변경해줘.',
    '빛과 그림자 강조': 'dramatic lighting, chiaroscuro, strong shadows and highlights로 변경해줘.',
    '디테일 줄이고 깔끔하게': 'simple, clean design, minimal details, flat design으로 변경해줘.',

    // 🏫 교육 활용 특화 (이미지)
    '학생들이 보기 편하게': 'clear, easy to understand visual, educational illustration style로 변경해줘.',
    '수업 자료에 어울리게': 'clean educational illustration, textbook style, appropriate for classroom로 변경해줘.',
    '프레젠테이션용으로': 'presentation-ready, clean background, professional look로 변경해줘.',
    '인쇄했을 때 잘 보이게': 'high contrast, clear outlines, print-ready quality로 변경해줘.',
    '저작권 걱정 없는 스타일로': 'original artistic style, no brand references, generic illustration로 변경해줘.',
  }

  const issueParts = issues.map((i) => issueMap[i] || i).filter(Boolean)
  const allParts = [...issueParts, customRequest].filter(Boolean)

  if (allParts.length === 0) return null

  return `위 내용을 아래 조건에 맞게 수정해줘:\n${allParts.map((p, i) => `${i + 1}. ${p}`).join('\n')}`
}
