import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DarkModeToggle from '../components/DarkModeToggle'
import { useToast } from '../components/Toast'
import { db } from '../firebase'
import { useAuthGuard } from '../hooks/useAuthGuard'
import { hashPin } from '../utils/hash'
import {
  deletePrompt,
  getPromptsByNickname,
  toggleFavorite,
} from '../utils/prompts'

const TYPE_LABELS = {
  image: '이미지',
  document: '문서',
}

const TYPE_BADGE_STYLES = {
  image: 'bg-blue-100 text-blue-700',
  document: 'bg-green-100 text-green-700',
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
  const showToast = useToast()
  const [prompts, setPrompts] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [activeTagFilter, setActiveTagFilter] = useState('전체')

  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [pinSuccess, setPinSuccess] = useState('')
  const [changingPin, setChangingPin] = useState(false)

  const loadPrompts = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const list = await getPromptsByNickname(user.nickname, user.deviceId)
    setPrompts(list)
    setLoading(false)
  }, [user])

  useEffect(() => {
    loadPrompts()
  }, [loadPrompts])

  const handleCopy = async (item) => {
    try {
      await navigator.clipboard.writeText(item.content)
      setCopiedId(item.id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch {
      setCopiedId(null)
    }
  }

  const handleShare = async (item) => {
    const shareUrl = `https://malhaedream.vercel.app/shared/${item.id}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      showToast(
        '공유 링크가 복사됐습니다! 카카오톡이나 메신저로 공유해보세요.',
        'success',
      )
    } catch {
      showToast('공유 링크 복사에 실패했습니다. 직접 선택 후 복사해주세요.', 'error')
    }
  }

  const handleToggleFavorite = async (item) => {
    const nextValue = !item.isFavorite
    setPrompts((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, isFavorite: nextValue } : p)),
    )
    try {
      await toggleFavorite(item.id, nextValue)
    } catch {
      setPrompts((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, isFavorite: !nextValue } : p)),
      )
      showToast('즐겨찾기 변경 중 오류가 발생했습니다.', 'error')
    }
  }

  const handleDelete = async (item) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    try {
      await deletePrompt(item.id, {
        nickname: user.nickname,
        deviceId: user.deviceId,
      })
      loadPrompts()
    } catch {
      showToast('삭제 중 오류가 발생했습니다.', 'error')
    }
  }

  const handleChangePin = async (e) => {
    e.preventDefault()
    setPinError('')
    setPinSuccess('')

    if (!/^\d{4}$/.test(newPin) || !/^\d{4}$/.test(confirmPin)) {
      setPinError('PIN은 숫자 4자리여야 합니다.')
      return
    }

    if (newPin !== confirmPin) {
      setPinError('새 PIN이 일치하지 않습니다.')
      return
    }

    if (currentPin === newPin) {
      setPinError('현재 PIN과 동일합니다. 다른 PIN을 입력해주세요.')
      return
    }

    setChangingPin(true)
    try {
      const snapshot = await getDocs(
        query(collection(db, 'users'), where('nickname', '==', user.nickname)),
      )

      if (snapshot.empty) {
        setPinError('계정 정보를 찾을 수 없습니다.')
        return
      }

      const userDoc = snapshot.docs[0]
      const hashedCurrent = await hashPin(currentPin)

      if (userDoc.data().pin !== hashedCurrent) {
        setPinError('현재 PIN이 올바르지 않습니다.')
        return
      }

      const hashedNew = await hashPin(newPin)
      await updateDoc(doc(db, 'users', userDoc.id), { pin: hashedNew })

      setPinSuccess('PIN이 변경되었습니다.')
      setCurrentPin('')
      setNewPin('')
      setConfirmPin('')
    } catch {
      setPinError('PIN 변경 중 오류가 발생했습니다.')
    } finally {
      setChangingPin(false)
    }
  }

  if (!user) return null

  const sortedPrompts = [...prompts].sort((a, b) => {
    if (Boolean(a.isFavorite) !== Boolean(b.isFavorite)) {
      return a.isFavorite ? -1 : 1
    }
    return (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)
  })

  const availableTags = [
    ...new Set(sortedPrompts.flatMap((item) => item.tags ?? [])),
  ]

  const displayedPrompts = sortedPrompts
    .filter((item) => activeTab !== 'favorite' || item.isFavorite)
    .filter(
      (item) => activeTagFilter === '전체' || (item.tags ?? []).includes(activeTagFilter),
    )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="flex items-center justify-between bg-navy-700 px-4 py-3 shadow-md sm:px-6">
        <span className="text-lg font-bold text-white">내 프롬프트 보관함</span>
        <div className="flex items-center gap-2">
          <Link
            to="/home"
            className="rounded-lg border border-white/30 px-3 py-1.5 text-sm text-white transition hover:bg-white/10"
          >
            돌아가기
          </Link>
          <DarkModeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        {loading ? (
          <p className="py-12 text-center text-slate-400">불러오는 중...</p>
        ) : prompts.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-12">
            <p className="text-center text-slate-400">
              저장된 프롬프트가 없습니다. 프롬프트를 생성하고 저장해보세요!
            </p>
            <Link
              to="/home"
              className="rounded-lg bg-navy-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-navy-600/20 transition hover:bg-navy-700 hover:shadow-lg dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              홈으로 가기
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-4 flex gap-2">
              {[
                { value: 'all', label: '전체' },
                { value: 'favorite', label: '즐겨찾기' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className={`rounded-lg border px-4 py-1.5 text-sm font-medium transition ${
                    activeTab === tab.value
                      ? 'border-navy-600 bg-navy-600 text-white dark:border-blue-500 dark:bg-blue-500'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-navy-300 hover:bg-navy-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {availableTags.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {['전체', ...availableTags].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setActiveTagFilter(tag)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                      activeTagFilter === tag
                        ? 'border-navy-600 bg-navy-600 text-white dark:border-blue-500 dark:bg-blue-500'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-navy-300 hover:bg-navy-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            {displayedPrompts.length === 0 ? (
              <p className="py-12 text-center text-slate-400">
                조건에 맞는 프롬프트가 없습니다.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {displayedPrompts.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md shadow-slate-200/60 transition hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleFavorite(item)}
                          aria-label="즐겨찾기"
                          className="text-lg leading-none"
                        >
                          {item.isFavorite ? (
                            <span className="text-amber-400">⭐</span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">☆</span>
                          )}
                        </button>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            TYPE_BADGE_STYLES[item.type] ?? 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {TYPE_LABELS[item.type] ?? item.type}
                        </span>
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

                    <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
                      {item.content.length > 50
                        ? `${item.content.slice(0, 50)}...`
                        : item.content}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(item)}
                        className="rounded-lg border border-navy-200 px-3 py-1 text-xs font-medium text-navy-700 transition hover:bg-navy-50 dark:border-blue-500/40 dark:text-blue-400 dark:hover:bg-blue-500/10"
                      >
                        {copiedId === item.id ? '복사됨!' : '복사'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleShare(item)}
                        className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        🔗 공유
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"
                      >
                        삭제
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-md shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-base font-semibold text-navy-800 dark:text-white">내 PIN 변경</h2>
          <form onSubmit={handleChangePin} className="mt-4 flex flex-col gap-3">
            <div>
              <label
                htmlFor="current-pin"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                현재 PIN
              </label>
              <input
                id="current-pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={currentPin}
                onChange={(e) =>
                  setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))
                }
                className="mt-1 w-full max-w-[160px] rounded-lg border border-slate-200 px-3 py-2 text-sm tracking-[0.3em] transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="new-pin"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                새 PIN
              </label>
              <input
                id="new-pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={newPin}
                onChange={(e) =>
                  setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))
                }
                className="mt-1 w-full max-w-[160px] rounded-lg border border-slate-200 px-3 py-2 text-sm tracking-[0.3em] transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-pin"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                새 PIN 확인
              </label>
              <input
                id="confirm-pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmPin}
                onChange={(e) =>
                  setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))
                }
                className="mt-1 w-full max-w-[160px] rounded-lg border border-slate-200 px-3 py-2 text-sm tracking-[0.3em] transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              />
            </div>

            {pinError && <p className="text-sm text-red-600 dark:text-red-400">{pinError}</p>}
            {pinSuccess && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">{pinSuccess}</p>
            )}

            <button
              type="submit"
              disabled={changingPin}
              className="rounded-lg bg-navy-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-navy-600/20 transition hover:bg-navy-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-600 sm:w-auto sm:self-start"
            >
              {changingPin ? '변경 중...' : 'PIN 변경'}
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}
