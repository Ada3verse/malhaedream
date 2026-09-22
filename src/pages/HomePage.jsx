import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CIRCLED_NUMBERS, GUIDE_STEPS } from '../constants/guide'
import { useAuthGuard } from '../hooks/useAuthGuard'
import { clearStoredUser } from '../utils/auth'
import { getAllTemplates, updateTemplate } from '../utils/templates'
import UsageGuideModal from '../components/UsageGuideModal'

const GUIDE_SEEN_KEY = 'malhaedream_guide_seen'

export default function HomePage() {
  const navigate = useNavigate()
  const user = useAuthGuard()
  const [templates, setTemplates] = useState([])
  const [showBanner, setShowBanner] = useState(
    () => !localStorage.getItem(GUIDE_SEEN_KEY),
  )
  const [showGuideModal, setShowGuideModal] = useState(false)

  useEffect(() => {
    getAllTemplates().then(setTemplates)
  }, [])

  const handleLogout = () => {
    clearStoredUser()
    navigate('/', { replace: true })
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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between bg-navy-700 px-4 py-3 shadow-md sm:px-6">
        <span className="text-lg font-bold text-white">말해드림</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-navy-100">{user.nickname}님</span>
          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="rounded-lg border border-white/30 px-3 py-1.5 text-sm text-white transition hover:bg-white/10"
          >
            ❓ 도움말
          </button>
          <Link
            to="/mypage"
            className="rounded-lg border border-white/30 px-3 py-1.5 text-sm text-white transition hover:bg-white/10"
          >
            내 보관함
          </Link>
          <Link
            to="/library"
            className="rounded-lg border border-white/30 px-3 py-1.5 text-sm text-white transition hover:bg-white/10"
          >
            📚 라이브러리
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
        {showBanner && (
          <div className="mb-5 rounded-2xl border border-navy-200 bg-navy-50 p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base font-semibold text-navy-800">
                💡 말해드림 사용법
              </h2>
              <button
                type="button"
                onClick={handleDismissBanner}
                aria-label="안내 닫기"
                className="rounded-lg px-2 py-1 text-sm text-navy-500 transition hover:bg-navy-100"
              >
                ✕
              </button>
            </div>
            <ol className="mt-3 flex flex-col gap-1.5 text-sm text-navy-700">
              {GUIDE_STEPS.map((step, index) => (
                <li key={step}>
                  {CIRCLED_NUMBERS[index]} {step}
                </li>
              ))}
            </ol>
          </div>
        )}

        <h1 className="text-2xl font-bold text-navy-800">
          어떤 프롬프트가 필요하신가요?
        </h1>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {templates.map((template, index) => (
            <div key={template.id} className="flex items-stretch gap-2">
              {isAdmin && (
                <div className="flex flex-col justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMoveTemplate(index, 'up')}
                    disabled={index === 0}
                    aria-label="위로 이동"
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveTemplate(index, 'down')}
                    disabled={index === templates.length - 1}
                    aria-label="아래로 이동"
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ↓
                  </button>
                </div>
              )}

              {template.isActive ? (
                <Link
                  to={`/prompt/${template.type}`}
                  className="flex h-full flex-1 flex-col gap-1.5 rounded-2xl border border-slate-200 bg-white p-5 shadow-md shadow-slate-200/60 transition-all duration-200 hover:-translate-y-1 hover:border-navy-200 hover:shadow-xl hover:shadow-slate-200/80"
                >
                  <h2 className="text-lg font-semibold text-navy-800">
                    {template.name}
                  </h2>
                  <p className="text-sm text-slate-500">{template.description}</p>
                </Link>
              ) : (
                <div
                  aria-disabled="true"
                  className="relative flex h-full flex-1 cursor-not-allowed flex-col gap-1.5 rounded-2xl border border-slate-200 bg-slate-100 p-5"
                >
                  <span className="absolute right-4 top-4 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-500">
                    준비중
                  </span>
                  <h2 className="text-lg font-semibold text-slate-500">
                    {template.name}
                  </h2>
                  <p className="text-sm text-slate-400">{template.description}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {showGuideModal && (
        <UsageGuideModal onClose={() => setShowGuideModal(false)} />
      )}
    </div>
  )
}
