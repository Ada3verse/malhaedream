import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DarkModeToggle from '../components/DarkModeToggle'
import { useToast } from '../components/Toast'
import { CIRCLED_NUMBERS, GUIDE_STEPS } from '../constants/guide'
import { useAuthGuard } from '../hooks/useAuthGuard'
import { clearStoredUser } from '../utils/auth'
import { getPromptsByNickname } from '../utils/prompts'
import { getCurrentEvents, getUpcomingEvents } from '../utils/schoolEvents'
import { getAllTemplates, updateTemplate } from '../utils/templates'
import UsageGuideModal from '../components/UsageGuideModal'

const IMAGE_TEMPLATE_NAME = '이미지 생성 프롬프트'

const GUIDE_SEEN_KEY = 'malhaedream_guide_seen'

function isBannerHidden() {
  try {
    const raw = localStorage.getItem(GUIDE_SEEN_KEY)
    if (!raw) return false
    const { until } = JSON.parse(raw)
    if (!until) return true // 구버전 '다신 보지 않음' 호환
    return Date.now() < until
  } catch {
    return false
  }
}

function hideBanner(days) {
  try {
    const until = days === Infinity ? null : Date.now() + days * 24 * 60 * 60 * 1000
    localStorage.setItem(GUIDE_SEEN_KEY, JSON.stringify({ until }))
  } catch {}
}
const RECENT_PROMPTS_LIMIT = 3

const TYPE_LABELS = {
  image: '이미지',
  document: '문서',
  ib: 'IB',
}

const TYPE_BADGE_STYLES = {
  image: 'bg-mint-100 text-mint-700 dark:bg-mint-500/20 dark:text-mint-300',
  document: 'bg-mint-50 text-mint-700 dark:bg-slate-700 dark:text-slate-200',
  ib: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
}

const CATEGORY_TABS = [
  { id: 'all', label: '전체' },
  { id: 'image', label: '🖼️ 이미지' },
  { id: 'lesson', label: '📚 수업' },
  { id: 'assessment', label: '📝 평가' },
  { id: 'admin', label: '🏫 행정' },
  { id: 'class', label: '👥 학급' },
  { id: 'ib', label: '🎓 IB' },
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

function getTemplateCategory(template) {
  if (template.type === 'ib') return 'ib'
  return TEMPLATE_CATEGORY_MAP[template.name]
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
  'IB MYP 유닛 플랜 프롬프트': '🎓',
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
  const [currentEvents, setCurrentEvents] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [copiedId, setCopiedId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showBanner, setShowBanner] = useState(() => !isBannerHidden())
  const [showGuideModal, setShowGuideModal] = useState(false)

  useEffect(() => {
    getAllTemplates().then(setTemplates)
  }, [])

  useEffect(() => {
    getCurrentEvents().then(setCurrentEvents)
    getUpcomingEvents().then(setUpcomingEvents)
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

  const handleGoToRecommendedTemplate = (templateName) => {
    const path = templateName === IMAGE_TEMPLATE_NAME ? '/prompt/image' : '/prompt/document'
    navigate(path, { state: { templateName } })
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
    : templates.filter((template) => getTemplateCategory(template) === selectedCategory)

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
      <header className="flex items-center justify-between border-b-2 border-mint-500 bg-white px-4 py-3 shadow-md dark:bg-[#1e293b] sm:px-6">
        <span className="text-lg font-bold text-mint-700 dark:text-white">말해드림</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-mint-700 dark:text-navy-100">{user.nickname}님</span>
          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="rounded-lg border border-mint-600 px-3 py-1.5 text-sm text-mint-700 transition hover:bg-mint-50 dark:border-white/30 dark:text-white dark:hover:bg-white/10"
          >
            ❓ 도움말
          </button>
          <Link
            to="/mypage"
            className="rounded-lg border border-mint-600 px-3 py-1.5 text-sm text-mint-700 transition hover:bg-mint-50 dark:border-white/30 dark:text-white dark:hover:bg-white/10"
          >
            내 보관함
          </Link>
          <Link
            to="/library"
            className="rounded-lg border border-mint-600 px-3 py-1.5 text-sm text-mint-700 transition hover:bg-mint-50 dark:border-white/30 dark:text-white dark:hover:bg-white/10"
          >
            📚 라이브러리
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-mint-600 px-3 py-1.5 text-sm text-mint-700 transition hover:bg-mint-50 dark:border-white/30 dark:text-white dark:hover:bg-white/10"
          >
            로그아웃
          </button>
          <DarkModeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {showBanner && (
          <div className="mb-5 rounded-2xl border border-mint-200 bg-mint-50 p-5 dark:border-mint-800/40 dark:bg-slate-800">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-800 dark:text-white">
                👋 말해드림에 오신 걸 환영해요!
              </h2>
              <button
                type="button"
                onClick={() => setShowBanner(false)}
                aria-label="안내 닫기"
                className="shrink-0 rounded-lg px-2 py-1 text-sm text-slate-400 transition hover:bg-mint-100 dark:text-slate-500 dark:hover:bg-slate-700"
              >
                ✕
              </button>
            </div>

            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              키워드 몇 가지만 선택하면 AI용 프롬프트를 자동으로 만들어드려요.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[
                {
                  label: '📨 가정통신문',
                  preview: '"가을 소풍 안내문, 격식체, A4 1장 분량으로 작성해줘"',
                },
                {
                  label: '🖼️ 이미지 생성',
                  preview: '"중학교 교실, 따뜻한 햇살, 수채화 스타일, 학생들이 토론하는 장면"',
                },
                {
                  label: '📚 수업 지도안',
                  preview: '"정보 교과 1학년, 피지컬 컴퓨팅 단원, 45분, 모둠 활동 포함"',
                },
              ].map((ex) => (
                <div
                  key={ex.label}
                  className="rounded-xl border border-mint-200 bg-white px-4 py-3 dark:border-slate-600 dark:bg-slate-700/60"
                >
                  <p className="text-xs font-semibold text-mint-700 dark:text-mint-300">{ex.label}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 italic">{ex.preview}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <ol className="flex flex-col gap-1 text-xs text-slate-600 dark:text-slate-400 sm:flex-row sm:gap-4">
                {GUIDE_STEPS.map((step, index) => (
                  <li key={step} className="flex items-center gap-1">
                    <span className="font-semibold text-mint-600 dark:text-mint-400">{CIRCLED_NUMBERS[index]}</span>
                    {step}
                  </li>
                ))}
              </ol>
              <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                {[
                  { label: '오늘 하루 보지 않기', days: 1 },
                  { label: '일주일 보지 않기', days: 7 },
                  { label: '다시 보지 않기', days: Infinity },
                ].map(({ label, days }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      hideBanner(days)
                      setShowBanner(false)
                    }}
                    className="underline underline-offset-2 transition hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
          어떤 프롬프트가 필요하신가요?
        </h1>

        {(currentEvents.length > 0 || upcomingEvents.length > 0) && (
          <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950">
            <h2 className="text-base font-semibold text-slate-800 dark:text-white">
              📅 이번 주 추천
            </h2>
            <div className="mt-3 flex flex-col gap-3">
              {[
                ...currentEvents.map((event) => ({ ...event, isCurrent: true })),
                ...upcomingEvents.map((event) => ({ ...event, isCurrent: false })),
              ].map((event) => (
                <div
                  key={event.id}
                  className="rounded-xl border border-amber-200 bg-white p-4 dark:border-amber-800/60 dark:bg-slate-800"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {event.isCurrent ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600 dark:bg-red-500/20 dark:text-red-400">
                        🔴 진행 중
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                        D-{event.daysUntilStart}
                      </span>
                    )}
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
                      {event.title}
                    </h3>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {event.description}
                  </p>
                  {(event.templates ?? []).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {event.templates.map((templateName) => (
                        <button
                          key={templateName}
                          type="button"
                          onClick={() => handleGoToRecommendedTemplate(templateName)}
                          className="rounded-full border border-mint-300 bg-mint-50 px-2.5 py-1 text-xs font-medium text-mint-700 transition hover:bg-mint-100 dark:border-mint-500/40 dark:bg-mint-500/10 dark:text-mint-300 dark:hover:bg-mint-500/20"
                        >
                          {templateName}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="relative mt-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="어떤 프롬프트가 필요하세요? (예: 가정통신문, 이미지)"
            className="w-full rounded-lg border border-slate-200 py-2.5 pl-3 pr-10 text-sm text-slate-900 transition focus:border-mint-600 focus:outline-none focus:ring-2 focus:ring-mint-600/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
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
                    ? 'bg-mint-600 text-white'
                    : 'border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {selectedCategory === 'ib' && (
          <div className="mt-4 rounded-2xl border border-mint-100 bg-mint-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <p>
              🎓 IB MYP 단원 계획서(Unit Plan) 작성을 도와드려요. 교과군, 개념, 세계적 맥락을 선택하면
              ChatGPT·Claude·Gemini에 붙여넣을 프롬프트를 생성해드립니다.
            </p>
            <Link
              to="/ib-projects"
              className="mt-3 inline-block rounded-lg border border-mint-600 px-3 py-1.5 text-sm font-medium text-mint-700 transition hover:bg-mint-50 dark:border-white/30 dark:text-white dark:hover:bg-white/10"
            >
              📁 내 프로젝트 보기
            </Link>
          </div>
        )}

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
                  to={template.type === 'ib' ? '/ib-projects' : `/prompt/${template.type}`}
                  state={{ templateName: template.name }}
                  className="relative flex h-full min-h-[9.5rem] flex-1 flex-col gap-1.5 rounded-2xl border border-slate-200 border-l-4 border-l-mint-600 bg-white p-5 shadow-md shadow-slate-200/60 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(45,201,168,0.15)] dark:border-slate-700 dark:border-l-mint-500 dark:bg-slate-800 dark:shadow-none dark:hover:shadow-[0_8px_25px_rgba(45,201,168,0.25)]"
                >
                  <span className="text-3xl">
                    {TEMPLATE_ICON_MAP[template.name] ?? DEFAULT_TEMPLATE_ICON}
                  </span>
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
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
              <h2 className="border-l-4 border-mint-500 pl-3 text-lg font-semibold text-slate-800 dark:text-white">
                최근에 만든 프롬프트
              </h2>
              <Link
                to="/mypage"
                className="text-sm text-mint-600 transition hover:text-mint-700 dark:text-mint-400 dark:hover:text-mint-300"
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
                      className="rounded-lg border border-mint-300 px-3 py-1 text-xs font-medium text-mint-700 transition hover:bg-mint-50 dark:border-mint-500/40 dark:text-mint-400 dark:hover:bg-mint-500/10"
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
