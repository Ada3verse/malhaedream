import { usePersistedToggle } from '../hooks/usePersistedToggle'

const DOCUMENT_ITEMS = [
  {
    emoji: '🟣',
    label: '역할 부여',
    desc: 'AI에게 누구처럼 답해야 하는지 알려줘요',
    effect: '교사 관점의 전문적인 답변을 유도해요',
  },
  {
    emoji: '🔵',
    label: '목적 명시',
    desc: '무엇을 만들어야 하는지 명확히 해요',
    effect: '엉뚱한 결과 방지',
  },
  {
    emoji: '🟡',
    label: '맥락 제공',
    desc: '학년·과목·단원 정보로 수준을 맞춰요',
    effect: '학생 수준에 맞는 내용이 나와요',
  },
  {
    emoji: '🟢',
    label: '조건·형식',
    desc: '말투와 출력 형식을 지정해요',
    effect: '원하는 형태로 결과를 통제해요',
  },
  {
    emoji: '🔴',
    label: '제약조건',
    desc: '반드시 포함할 것과 하면 안 되는 것을 명시',
    effect: 'AI가 빠뜨리는 것 없이 작성해요',
  },
]

const IMAGE_ITEMS = [
  {
    emoji: '🟣',
    label: '역할 부여',
    desc: 'AI에게 이미지 생성 전문가 역할을 알려줘요',
    effect: '더 전문적인 이미지 프롬프트를 유도해요',
  },
  {
    emoji: '🔵',
    label: '주제',
    desc: '무엇을 그릴지 명확히 해요',
    effect: '엉뚱한 이미지 생성 방지',
  },
  {
    emoji: '🟡',
    label: '분위기',
    desc: '이미지의 전체적인 느낌을 정해요',
    effect: '원하는 감성이 표현돼요',
  },
  {
    emoji: '🟣',
    label: '스타일',
    desc: '화풍·표현 방식을 지정해요',
    effect: '원하는 그림체로 결과를 통제해요',
  },
  {
    emoji: '⚪',
    label: '품질 접미어',
    desc: '고화질·디테일 등 품질 키워드를 추가해요',
    effect: '더 선명하고 완성도 높은 이미지가 나와요',
  },
]

const TIP_TEXT = {
  document:
    '"역할 + 목적 + 맥락 + 조건 + 제약" 순서로 써보세요.\n이 구조만 기억하면 어떤 AI에서도 좋은 결과를 얻을 수 있어요!',
  image:
    '"주제 + 스타일 + 분위기 + 품질" 순서로 써보세요.\n이 구조만 기억하면 어떤 이미지 생성 AI에서도 좋은 결과를 얻을 수 있어요!',
}

const STORAGE_KEY = 'malhaedream_explanation_open'

export default function PromptExplanationPanel({ type = 'document' }) {
  const [isOpen, toggleOpen] = usePersistedToggle(STORAGE_KEY, false)
  const items = type === 'image' ? IMAGE_ITEMS : DOCUMENT_ITEMS
  const tip = TIP_TEXT[type] ?? TIP_TEXT.document

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-700 dark:bg-gray-800">
      <button
        type="button"
        onClick={toggleOpen}
        className="flex w-full cursor-pointer items-center justify-between gap-2 text-left"
      >
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          📖 이 프롬프트가 이렇게 구성된 이유
        </span>
        <span className="text-slate-400 dark:text-slate-500">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <>
          <div className="mt-3 flex flex-col gap-2.5">
            {items.map((item, index) => (
              <div key={`${item.label}-${index}`} className="flex gap-2">
                <span className="shrink-0">{item.emoji}</span>
                <div>
                  <p className="font-medium text-slate-700 dark:text-slate-200">
                    {item.label}{' '}
                    <span className="font-normal text-slate-500 dark:text-slate-400">
                      {item.desc}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">→ {item.effect}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 border-t border-gray-200 pt-3 text-xs text-slate-600 dark:border-gray-700 dark:text-slate-300">
            <p className="font-medium">💡 직접 써볼 때는?</p>
            <p className="mt-1 whitespace-pre-line">{tip}</p>
          </div>
        </>
      )}
    </div>
  )
}
