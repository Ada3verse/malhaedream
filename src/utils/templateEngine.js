const imageTemplates = {
  'ChatGPT (gpt-image-1)': {
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
      const styleStr = styles.map((s) => imageTemplates['ChatGPT (gpt-image-1)'].styleMap[s] || s).join(', ')
      const moodStr = moods.map((m) => imageTemplates['ChatGPT (gpt-image-1)'].moodMap[m] || m).join(', ')
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
  'Gemini (imagen4)': {
    format: (subject, styles, moods, extras) => {
      const styleStr = styles.map((s) => imageTemplates['ChatGPT (gpt-image-1)'].styleMap[s] || s).join(', ')
      const moodStr = moods.map((m) => imageTemplates['ChatGPT (gpt-image-1)'].moodMap[m] || m).join(', ')
      const en = `${subject}, ${styleStr}, ${moodStr}${extras ? ', ' + extras : ''}, vibrant colors, high resolution`
      const ko = `${subject} / 스타일: ${styles.join(', ')} / 분위기: ${moods.join(', ')}`
      return { en, ko }
    },
  },
}

const documentTemplates = {
  가정통신문: {
    format: (content, tones, formats) => {
      const toneStr = tones.join(', ')
      const formatStr = formats.join(', ')
      return `당신은 중학교 교사입니다. 아래 조건에 맞는 가정통신문을 작성해주세요.\n\n핵심 내용: ${content}\n말투: ${toneStr}\n출력 형식: ${formatStr}\n\n조건:\n- 학부모가 읽기 쉽게 작성\n- 학교 공문서 형식 준수\n- 제목, 본문, 문의처 포함`
    },
  },
  사업계획서: {
    format: (content, tones, formats) => {
      return `당신은 학교 업무 전문가입니다. 아래 조건에 맞는 사업계획서를 작성해주세요.\n\n사업 내용: ${content}\n말투: ${tones.join(', ')}\n출력 형식: ${formats.join(', ')}\n\n조건:\n- 목적, 대상, 일정, 예산(항목만), 기대효과 포함\n- 학교 공문서 형식 준수`
    },
  },
  행사보고서: {
    format: (content, tones, formats) => {
      return `당신은 학교 업무 전문가입니다. 아래 조건에 맞는 행사보고서를 작성해주세요.\n\n행사 내용: ${content}\n말투: ${tones.join(', ')}\n출력 형식: ${formats.join(', ')}\n\n조건:\n- 행사명, 일시, 장소, 참가인원, 주요내용, 성과 포함\n- 객관적이고 명확하게 작성`
    },
  },
  기타: {
    format: (content, tones, formats) => {
      return `당신은 학교 업무 전문가입니다. 아래 조건에 맞는 문서를 작성해주세요.\n\n내용: ${content}\n말투: ${tones.join(', ')}\n출력 형식: ${formats.join(', ')}`
    },
  },
}

export function generateImagePrompt(tool, subject, styles, moods, extras) {
  const template = imageTemplates[tool]
  if (!template) return null
  return template.format(subject, styles, moods, extras)
}

export function generateDocumentPrompt(docType, content, tones, formats) {
  const template = documentTemplates[docType] || documentTemplates['기타']
  return { ko: template.format(content, tones, formats), en: null }
}
