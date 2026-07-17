import { collection, getDocs, query, where } from 'firebase/firestore'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../firebase'
import { setStoredUser } from '../utils/auth'

export default function LoginPage() {
  const [nickname, setNickname] = useState('')
  const [pin, setPin] = useState('')
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
      const q = query(
        usersRef,
        where('nickname', '==', nickname),
        where('pin', '==', pin),
      )
      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        setError('닉네임 또는 PIN이 올바르지 않습니다.')
        return
      }

      const user = snapshot.docs[0].data()
      setStoredUser({ nickname: user.nickname, role: user.role })
      navigate(user.role === 'admin' ? '/admin' : '/home')
    } catch {
      setError('닉네임 또는 PIN이 올바르지 않습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-center text-2xl font-bold text-gray-900">
          말해드림
        </h1>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <div>
            <label
              htmlFor="nickname"
              className="block text-sm font-medium text-gray-700"
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
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
          </div>

          <div>
            <label
              htmlFor="pin"
              className="block text-sm font-medium text-gray-700"
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
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base tracking-[0.5em] focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}
