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
    },
    moodMap: {
      '밝고 따뜻한': 'bright, warm lighting, cheerful atmosphere',
      '차갑고 세련된': 'cool tones, sleek, modern',
      몽환적인: 'dreamy, fantasy atmosphere, ethereal',
      역동적인: 'dynamic, energetic, action',
      차분한: 'calm, peaceful, serene',
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
