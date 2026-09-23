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
      const en = `[[SUBJECT]]${subject}[[/SUBJECT]], [[STYLE]]${styleStr}[[/STYLE]], [[MOOD]]${moodStr}[[/MOOD]]${extras ? ', ' + extras : ''}, [[SUFFIX]]high quality, detailed[[/SUFFIX]]`
      const ko = `[[SUBJECT]]${subject}[[/SUBJECT]] / [[STYLE]]스타일: ${styles.join(', ')}[[/STYLE]] / [[MOOD]]분위기: ${moods.join(', ')}[[/MOOD]]`
      return { en, ko }
    },
  },
  Claude: {
    format: (subject, styles, moods, extras) => {
      return {
        ko: `[[ROLE]]당신은 이미지 생성 전문가입니다.[[/ROLE]] 다음 조건에 맞는 이미지를 생성해주세요.\n\n[[SUBJECT]]주제: ${subject}[[/SUBJECT]]\n[[STYLE]]스타일: ${styles.join(', ')}[[/STYLE]]\n[[MOOD]]분위기: ${moods.join(', ')}[[/MOOD]]${extras ? '\n추가 조건: ' + extras : ''}\n\n위 조건을 모두 반영하여 구체적이고 생동감 있게 표현해주세요.`,
        en: null,
      }
    },
  },
  'Gemini (Imagen 4 · nano banana)': {
    format: (subject, styles, moods, extras) => {
      const styleStr = styles.map((s) => imageTemplates['ChatGPT (GPT Image 1.5 · Duct-tape)'].styleMap[s] || s).join(', ')
      const moodStr = moods.map((m) => imageTemplates['ChatGPT (GPT Image 1.5 · Duct-tape)'].moodMap[m] || m).join(', ')
      const en = `[[SUBJECT]]${subject}[[/SUBJECT]], [[STYLE]]${styleStr}[[/STYLE]], [[MOOD]]${moodStr}[[/MOOD]]${extras ? ', ' + extras : ''}, [[SUFFIX]]vibrant colors, high resolution[[/SUFFIX]]`
      const ko = `[[SUBJECT]]${subject}[[/SUBJECT]] / [[STYLE]]스타일: ${styles.join(', ')}[[/STYLE]] / [[MOOD]]분위기: ${moods.join(', ')}[[/MOOD]]`
      return { en, ko }
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
