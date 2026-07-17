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
import { hashPin } from '../utils/hash'

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
    const hashedPin = await hashPin('0000')
    await updateDoc(doc(db, 'users', targetUser.id), { pin: hashedPin })
    alert('PIN이 0000으로 초기화되었습니다.')
    loadUsers()
  }

  const handleUnlock = async (targetUser) => {
    await updateDoc(doc(db, 'users', targetUser.id), { loginFailCount: 0 })
    alert('로그인 잠금이 해제되었습니다.')
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

    const hashedPin = await hashPin(newPin)
    await addDoc(collection(db, 'users'), {
      nickname: newNickname.trim(),
      pin: hashedPin,
      role: 'teacher',
      loginFailCount: 0,
    })
    setNewNickname('')
    setNewPin('')
    loadUsers()
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between bg-navy-700 px-4 py-3 shadow-md sm:px-6">
        <span className="text-lg font-bold text-white">말해드림 관리자</span>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-white/30 px-3 py-1.5 text-sm text-white transition hover:bg-white/10"
        >
          로그아웃
        </button>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-8 sm:px-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md shadow-slate-200/60">
          <h2 className="text-base font-semibold text-navy-800">통계</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-sky-50 p-4">
              <p className="text-xs text-sky-700">전체 가입자 수</p>
              <p className="mt-1 text-2xl font-semibold text-navy-800">
                {users.length}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md shadow-slate-200/60">
          <h2 className="text-base font-semibold text-navy-800">교사 계정 추가</h2>
          <form
            onSubmit={handleAddUser}
            className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <label
                htmlFor="new-nickname"
                className="block text-sm font-medium text-slate-700"
              >
                닉네임
              </label>
              <input
                id="new-nickname"
                type="text"
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20"
              />
            </div>
            <div className="sm:w-32">
              <label
                htmlFor="new-pin"
                className="block text-sm font-medium text-slate-700"
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
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tracking-[0.3em] transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-navy-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-navy-600/20 transition hover:bg-navy-700 hover:shadow-lg"
            >
              추가
            </button>
          </form>
          {addError && <p className="mt-2 text-sm text-red-600">{addError}</p>}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md shadow-slate-200/60">
          <h2 className="text-base font-semibold text-navy-800">교사 계정 목록</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="bg-navy-50 text-navy-700">
                  <th className="rounded-l-lg py-2.5 pl-3 pr-4 font-medium">
                    닉네임
                  </th>
                  <th className="py-2.5 pr-4 font-medium">역할</th>
                  <th className="py-2.5 pr-4 font-medium">실패 횟수</th>
                  <th className="py-2.5 pr-4 font-medium">PIN 초기화</th>
                  <th className="py-2.5 pr-4 font-medium">잠금 해제</th>
                  <th className="rounded-r-lg py-2.5 pr-4 font-medium">
                    계정 삭제
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      불러오는 중...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      등록된 사용자가 없습니다.
                    </td>
                  </tr>
                ) : (
                  users.map((item, index) => (
                    <tr
                      key={item.id}
                      className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                    >
                      <td className="py-2.5 pl-3 pr-4 text-slate-900">
                        {item.nickname}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-600">{item.role}</td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={
                            (item.loginFailCount ?? 0) > 5
                              ? 'font-semibold text-red-600'
                              : 'text-slate-600'
                          }
                        >
                          {item.loginFailCount ?? 0}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <button
                          type="button"
                          onClick={() => handleResetPin(item)}
                          className="rounded-lg border border-amber-300 px-3 py-1 text-xs font-medium text-amber-700 transition hover:bg-amber-50"
                        >
                          PIN 초기화
                        </button>
                      </td>
                      <td className="py-2.5 pr-4">
                        <button
                          type="button"
                          onClick={() => handleUnlock(item)}
                          disabled={(item.loginFailCount ?? 0) === 0}
                          className="rounded-lg border border-sky-300 px-3 py-1 text-xs font-medium text-sky-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          잠금 해제
                        </button>
                      </td>
                      <td className="py-2.5 pr-4">
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          disabled={item.role === 'admin'}
                          className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
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
