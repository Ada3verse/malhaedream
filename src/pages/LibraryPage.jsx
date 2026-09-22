import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Modal from '../components/Modal'
import { useAuthGuard } from '../hooks/useAuthGuard'
import { clearStoredUser } from '../utils/auth'
import { getSharedPrompts } from '../utils/prompts'
import { getAllTemplates } from '../utils/templates'

const TYPE_LABELS = {
  image: '이미지',
  document: '문서',
}

const TYPE_BADGE_STYLES = {
  image: 'bg-blue-100 text-blue-700',
  document: 'bg-green-100 text-green-700',
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
  const [prompts, setPrompts] = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('전체')
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
    } catch {
      setCopiedId(null)
    }
  }

  const filterOptions = ['전체', ...templates.map((template) => template.name)]

  const filteredPrompts =
    activeFilter === '전체'
      ? prompts
      : prompts.filter((item) => item.templateName === activeFilter)

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
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
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-navy-800">📚 공유 라이브러리</h1>
        <p className="mt-1 text-sm text-slate-500">
          선생님들이 공유한 프롬프트를 확인하고 바로 복사해보세요.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setActiveFilter(option)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                activeFilter === option
                  ? 'border-navy-600 bg-navy-600 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-navy-300 hover:bg-navy-50'
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {loading ? (
            <p className="py-12 text-center text-slate-400">불러오는 중...</p>
          ) : filteredPrompts.length === 0 ? (
            <p className="py-12 text-center text-slate-400">
              공유된 프롬프트가 없습니다.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {filteredPrompts.map((item) => (
                <li
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md shadow-slate-200/60 transition hover:shadow-lg"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        TYPE_BADGE_STYLES[item.type] ?? 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.templateName ?? TYPE_LABELS[item.type] ?? item.type}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
                    {item.content.length > PREVIEW_LENGTH
                      ? `${item.content.slice(0, PREVIEW_LENGTH)}...`
                      : item.content}
                  </p>

                  <p className="mt-2 text-xs text-slate-400">
                    작성자: {item.nickname}
                  </p>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setViewingItem(item)}
                      className="rounded-lg border border-navy-200 px-3 py-1 text-xs font-medium text-navy-700 transition hover:bg-navy-50"
                    >
                      전체 보기
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(item)}
                      className="rounded-lg bg-navy-600 px-3 py-1 text-xs font-medium text-white shadow-sm transition hover:bg-navy-700"
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
              className="rounded-lg bg-navy-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-navy-700"
            >
              {copiedId === viewingItem.id ? '복사됨!' : '복사'}
            </button>
          </div>

          <p className="mt-2 text-xs text-slate-400">
            작성자: {viewingItem.nickname} · {formatDate(viewingItem.createdAt)}
          </p>

          <div className="mt-3 whitespace-pre-wrap rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
            {viewingItem.content}
          </div>
        </Modal>
      )}
    </div>
  )
}
