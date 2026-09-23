import { useState } from 'react'
import { usePersistedToggle } from '../hooks/usePersistedToggle'
import { generateFollowUpPrompt } from '../utils/templateEngine'

const ISSUE_OPTIONS = [
  '너무 길어요',
  '너무 짧아요',
  '너무 어려워요',
  '너무 쉬워요',
  '형식이 달라요',
  '내용이 빠진 것 같아요',
  '톤이 맞지 않아요',
  '더 구체적으로 써줬으면 해요',
  '예시가 필요해요',
  '표로 정리해줬으면 해요',
]

const STORAGE_KEY = 'malhaedream_followup_open'

export default function PromptFollowUpBox() {
  const [isOpen, toggleOpen] = usePersistedToggle(STORAGE_KEY, false)
  const [selectedIssues, setSelectedIssues] = useState([])
  const [customRequest, setCustomRequest] = useState('')
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const toggleIssue = (issue) => {
    setSelectedIssues((prev) =>
      prev.includes(issue) ? prev.filter((item) => item !== issue) : [...prev, issue],
    )
  }

  const handleGenerate = () => {
    const generated = generateFollowUpPrompt(selectedIssues, customRequest.trim())

    if (!generated) {
      setResult('')
      setError('문제점을 선택하거나 직접 입력해주세요.')
      return
    }

    setResult(generated)
    setCopied(false)
    setError('')
  }

  const handleCopy = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm dark:border-orange-800 dark:bg-orange-950">
      <button
        type="button"
        onClick={toggleOpen}
        className="flex w-full cursor-pointer items-center justify-between gap-2 text-left"
      >
        <span className="font-semibold text-orange-800 dark:text-orange-300">
          🔄 ChatGPT/Claude에서 결과가 맘에 안 드셨나요?
        </span>
        <span className="text-orange-500 dark:text-orange-400">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="mt-3 flex flex-col gap-3">
          <p className="text-sm text-orange-700 dark:text-orange-300">
            ChatGPT나 Claude에서 결과를 받았는데 맘에 안 드시나요?
            <br />
            아래에서 문제점을 선택하거나 직접 입력하면 이어서 쓸 수 있는 후속 프롬프트를 만들어드려요.
          </p>

          <div className="flex flex-wrap gap-2">
            {ISSUE_OPTIONS.map((issue) => (
              <button
                key={issue}
                type="button"
                onClick={() => toggleIssue(issue)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  selectedIssues.includes(issue)
                    ? 'border-orange-600 bg-orange-600 text-white dark:border-orange-500 dark:bg-orange-500'
                    : 'border-orange-300 bg-white text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:bg-orange-900 dark:text-orange-300 dark:hover:bg-orange-800'
                }`}
              >
                {issue}
              </button>
            ))}
          </div>

          <textarea
            value={customRequest}
            onChange={(e) => setCustomRequest(e.target.value)}
            rows={2}
            placeholder="그 외 원하는 점을 직접 입력하세요 (예: 학생 눈높이에 맞게 더 쉽게 써줘)"
            className="w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm text-slate-700 transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-400/20 dark:border-orange-800 dark:bg-orange-900/40 dark:text-white"
          />

          <button
            type="button"
            onClick={handleGenerate}
            className="self-start rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600"
          >
            후속 프롬프트 생성
          </button>

          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

          {result && (
            <div className="rounded-lg border border-orange-200 bg-white p-3 dark:border-orange-800 dark:bg-orange-900/40">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-orange-700 dark:text-orange-300">
                  생성된 후속 프롬프트
                </p>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-lg border border-orange-300 px-3 py-1 text-xs font-medium text-orange-700 transition hover:bg-orange-50 dark:border-orange-600 dark:text-orange-300 dark:hover:bg-orange-800"
                >
                  {copied ? '복사됨!' : '복사'}
                </button>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">
                {result}
              </p>
              <p className="mt-2 text-xs text-orange-600 dark:text-orange-400">
                💡 ChatGPT나 Claude 대화창에 이어서 붙여넣으세요!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
