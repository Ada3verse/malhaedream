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
      const en = `${subject}, ${styleStr}, ${moodStr}${extras ? ', ' + extras : ''}, high quality, detailed`
      const ko = `${subject} / 스타일: ${styles.join(', ')} / 분위기: ${moods.join(', ')}`
      return { en, ko }
    },
  },
  Claude: {
    format: (subject, styles, moods, extras) => {
      return {
        ko: `다음 조건에 맞는 이미지를 생성해주세요.\n\n주제: ${subject}\n스타일: ${styles.join(', ')}\n분위기: ${moods.join(', ')}${extras ? '\n추가 조건: ' + extras : ''}\n\n위 조건을 모두 반영하여 구체적이고 생동감 있게 표현해주세요.`,
        en: null,
      }
    },
  },
  'Gemini (Imagen 4 · nano banana)': {
    format: (subject, styles, moods, extras) => {
      const styleStr = styles.map((s) => imageTemplates['ChatGPT (GPT Image 1.5 · Duct-tape)'].styleMap[s] || s).join(', ')
      const moodStr = moods.map((m) => imageTemplates['ChatGPT (GPT Image 1.5 · Duct-tape)'].moodMap[m] || m).join(', ')
      const en = `${subject}, ${styleStr}, ${moodStr}${extras ? ', ' + extras : ''}, vibrant colors, high resolution`
      const ko = `${subject} / 스타일: ${styles.join(', ')} / 분위기: ${moods.join(', ')}`
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

export function generatePromptFromTemplate(template, content, tones, formats) {
  const conditionsStr = (template.conditions ?? []).map((item) => `- ${item}`).join('\n')

  const ko = (template.promptTemplate ?? '')
    .replaceAll('{{name}}', template.name ?? '')
    .replaceAll('{{content}}', content ?? '')
    .replaceAll('{{tones}}', tones.join(', '))
    .replaceAll('{{formats}}', formats.join(', '))
    .replaceAll('{{conditions}}', conditionsStr)

  return { ko, en: null }
}

export function refinePrompt(originalPrompt, quickFixes, customRequest) {
  const items = [
    ...quickFixes,
    ...(customRequest && customRequest.trim() ? [customRequest.trim()] : []),
  ]
  const additions = items.map((item) => `- ${item}`).join('\n')
  return `${originalPrompt}\n\n추가 조건:\n${additions}`
}
