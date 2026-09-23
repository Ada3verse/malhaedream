import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DarkModeToggle from '../components/DarkModeToggle'
import { useToast } from '../components/Toast'
import { CIRCLED_NUMBERS, GUIDE_STEPS } from '../constants/guide'
import { useAuthGuard } from '../hooks/useAuthGuard'
import { clearStoredUser } from '../utils/auth'
import { getPromptsByNickname } from '../utils/prompts'
import { getAllTemplates, updateTemplate } from '../utils/templates'
import UsageGuideModal from '../components/UsageGuideModal'

const GUIDE_SEEN_KEY = 'malhaedream_guide_seen'
const RECENT_PROMPTS_LIMIT = 3

const TYPE_LABELS = {
  image: '이미지',
  document: '문서',
}

const TYPE_BADGE_STYLES = {
  image: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
  document: 'bg-navy-50 text-navy-700 dark:bg-slate-700 dark:text-slate-200',
}

const CATEGORY_TABS = [
  { id: 'all', label: '전체' },
  { id: 'image', label: '🖼️ 이미지' },
  { id: 'lesson', label: '📚 수업' },
  { id: 'assessment', label: '📝 평가' },
  { id: 'admin', label: '🏫 행정' },
  { id: 'class', label: '👥 학급' },
]

const TEMPLATE_CATEGORY_MAP = {
  '이미지 생성 프롬프트': 'image',
  '수업 지도안': 'lesson',
  '학습지': 'lesson',
  '독서 활동지': 'lesson',
  '진로 탐색 활동지': 'lesson',
  '형성평가 문항': 'assessment',
  '수행평가 문항': 'assessment',
  '지필평가 문제': 'assessment',
  '쪽지 시험': 'assessment',
  '학생 피드백': 'assessment',
  '가정통신문': 'admin',
  '사업계획서': 'admin',
  '행사보고서': 'admin',
  '공문 초안': 'admin',
  '회의록': 'admin',
  '출장 보고서': 'admin',
  '기타': 'admin',
  '학급 규칙 안내문': 'class',
  '상담 일지': 'class',
}

const DEFAULT_TEMPLATE_ICON = '📝'

const TEMPLATE_ICON_MAP = {
  '이미지 생성 프롬프트': '🖼️',
  '가정통신문': '📨',
  '사업계획서': '📋',
  '행사보고서': '📊',
  '기타': '📝',
  '수업 지도안': '📚',
  '형성평가 문항': '✏️',
  '수행평가 문항': '📌',
  '학습지': '📄',
  '지필평가 문제': '📝',
  '쪽지 시험': '🗒️',
  '상담 일지': '💬',
  '공문 초안': '📮',
  '회의록': '🗂️',
  '출장 보고서': '🚌',
  '학생 피드백': '💡',
  '독서 활동지': '📖',
  '진로 탐색 활동지': '🧭',
  '학급 규칙 안내문': '📣',
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

export default function HomePage() {
  const navigate = useNavigate()
  const user = useAuthGuard()
  const showToast = useToast()
  const [templates, setTemplates] = useState([])
  const [recentPrompts, setRecentPrompts] = useState([])
  const [copiedId, setCopiedId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showBanner, setShowBanner] = useState(
    () => !localStorage.getItem(GUIDE_SEEN_KEY),
  )
  const [showGuideModal, setShowGuideModal] = useState(false)

  useEffect(() => {
    getAllTemplates().then(setTemplates)
  }, [])

  useEffect(() => {
    if (!user) return
    getPromptsByNickname(user.nickname, user.deviceId).then((list) =>
      setRecentPrompts(list.slice(0, RECENT_PROMPTS_LIMIT)),
    )
  }, [user])

  const handleLogout = () => {
    clearStoredUser()
    navigate('/', { replace: true })
  }

  const handleCopyRecent = async (item) => {
    try {
      await navigator.clipboard.writeText(item.content)
      setCopiedId(item.id)
      setTimeout(() => setCopiedId(null), 1500)
      showToast('복사되었습니다!', 'success')
    } catch {
      showToast('복사에 실패했습니다. 직접 선택 후 복사해주세요.', 'error')
    }
  }

  const handleDismissBanner = () => {
    localStorage.setItem(GUIDE_SEEN_KEY, 'true')
    setShowBanner(false)
  }

  const handleMoveTemplate = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= templates.length) return

    const current = templates[index]
    const target = templates[targetIndex]

    await Promise.all([
      updateTemplate(current.id, { order: target.order }),
      updateTemplate(target.id, { order: current.order }),
    ])

    setTemplates(await getAllTemplates())
  }

  if (!user) return null

  const isAdmin = user.role === 'admin'
  const isSearching = Boolean(searchQuery.trim())
  const isAllCategory = selectedCategory === 'all'

  const categoryFilteredTemplates = isAllCategory
    ? templates
    : templates.filter(
        (template) => TEMPLATE_CATEGORY_MAP[template.name] === selectedCategory,
      )

  const filteredTemplates = isSearching
    ? categoryFilteredTemplates.filter((template) => {
        const keyword = searchQuery.trim().toLowerCase()
        return (
          template.name?.toLowerCase().includes(keyword) ||
          template.description?.toLowerCase().includes(keyword)
        )
      })
    : categoryFilteredTemplates

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="flex items-center justify-between border-b-2 border-violet-500 bg-white px-4 py-3 shadow-md dark:bg-[#1e293b] sm:px-6">
        <span className="text-lg font-bold text-navy-600 dark:text-white">말해드림</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-navy-600 dark:text-navy-100">{user.nickname}님</span>
          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="rounded-lg border border-navy-600 px-3 py-1.5 text-sm text-navy-600 transition hover:bg-navy-50 dark:border-white/30 dark:text-white dark:hover:bg-white/10"
          >
            ❓ 도움말
          </button>
          <Link
            to="/mypage"
            className="rounded-lg border border-navy-600 px-3 py-1.5 text-sm text-navy-600 transition hover:bg-navy-50 dark:border-white/30 dark:text-white dark:hover:bg-white/10"
          >
            내 보관함
          </Link>
          <Link
            to="/library"
            className="rounded-lg border border-navy-600 px-3 py-1.5 text-sm text-navy-600 transition hover:bg-navy-50 dark:border-white/30 dark:text-white dark:hover:bg-white/10"
          >
            📚 라이브러리
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-navy-600 px-3 py-1.5 text-sm text-navy-600 transition hover:bg-navy-50 dark:border-white/30 dark:text-white dark:hover:bg-white/10"
          >
            로그아웃
          </button>
          <DarkModeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {showBanner && (
          <div className="mb-5 rounded-2xl border border-navy-200 bg-navy-50 p-5 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base font-semibold text-navy-800 dark:text-white">
                💡 말해드림 사용법
              </h2>
              <button
                type="button"
                onClick={handleDismissBanner}
                aria-label="안내 닫기"
                className="rounded-lg px-2 py-1 text-sm text-navy-500 transition hover:bg-navy-100 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                ✕
              </button>
            </div>
            <ol className="mt-3 flex flex-col gap-1.5 text-sm text-navy-700 dark:text-slate-300">
              {GUIDE_STEPS.map((step, index) => (
                <li key={step}>
                  {CIRCLED_NUMBERS[index]} {step}
                </li>
              ))}
            </ol>
          </div>
        )}

        <h1 className="text-2xl font-bold text-navy-800 dark:text-white">
          어떤 프롬프트가 필요하신가요?
        </h1>

        <div className="relative mt-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="어떤 프롬프트가 필요하세요? (예: 가정통신문, 이미지)"
            className="w-full rounded-lg border border-slate-200 py-2.5 pl-3 pr-10 text-sm text-slate-900 transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
          {isSearching && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="검색어 지우기"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        <div className="-mx-4 mt-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-2 pb-1">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                  selectedCategory === tab.id
                    ? 'bg-violet-600 text-white'
                    : 'border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredTemplates.length === 0 && (isSearching || !isAllCategory) && (
          <p className="mt-8 text-center text-slate-400 dark:text-slate-500">
            {isSearching
              ? '검색 결과가 없습니다. 다른 키워드로 검색해보세요.'
              : '해당 카테고리에 템플릿이 없습니다.'}
          </p>
        )}

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template, index) => (
            <div key={template.id} className="flex items-stretch gap-2">
              {isAdmin && !isSearching && isAllCategory && (
                <div className="flex flex-col justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMoveTemplate(index, 'up')}
                    disabled={index === 0}
                    aria-label="위로 이동"
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveTemplate(index, 'down')}
                    disabled={index === templates.length - 1}
                    aria-label="아래로 이동"
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    ↓
                  </button>
                </div>
              )}

              {template.isActive ? (
                <Link
                  to={`/prompt/${template.type}`}
                  state={{ templateName: template.name }}
                  className="relative flex h-full min-h-[9.5rem] flex-1 flex-col gap-1.5 rounded-2xl border border-slate-200 border-l-4 border-l-violet-600 bg-white p-5 shadow-md shadow-slate-200/60 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(124,58,237,0.15)] dark:border-slate-700 dark:border-l-violet-500 dark:bg-slate-800 dark:shadow-none dark:hover:shadow-[0_8px_25px_rgba(124,58,237,0.25)]"
                >
                  <span className="text-3xl">
                    {TEMPLATE_ICON_MAP[template.name] ?? DEFAULT_TEMPLATE_ICON}
                  </span>
                  <h2 className="text-lg font-semibold text-navy-800 dark:text-white">
                    {template.name}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{template.description}</p>
                </Link>
              ) : (
                <div
                  aria-disabled="true"
                  className="relative flex h-full min-h-[9.5rem] flex-1 cursor-not-allowed flex-col gap-1.5 rounded-2xl border border-slate-200 border-l-4 border-l-slate-300 bg-slate-100 p-5 dark:border-slate-700 dark:border-l-slate-600 dark:bg-slate-800/60"
                >
                  <span className="absolute right-4 top-4 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                    준비중
                  </span>
                  <span className="text-3xl grayscale opacity-60">
                    {TEMPLATE_ICON_MAP[template.name] ?? DEFAULT_TEMPLATE_ICON}
                  </span>
                  <h2 className="text-lg font-semibold text-slate-500 dark:text-slate-400">
                    {template.name}
                  </h2>
                  <p className="text-sm text-slate-400 dark:text-slate-500">{template.description}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {recentPrompts.length > 0 && (
          <section className="mt-8">
            <div className="flex items-center justify-between gap-2">
              <h2 className="border-l-4 border-violet-600 pl-3 text-lg font-semibold text-navy-800 dark:text-white">
                최근에 만든 프롬프트
              </h2>
              <Link
                to="/mypage"
                className="text-sm text-violet-600 transition hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
              >
                전체 보기 →
              </Link>
            </div>

            <ul className="mt-3 flex flex-col gap-3">
              {recentPrompts.map((item) => (
                <li
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        TYPE_BADGE_STYLES[item.type] ?? 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {TYPE_LABELS[item.type] ?? item.type}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                    {item.content.length > 60
                      ? `${item.content.slice(0, 60)}...`
                      : item.content}
                  </p>

                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => handleCopyRecent(item)}
                      className="rounded-lg border border-violet-300 px-3 py-1 text-xs font-medium text-violet-700 transition hover:bg-violet-50 dark:border-violet-500/40 dark:text-violet-400 dark:hover:bg-violet-500/10"
                    >
                      {copiedId === item.id ? '복사됨!' : '복사'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      {showGuideModal && (
        <UsageGuideModal onClose={() => setShowGuideModal(false)} />
      )}
    </div>
  )
}
