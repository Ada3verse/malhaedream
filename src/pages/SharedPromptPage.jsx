import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AiShortcutLinks from '../components/AiShortcutLinks'
import DarkModeToggle from '../components/DarkModeToggle'
import { useToast } from '../components/Toast'
import { getPromptById } from '../utils/prompts'

const TYPE_LABELS = {
  image: '이미지',
  document: '문서',
  ib: 'IB',
}

const TYPE_BADGE_STYLES = {
  image: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
  document: 'bg-navy-50 text-navy-700 dark:bg-slate-700 dark:text-slate-200',
}

function formatDate(timestamp) {
  if (!timestamp?.toDate) return ''
  return timestamp.toDate().toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function SharedPromptPage() {
  const { promptId } = useParams()
  const showToast = useToast()
  const [prompt, setPrompt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    getPromptById(promptId).then((result) => {
      setPrompt(result)
      setLoading(false)
    })
  }, [promptId])

  const handleCopy = async () => {
    if (!prompt) return
    try {
      await navigator.clipboard.writeText(prompt.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
      showToast('복사되었습니다!', 'success')
    } catch {
      showToast('복사에 실패했습니다. 직접 선택 후 복사해주세요.', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-900 sm:px-6">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-2">
        <div className="flex w-full items-center justify-end">
          <DarkModeToggle className="!border-slate-300 !text-slate-500 hover:!bg-slate-100 dark:!border-white/30 dark:!text-slate-300 dark:hover:!bg-white/10" />
        </div>
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shadow-lg shadow-navy-600/30 dark:bg-blue-500"
          style={{ background: 'linear-gradient(135deg, #1e3a5f, #7c3aed)' }}
        >
          💬
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-navy-700 dark:text-white">
          말해드림
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          교사를 위한 AI 프롬프트 생성 서비스
        </p>
        <Link
          to="/"
          className="mt-2 rounded-lg border border-violet-300 px-4 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-50 dark:border-violet-500/40 dark:text-violet-400 dark:hover:bg-violet-500/10"
        >
          서비스 바로가기
        </Link>
      </div>

      <main className="mx-auto mt-8 max-w-xl">
        {loading ? (
          <p className="py-16 text-center text-slate-400">불러오는 중...</p>
        ) : !prompt ? (
          <p className="py-16 text-center text-slate-400">
            존재하지 않는 프롬프트입니다.
          </p>
        ) : (
          <>
            <div className="rounded-2xl border-2 border-violet-600 bg-[#faf5ff] p-5 shadow-md shadow-violet-200/60 dark:border-violet-500/40 dark:bg-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    TYPE_BADGE_STYLES[prompt.type] ?? 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {TYPE_LABELS[prompt.type] ?? prompt.type}
                </span>
                <span className="text-xs text-slate-400">
                  {formatDate(prompt.createdAt)}
                </span>
              </div>

              {(prompt.tags ?? []).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {prompt.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-3 whitespace-pre-wrap rounded-lg border border-violet-100 bg-white/70 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                {prompt.content}
              </div>

              <p className="mt-3 text-xs text-slate-400">
                작성자: {prompt.nickname}
              </p>

              <button
                type="button"
                onClick={handleCopy}
                style={{ background: 'linear-gradient(135deg, #1e3a5f, #7c3aed)' }}
                className="mt-4 w-full rounded-lg py-3 text-base font-semibold text-white shadow-md shadow-navy-600/20 transition hover:brightness-110 hover:shadow-lg dark:bg-blue-500 dark:bg-none dark:hover:bg-blue-600"
              >
                {copied ? '복사됨!' : '프롬프트 복사'}
              </button>
            </div>

            <div className="mt-4">
              <AiShortcutLinks isCopied={copied} />
            </div>

            <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-navy-100 bg-navy-50 p-6 text-center dark:border-slate-700 dark:bg-slate-800">
              <p className="text-sm font-medium text-navy-800 dark:text-slate-200">
                말해드림에서 나만의 프롬프트를 만들어보세요!
              </p>
              <Link
                to="/"
                style={{ background: 'linear-gradient(135deg, #1e3a5f, #7c3aed)' }}
                className="rounded-lg px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-navy-600/20 transition hover:brightness-110 hover:shadow-lg dark:bg-blue-500 dark:bg-none dark:hover:bg-blue-600"
              >
                말해드림 시작하기
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
