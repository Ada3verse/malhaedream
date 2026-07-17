import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PrivacyPolicyModal from '../components/PrivacyPolicyModal'
import { db } from '../firebase'
import { setStoredUser } from '../utils/auth'
import { hashPin } from '../utils/hash'

const MAX_LOGIN_FAILS = 5

export default function LoginPage() {
  const [nickname, setNickname] = useState('')
  const [pin, setPin] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [showPolicy, setShowPolicy] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handlePinChange = (e) => {
    setPin(e.target.value.replace(/\D/g, '').slice(0, 4))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const usersRef = collection(db, 'users')
      const snapshot = await getDocs(
        query(usersRef, where('nickname', '==', nickname)),
      )
      const hashedPin = await hashPin(pin)

      if (snapshot.empty) {
        await addDoc(usersRef, {
          nickname,
          pin: hashedPin,
          role: 'teacher',
          loginFailCount: 0,
        })
        setStoredUser({ nickname, role: 'teacher' })
        navigate('/home')
        return
      }

      const userDoc = snapshot.docs[0]
      const user = userDoc.data()
      const failCount = user.loginFailCount ?? 0

      if (failCount > MAX_LOGIN_FAILS) {
        setError('로그인 시도 횟수를 초과했습니다. 관리자에게 문의해주세요.')
        return
      }

      if (user.pin !== hashedPin) {
        const nextFailCount = failCount + 1
        await updateDoc(doc(db, 'users', userDoc.id), {
          loginFailCount: nextFailCount,
        })
        setError(
          nextFailCount > MAX_LOGIN_FAILS
            ? '로그인 시도 횟수를 초과했습니다. 관리자에게 문의해주세요.'
            : `PIN이 올바르지 않습니다. (${nextFailCount}/${MAX_LOGIN_FAILS}회 실패)`,
        )
        return
      }

      if (failCount > 0) {
        await updateDoc(doc(db, 'users', userDoc.id), { loginFailCount: 0 })
      }

      setStoredUser({ nickname: user.nickname, role: user.role })
      navigate(user.role === 'admin' ? '/admin' : '/home')
    } catch {
      setError('로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-600 text-2xl shadow-lg shadow-navy-600/30">
            💬
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-navy-700">
            말해드림
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            AI에게 대신 말해드립니다. 복사만 하세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <div>
            <label
              htmlFor="nickname"
              className="block text-sm font-medium text-slate-700"
            >
              닉네임
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임을 입력하세요"
              autoComplete="username"
              required
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-base transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20"
            />
          </div>

          <div>
            <label
              htmlFor="pin"
              className="block text-sm font-medium text-slate-700"
            >
              PIN
            </label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pin}
              onChange={handlePinChange}
              placeholder="숫자 4자리"
              autoComplete="off"
              required
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-base transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20"
            />
            <p className="mt-1.5 text-xs text-slate-400">
              처음 사용하시나요? 닉네임과 PIN을 입력하면 자동으로 가입됩니다.
            </p>
          </div>

          <label className="flex items-start gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-navy-600 focus:ring-2 focus:ring-navy-600/30"
            />
            <span>
              개인정보처리방침에 동의합니다{' '}
              <button
                type="button"
                onClick={() => setShowPolicy(true)}
                className="text-navy-600 underline underline-offset-2 hover:text-navy-700"
              >
                [내용 보기]
              </button>
            </span>
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !agreed}
            className="mt-2 w-full rounded-lg bg-navy-600 py-2.5 text-sm font-medium text-white shadow-md shadow-navy-600/20 transition hover:bg-navy-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>

      {showPolicy && (
        <PrivacyPolicyModal onClose={() => setShowPolicy(false)} />
      )}
    </div>
  )
}
