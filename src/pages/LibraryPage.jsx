import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DarkModeToggle from '../components/DarkModeToggle'
import Modal from '../components/Modal'
import { useToast } from '../components/Toast'
import { useAuthGuard } from '../hooks/useAuthGuard'
import { clearStoredUser } from '../utils/auth'
import { getSharedPrompts, incrementCopyCount } from '../utils/prompts'
import { getAllTemplates } from '../utils/templates'

const POPULAR_COPY_THRESHOLD = 5
const TOP_RANK_LIMIT = 5
const RANK_COLORS = ['#f59e0b', '#9ca3af', '#cd7f32']
const DEFAULT_RANK_COLOR = '#1e3a5f'

const TYPE_LABELS = {
  image: '이미지',
  document: '문서',
}

const TYPE_BADGE_STYLES = {
  image: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
  document: 'bg-navy-50 text-navy-700 dark:bg-slate-700 dark:text-slate-200',
}

const PREVIEW_LENGTH = 100

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

export default function LibraryPage() {
  const navigate = useNavigate()
  const user = useAuthGuard()
  const showToast = useToast()
  const [prompts, setPrompts] = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('전체')
  const [activeTagFilter, setActiveTagFilter] = useState('전체')
  const [copiedId, setCopiedId] = useState(null)
  const [viewingItem, setViewingItem] = useState(null)

  useEffect(() => {
    if (!user) return

    setLoading(true)
    Promise.all([getSharedPrompts(), getAllTemplates()]).then(
      ([sharedPrompts, allTemplates]) => {
        setPrompts(sharedPrompts)
        setTemplates(allTemplates)
        setLoading(false)
      },
    )
  }, [user])

  if (!user) return null

  const handleLogout = () => {
    clearStoredUser()
    navigate('/', { replace: true })
  }

  const handleCopy = async (item) => {
    try {
      await navigator.clipboard.writeText(item.content)
      setCopiedId(item.id)
      setTimeout(() => setCopiedId(null), 1500)

      const nextCopyCount = (item.copyCount ?? 0) + 1
      setPrompts((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, copyCount: nextCopyCount } : p)),
      )
      setViewingItem((prev) =>
        prev && prev.id === item.id ? { ...prev, copyCount: nextCopyCount } : prev,
      )
      incrementCopyCount(item.id)
    } catch {
      setCopiedId(null)
      showToast('복사에 실패했습니다. 직접 선택 후 복사해주세요.', 'error')
    }
  }

  const filterOptions = ['전체', ...templates.map((template) => template.name)]
  const tagOptions = ['전체', ...new Set(prompts.flatMap((item) => item.tags ?? []))]

  const topPrompts = [...prompts]
    .filter((item) => (item.copyCount ?? 0) > 0)
    .sort((a, b) => (b.copyCount ?? 0) - (a.copyCount ?? 0))
    .slice(0, TOP_RANK_LIMIT)

  const filteredPrompts = prompts
    .filter((item) => activeFilter === '전체' || item.templateName === activeFilter)
    .filter(
      (item) => activeTagFilter === '전체' || (item.tags ?? []).includes(activeTagFilter),
    )

  return (
    <div className="min-h-screen bg-slate-50 pb-16 dark:bg-slate-900">
      <header className="flex items-center justify-between bg-navy-700 px-4 py-3 shadow-md sm:px-6">
        <Link to="/home" className="text-lg font-bold text-white">
          말해드림
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-navy-100">{user.nickname}님</span>
          <Link
            to="/mypage"
            className="rounded-lg border border-white/30 px-3 py-1.5 text-sm text-white transition hover:bg-white/10"
          >
            내 보관함
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-white/30 px-3 py-1.5 text-sm text-white transition hover:bg-white/10"
          >
            로그아웃
          </button>
          <DarkModeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-navy-800 dark:text-white">📚 공유 라이브러리</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          선생님들이 공유한 프롬프트를 확인하고 바로 복사해보세요.
        </p>

        {topPrompts.length > 0 && (
          <section className="mt-5">
            <h2 className="border-l-4 border-violet-600 pl-3 text-lg font-semibold text-navy-800 dark:text-white">
              🔥 인기 프롬프트 TOP 5
            </h2>
            <ul className="mt-3 flex flex-col gap-2">
              {topPrompts.map((item, index) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-800"
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: RANK_COLORS[index] ?? DEFAULT_RANK_COLOR }}
                  >
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          TYPE_BADGE_STYLES[item.type] ?? 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.templateName ?? TYPE_LABELS[item.type] ?? item.type}
                      </span>
                      <span className="shrink-0 text-xs text-slate-400">
                        📋 {item.copyCount}회 복사
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-700 dark:text-slate-300">
                      {item.content.length > PREVIEW_LENGTH
                        ? `${item.content.slice(0, PREVIEW_LENGTH)}...`
                        : item.content}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewingItem(item)}
                    className="shrink-0 rounded-lg border border-violet-300 px-3 py-1 text-xs font-medium text-violet-700 transition hover:bg-violet-50 dark:border-violet-500/40 dark:text-violet-400 dark:hover:bg-violet-500/10"
                  >
                    보기
                  </button>
                </li>
              ))}
            </ul>
            <hr className="mt-6 border-slate-200 dark:border-slate-700" />
          </section>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setActiveFilter(option)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                activeFilter === option
                  ? 'border-violet-600 bg-violet-600 text-white dark:border-violet-500 dark:bg-violet-500'
                  : 'border-slate-200 bg-slate-100 text-slate-600 hover:border-violet-300 hover:bg-violet-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        {tagOptions.length > 1 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {tagOptions.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setActiveTagFilter(tag)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  activeTagFilter === tag
                    ? 'border-violet-600 bg-violet-600 text-white dark:border-violet-500 dark:bg-violet-500'
                    : 'border-slate-200 bg-slate-100 text-slate-600 hover:border-violet-300 hover:bg-violet-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        <div className="mt-6">
          {loading ? (
            <p className="py-12 text-center text-slate-400">불러오는 중...</p>
          ) : filteredPrompts.length === 0 ? (
            <p className="py-12 text-center text-slate-400">
              아직 공유된 프롬프트가 없습니다. 첫 번째로 공유해보세요!
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {filteredPrompts.map((item) => (
                <li
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md shadow-slate-200/60 transition hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          TYPE_BADGE_STYLES[item.type] ?? 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.templateName ?? TYPE_LABELS[item.type] ?? item.type}
                      </span>
                      {(item.copyCount ?? 0) >= POPULAR_COPY_THRESHOLD && (
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-600">
                          🔥 인기
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>

                  {(item.tags ?? []).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                    {item.content.length > PREVIEW_LENGTH
                      ? `${item.content.slice(0, PREVIEW_LENGTH)}...`
                      : item.content}
                  </p>

                  <p className="mt-2 text-xs text-slate-400">
                    작성자: {item.nickname}
                    {(item.copyCount ?? 0) > 0 && ` · 📋 ${item.copyCount}회 복사`}
                  </p>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setViewingItem(item)}
                      className="rounded-lg border border-violet-300 px-3 py-1 text-xs font-medium text-violet-700 transition hover:bg-violet-50 dark:border-violet-500/40 dark:text-violet-400 dark:hover:bg-violet-500/10"
                    >
                      전체 보기
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(item)}
                      className="rounded-lg border border-violet-300 px-3 py-1 text-xs font-medium text-violet-700 transition hover:bg-violet-50 dark:border-violet-500/40 dark:text-violet-400 dark:hover:bg-violet-500/10"
                    >
                      {copiedId === item.id ? '복사됨!' : '복사'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {viewingItem && (
        <Modal title="프롬프트 전체 보기" onClose={() => setViewingItem(null)}>
          <div className="flex items-center justify-between gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                TYPE_BADGE_STYLES[viewingItem.type] ?? 'bg-slate-100 text-slate-600'
              }`}
            >
              {viewingItem.templateName ?? TYPE_LABELS[viewingItem.type] ?? viewingItem.type}
            </span>
            <button
              type="button"
              onClick={() => handleCopy(viewingItem)}
              className="rounded-lg border border-violet-300 px-3 py-1.5 text-xs font-medium text-violet-700 transition hover:bg-violet-50 dark:border-violet-500/40 dark:text-violet-400 dark:hover:bg-violet-500/10"
            >
              {copiedId === viewingItem.id ? '복사됨!' : '복사'}
            </button>
          </div>

          {(viewingItem.tags ?? []).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {viewingItem.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <p className="mt-2 text-xs text-slate-400">
            작성자: {viewingItem.nickname} · {formatDate(viewingItem.createdAt)}
            {(viewingItem.copyCount ?? 0) > 0 && ` · 📋 ${viewingItem.copyCount}회 복사`}
          </p>

          <div className="mt-3 whitespace-pre-wrap rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            {viewingItem.content}
          </div>
        </Modal>
      )}
    </div>
  )
}
