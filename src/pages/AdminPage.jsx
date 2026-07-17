import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from 'firebase/firestore'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../firebase'
import { useAuthGuard } from '../hooks/useAuthGuard'
import { clearStoredUser } from '../utils/auth'

export default function AdminPage() {
  const navigate = useNavigate()
  const user = useAuthGuard('admin')

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [newNickname, setNewNickname] = useState('')
  const [newPin, setNewPin] = useState('')
  const [addError, setAddError] = useState('')

  const loadUsers = useCallback(async () => {
    setLoading(true)
    const snapshot = await getDocs(collection(db, 'users'))
    setUsers(
      snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })),
    )
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!user) return
    loadUsers()
  }, [user, loadUsers])

  const handleLogout = () => {
    clearStoredUser()
    navigate('/', { replace: true })
  }

  const handleResetPin = async (targetUser) => {
    await updateDoc(doc(db, 'users', targetUser.id), { pin: '0000' })
    alert('PIN이 0000으로 초기화되었습니다.')
    loadUsers()
  }

  const handleDelete = async (targetUser) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    await deleteDoc(doc(db, 'users', targetUser.id))
    loadUsers()
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    setAddError('')

    if (!newNickname.trim() || newPin.length !== 4) {
      setAddError('닉네임과 PIN 4자리를 입력해주세요.')
      return
    }

    await addDoc(collection(db, 'users'), {
      nickname: newNickname.trim(),
      pin: newPin,
      role: 'teacher',
    })
    setNewNickname('')
    setNewPin('')
    loadUsers()
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
        <span className="text-lg font-bold text-gray-900">말해드림 관리자</span>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        >
          로그아웃
        </button>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-8 sm:px-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">통계</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">전체 가입자 수</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {users.length}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">교사 계정 추가</h2>
          <form
            onSubmit={handleAddUser}
            className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <label
                htmlFor="new-nickname"
                className="block text-sm font-medium text-gray-700"
              >
                닉네임
              </label>
              <input
                id="new-nickname"
                type="text"
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
            </div>
            <div className="sm:w-32">
              <label
                htmlFor="new-pin"
                className="block text-sm font-medium text-gray-700"
              >
                PIN
              </label>
              <input
                id="new-pin"
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={newPin}
                onChange={(e) =>
                  setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm tracking-[0.3em] focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              추가
            </button>
          </form>
          {addError && <p className="mt-2 text-sm text-red-600">{addError}</p>}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">교사 계정 목록</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="py-2 pr-4 font-medium">닉네임</th>
                  <th className="py-2 pr-4 font-medium">역할</th>
                  <th className="py-2 pr-4 font-medium">PIN 초기화</th>
                  <th className="py-2 pr-4 font-medium">계정 삭제</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-400">
                      불러오는 중...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-400">
                      등록된 사용자가 없습니다.
                    </td>
                  </tr>
                ) : (
                  users.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-2 pr-4 text-gray-900">{item.nickname}</td>
                      <td className="py-2 pr-4 text-gray-600">{item.role}</td>
                      <td className="py-2 pr-4">
                        <button
                          type="button"
                          onClick={() => handleResetPin(item)}
                          className="rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-100"
                        >
                          PIN 초기화
                        </button>
                      </td>
                      <td className="py-2 pr-4">
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          disabled={item.role === 'admin'}
                          className="rounded-md border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}
