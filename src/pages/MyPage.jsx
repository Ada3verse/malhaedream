import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthGuard } from '../hooks/useAuthGuard'
import { deletePrompt, getPromptsByNickname } from '../utils/prompts'

const TYPE_LABELS = {
  image: '이미지',
  document: '문서',
}

const TYPE_BADGE_STYLES = {
  image: 'bg-purple-100 text-purple-700',
  document: 'bg-blue-100 text-blue-700',
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

export default function MyPage() {
  const user = useAuthGuard()
  const [prompts, setPrompts] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState(null)

  const loadPrompts = async (nickname) => {
    setLoading(true)
    const list = await getPromptsByNickname(nickname)
    setPrompts(list)
    setLoading(false)
  }

  useEffect(() => {
    if (!user) return
    loadPrompts(user.nickname)
  }, [user])

  const handleCopy = async (item) => {
    try {
      await navigator.clipboard.writeText(item.content)
      setCopiedId(item.id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch {
      setCopiedId(null)
    }
  }

  const handleDelete = async (item) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    await deletePrompt(item.id)
    loadPrompts(user.nickname)
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
        <span className="text-lg font-bold text-gray-900">내 프롬프트 보관함</span>
        <Link
          to="/home"
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        >
          돌아가기
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        {loading ? (
          <p className="py-12 text-center text-gray-400">불러오는 중...</p>
        ) : prompts.length === 0 ? (
          <p className="py-12 text-center text-gray-400">
            저장된 프롬프트가 없습니다.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {prompts.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      TYPE_BADGE_STYLES[item.type] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {TYPE_LABELS[item.type] ?? item.type}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDate(item.createdAt)}
                  </span>
                </div>

                <p className="mt-2 text-sm text-gray-700">
                  {item.content.length > 50
                    ? `${item.content.slice(0, 50)}...`
                    : item.content}
                </p>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(item)}
                    className="rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-100"
                  >
                    {copiedId === item.id ? '복사됨!' : '복사'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="rounded-md border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
