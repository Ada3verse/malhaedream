import { usePersistedToggle } from '../hooks/usePersistedToggle'

const STORAGE_KEY = 'malhaedream_refine_guide_open'

export default function PromptRefineGuideBox() {
  const [isOpen, toggleOpen] = usePersistedToggle(STORAGE_KEY, false)

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
      <button
        type="button"
        onClick={toggleOpen}
        className="flex w-full cursor-pointer items-center justify-between gap-2 text-left"
      >
        <span className="font-semibold">💬 결과가 마음에 안 드시나요?</span>
        <span>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <ul className="mt-1.5 list-disc space-y-1 pl-4">
          <li>원하는 결과가 아니라면 아래 [프롬프트 보완] 기능을 활용해보세요</li>
          <li>더 구체적인 조건을 추가하거나 "더 간결하게", "더 구체적으로" 버튼을 눌러보세요</li>
          <li>보완을 반복할수록 더 정확한 프롬프트가 완성됩니다 ✨</li>
        </ul>
      )}
    </div>
  )
}
