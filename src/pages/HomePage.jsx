import { Link, useNavigate } from 'react-router-dom'
import { clearStoredUser } from '../utils/auth'
import { useAuthGuard } from '../hooks/useAuthGuard'

const templates = [
  {
    title: '이미지 생성 프롬프트',
    description: '수업에 활용할 이미지를 만드는 프롬프트를 생성해요.',
    icon: '🖼️',
    path: '/prompt/image',
    active: true,
  },
  {
    title: '문서 작성 프롬프트',
    description: '가정통신문, 안내문 등 문서 작성을 도와줘요.',
    icon: '📝',
    path: '/prompt/document',
    active: true,
  },
  {
    title: '수업 자료 제작 프롬프트',
    description: '학습지, 활동지 제작을 도와줘요.',
    icon: '📚',
    path: '/prompt/lesson-material',
    active: false,
  },
  {
    title: '평가 문항 제작 프롬프트',
    description: '형성평가, 수행평가 문항을 만들어줘요.',
    icon: '📋',
    path: '/prompt/assessment',
    active: false,
  },
]

export default function HomePage() {
  const navigate = useNavigate()
  const user = useAuthGuard()

  const handleLogout = () => {
    clearStoredUser()
    navigate('/', { replace: true })
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
        <span className="text-lg font-bold text-gray-900">말해드림</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{user.nickname}님</span>
          <Link
            to="/mypage"
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
          >
            내 보관함
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
          >
            로그아웃
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="text-xl font-semibold text-gray-900">
          어떤 프롬프트가 필요하신가요?
        </h1>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {templates.map((template) =>
            template.active ? (
              <Link
                key={template.title}
                to={template.path}
                className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-gray-300 hover:shadow-md"
              >
                <span className="text-3xl">{template.icon}</span>
                <h2 className="text-base font-semibold text-gray-900">
                  {template.title}
                </h2>
                <p className="text-sm text-gray-500">{template.description}</p>
              </Link>
            ) : (
              <div
                key={template.title}
                aria-disabled="true"
                className="relative flex cursor-not-allowed flex-col gap-2 rounded-2xl border border-gray-200 bg-gray-100 p-5"
              >
                <span className="absolute right-4 top-4 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-500">
                  준비중
                </span>
                <span className="text-3xl grayscale">{template.icon}</span>
                <h2 className="text-base font-semibold text-gray-500">
                  {template.title}
                </h2>
                <p className="text-sm text-gray-400">{template.description}</p>
              </div>
            ),
          )}
        </div>
      </main>
    </div>
  )
}
