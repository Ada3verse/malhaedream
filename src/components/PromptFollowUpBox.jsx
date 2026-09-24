import { useState } from 'react'
import { usePersistedToggle } from '../hooks/usePersistedToggle'
import { generateFollowUpPrompt } from '../utils/templateEngine'

const DOCUMENT_ISSUE_CATEGORIES = [
  {
    title: '📏 분량·형식',
    issues: ['더 짧게', '더 길게', '표로 정리', '개조식으로', '줄글로', '항목 수 줄이기', '항목 수 늘리기'],
  },
  {
    title: '🎯 수준·톤',
    issues: ['더 쉽게', '더 전문적으로', '더 친근하게', '더 격식있게', '중학생 눈높이로', '학부모 눈높이로'],
  },
  {
    title: '📝 내용 보완',
    issues: [
      '예시 추가',
      '근거·이유 추가',
      '구체적인 수치 추가',
      '빠진 내용 채워줘',
      '핵심만 남기고 나머지 삭제',
      '처음부터 다른 방식으로',
    ],
  },
  {
    title: '🏫 교육 현장 특화',
    issues: [
      '2022 개정 교육과정에 맞게',
      'NEIS 형식에 맞게',
      '학년별로 버전 나눠줘',
      '교사 입장에서 다시 써줘',
      '학생 활동 중심으로',
    ],
  },
]

const IMAGE_ISSUE_CATEGORIES = [
  {
    title: '🎨 스타일 조정',
    issues: [
      '더 사실적으로',
      '더 일러스트처럼',
      '더 단순하게',
      '더 화려하게',
      '수채화 느낌으로',
      '픽셀아트 스타일로',
      '미니멀하게',
    ],
  },
  {
    title: '🌈 색감·분위기',
    issues: [
      '더 밝고 따뜻하게',
      '더 차갑고 세련되게',
      '더 몽환적으로',
      '더 역동적으로',
      '더 차분하게',
      '색감 더 풍부하게',
      '흑백으로',
    ],
  },
  {
    title: '👥 구성·배치',
    issues: [
      '인물 추가',
      '인물 제거',
      '배경 더 강조',
      '배경 단순하게',
      '클로즈업으로',
      '전체 풍경으로',
      '좌우 여백 추가',
    ],
  },
  {
    title: '✨ 품질·디테일',
    issues: ['더 세밀하게', '더 고해상도 느낌으로', '텍스처 추가', '빛과 그림자 강조', '디테일 줄이고 깔끔하게'],
  },
  {
    title: '🏫 교육 활용 특화',
    issues: [
      '학생들이 보기 편하게',
      '수업 자료에 어울리게',
      '프레젠테이션용으로',
      '인쇄했을 때 잘 보이게',
      '저작권 걱정 없는 스타일로',
    ],
  },
]

const CUSTOM_PLACEHOLDER = {
  document: '그 외 원하는 점을 직접 입력하세요 (예: 3학년 수준에 맞게 더 어렵게, 실험 활동을 포함해서, 10분 안에 할 수 있는 분량으로)',
  image: '그 외 원하는 점을 직접 입력하세요 (예: 배경에 칠판을 추가해줘, 계절감을 가을로 바꿔줘)',
}

const STORAGE_KEY = 'malhaedream_followup_open'

export default function PromptFollowUpBox({ type = 'document', toolLabel = 'ChatGPT/Claude/Gemini' }) {
  const [isOpen, toggleOpen] = usePersistedToggle(STORAGE_KEY, false)
  const categories = type === 'image' ? IMAGE_ISSUE_CATEGORIES : DOCUMENT_ISSUE_CATEGORIES
  const customPlaceholder = CUSTOM_PLACEHOLDER[type] ?? CUSTOM_PLACEHOLDER.document
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
          🔄 {toolLabel}에서 결과가 맘에 안 드셨나요?
        </span>
        <span className="text-orange-500 dark:text-orange-400">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="mt-3 flex flex-col gap-3">
          <p className="text-sm text-orange-700 dark:text-orange-300">
            {toolLabel}에서 결과를 받았는데 맘에 안 드시나요?
            <br />
            아래에서 문제점을 선택하거나 직접 입력하면 이어서 쓸 수 있는 후속 프롬프트를 만들어드려요.
          </p>

          <div className="flex flex-col gap-3">
            {categories.map((category) => (
              <div key={category.title}>
                <p className="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {category.title}
                </p>
                <div className="flex flex-wrap gap-2">
                  {category.issues.map((issue) => (
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
              </div>
            ))}
          </div>

          <textarea
            value={customRequest}
            onChange={(e) => setCustomRequest(e.target.value)}
            rows={2}
            placeholder={customPlaceholder}
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
                💡 {toolLabel} 대화창에 이어서 붙여넣으세요!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
