const DOCUMENT_CONFIG = {
  title: '📎 참고 자료가 있으신가요?',
  description:
    '수행평가 결과물, 학생 활동지, 참고 문서 등이 있다면\nChatGPT나 Claude에서 파일을 직접 업로드하고\n위에서 복사한 프롬프트를 함께 붙여넣으세요!',
  examples: [
    { emoji: '📄', text: '"수행평가 결과물 사진을 올리고 → 프롬프트 붙여넣기 → 학생 피드백 자동 생성"' },
    { emoji: '📊', text: '"학생 설문 결과 엑셀을 올리고 → 프롬프트 붙여넣기 → 분석 보고서 생성"' },
    { emoji: '📝', text: '"작년 사업계획서를 올리고 → 프롬프트 붙여넣기 → 올해 버전으로 수정"' },
  ],
  tip: '💡 ChatGPT는 이미지·PDF·엑셀, Claude는 PDF·텍스트 파일 업로드를 지원해요.',
}

const IMAGE_CONFIG = {
  title: '📎 참고 이미지가 있으신가요?',
  description:
    '비슷한 느낌의 참고 이미지가 있다면\nChatGPT나 Gemini에 이미지를 직접 업로드하고\n위에서 복사한 프롬프트를 함께 붙여넣으세요!',
  examples: [
    { emoji: '🖼️', text: '"참고 이미지를 올리고 → 프롬프트 붙여넣기 → 비슷한 스타일로 생성"' },
    { emoji: '✏️', text: '"손으로 그린 스케치를 올리고 → 프롬프트 붙여넣기 → 완성된 이미지로 변환"' },
  ],
  tip: '💡 ChatGPT(DALL-E)와 Gemini는 참고 이미지 업로드를 지원해요.',
}

export default function FileUploadGuideBox({ type = 'document' }) {
  const config = type === 'image' ? IMAGE_CONFIG : DOCUMENT_CONFIG
  const gridClass = config.examples.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'

  return (
    <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm dark:border-green-800 dark:bg-green-950">
      <p className="font-semibold text-green-800 dark:text-green-300">{config.title}</p>
      <p className="mt-2 whitespace-pre-line text-green-700 dark:text-green-300">
        {config.description}
      </p>

      <div className={`mt-3 grid grid-cols-1 gap-2 ${gridClass}`}>
        {config.examples.map((example, index) => (
          <div
            key={index}
            className="rounded-lg border border-green-200 bg-white p-3 text-xs text-slate-600 dark:border-green-800 dark:bg-green-900/40 dark:text-slate-300"
          >
            <span className="mr-1">{example.emoji}</span>
            {example.text}
          </div>
        ))}
      </div>

      <p className="mt-3 text-sm text-green-700 dark:text-green-300">{config.tip}</p>
    </div>
  )
}
