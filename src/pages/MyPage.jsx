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
import { db } from '../firebase'
import { useAuthGuard } from '../hooks/useAuthGuard'
import { hashPin } from '../utils/hash'
import { deletePrompt, getPromptsByNickname } from '../utils/prompts'

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
  const [prompts, setPrompts] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState(null)

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

  const handleDelete = async (item) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    try {
      await deletePrompt(item.id, {
        nickname: user.nickname,
        deviceId: user.deviceId,
      })
      loadPrompts()
    } catch {
      alert('삭제 권한이 없습니다.')
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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between bg-navy-700 px-4 py-3 shadow-md sm:px-6">
        <span className="text-lg font-bold text-white">내 프롬프트 보관함</span>
        <Link
          to="/home"
          className="rounded-lg border border-white/30 px-3 py-1.5 text-sm text-white transition hover:bg-white/10"
        >
          돌아가기
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        {loading ? (
          <p className="py-12 text-center text-slate-400">불러오는 중...</p>
        ) : prompts.length === 0 ? (
          <p className="py-12 text-center text-slate-400">
            저장된 프롬프트가 없습니다.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {prompts.map((item) => (
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
                    {TYPE_LABELS[item.type] ?? item.type}
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatDate(item.createdAt)}
                  </span>
                </div>

                <p className="mt-3 text-sm text-slate-700">
                  {item.content.length > 50
                    ? `${item.content.slice(0, 50)}...`
                    : item.content}
                </p>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(item)}
                    className="rounded-lg border border-navy-200 px-3 py-1 text-xs font-medium text-navy-700 transition hover:bg-navy-50"
                  >
                    {copiedId === item.id ? '복사됨!' : '복사'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                  >
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-md shadow-slate-200/60">
          <h2 className="text-base font-semibold text-navy-800">내 PIN 변경</h2>
          <form onSubmit={handleChangePin} className="mt-4 flex flex-col gap-3">
            <div>
              <label
                htmlFor="current-pin"
                className="block text-sm font-medium text-slate-700"
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
                className="mt-1 w-full max-w-[160px] rounded-lg border border-slate-200 px-3 py-2 text-sm tracking-[0.3em] transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20"
              />
            </div>

            <div>
              <label
                htmlFor="new-pin"
                className="block text-sm font-medium text-slate-700"
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
                className="mt-1 w-full max-w-[160px] rounded-lg border border-slate-200 px-3 py-2 text-sm tracking-[0.3em] transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-pin"
                className="block text-sm font-medium text-slate-700"
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
                className="mt-1 w-full max-w-[160px] rounded-lg border border-slate-200 px-3 py-2 text-sm tracking-[0.3em] transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20"
              />
            </div>

            {pinError && <p className="text-sm text-red-600">{pinError}</p>}
            {pinSuccess && (
              <p className="text-sm text-emerald-600">{pinSuccess}</p>
            )}

            <button
              type="submit"
              disabled={changingPin}
              className="rounded-lg bg-navy-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-navy-600/20 transition hover:bg-navy-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:self-start"
            >
              {changingPin ? '변경 중...' : 'PIN 변경'}
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}
