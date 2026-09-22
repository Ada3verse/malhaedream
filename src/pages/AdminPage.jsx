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
import {
  addTemplate,
  deleteTemplate,
  getAllTemplates,
  updateTemplate,
} from '../utils/templates'

const TEMPLATE_TYPE_LABELS = {
  document: '문서',
  image: '이미지',
}

const EMPTY_TEMPLATE_FORM = {
  type: 'document',
  name: '',
  description: '',
  promptTemplate: '',
  conditions: '',
  quickFixes: '',
}

export default function AdminPage() {
  const navigate = useNavigate()
  const user = useAuthGuard('admin')

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [newNickname, setNewNickname] = useState('')
  const [newPin, setNewPin] = useState('')
  const [addError, setAddError] = useState('')

  const [templates, setTemplates] = useState([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [editingTemplateId, setEditingTemplateId] = useState(null)
  const [templateForm, setTemplateForm] = useState(EMPTY_TEMPLATE_FORM)
  const [templateError, setTemplateError] = useState('')

  const loadUsers = useCallback(async () => {
    setLoading(true)
    const snapshot = await getDocs(collection(db, 'users'))
    setUsers(
      snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })),
    )
    setLoading(false)
  }, [])

  const loadTemplates = useCallback(async () => {
    setLoadingTemplates(true)
    setTemplates(await getAllTemplates())
    setLoadingTemplates(false)
  }, [])

  useEffect(() => {
    if (!user) return
    loadUsers()
    loadTemplates()
  }, [user, loadUsers, loadTemplates])

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

  const handleToggleTemplateActive = async (template) => {
    await updateTemplate(template.id, { isActive: !template.isActive })
    loadTemplates()
  }

  const handleDeleteTemplate = async (template) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    await deleteTemplate(template.id)
    if (editingTemplateId === template.id) {
      setEditingTemplateId(null)
      setTemplateForm(EMPTY_TEMPLATE_FORM)
    }
    loadTemplates()
  }

  const handleEditTemplateClick = (template) => {
    setEditingTemplateId(template.id)
    setTemplateForm({
      type: template.type,
      name: template.name,
      description: template.description ?? '',
      promptTemplate: template.promptTemplate ?? '',
      conditions: (template.conditions ?? []).join('\n'),
      quickFixes: (template.quickFixes ?? []).join(', '),
    })
    setTemplateError('')
  }

  const handleCancelTemplateEdit = () => {
    setEditingTemplateId(null)
    setTemplateForm(EMPTY_TEMPLATE_FORM)
    setTemplateError('')
  }

  const handleTemplateSubmit = async (e) => {
    e.preventDefault()
    setTemplateError('')

    if (!templateForm.name.trim() || !templateForm.promptTemplate.trim()) {
      setTemplateError('템플릿명과 프롬프트 템플릿은 필수입니다.')
      return
    }

    const data = {
      type: templateForm.type,
      name: templateForm.name.trim(),
      description: templateForm.description.trim(),
      promptTemplate: templateForm.promptTemplate,
      conditions: templateForm.conditions
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
      quickFixes: templateForm.quickFixes
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    }

    if (editingTemplateId) {
      await updateTemplate(editingTemplateId, data)
    } else {
      const nextOrder =
        templates.length > 0
          ? Math.max(...templates.map((item) => item.order ?? 0)) + 1
          : 1
      await addTemplate({ ...data, isActive: true, order: nextOrder })
    }

    setEditingTemplateId(null)
    setTemplateForm(EMPTY_TEMPLATE_FORM)
    loadTemplates()
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

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md shadow-slate-200/60">
          <h2 className="text-base font-semibold text-navy-800">템플릿 관리</h2>

          <div className="mt-4 flex flex-col gap-3">
            {loadingTemplates ? (
              <p className="text-sm text-slate-400">불러오는 중...</p>
            ) : templates.length === 0 ? (
              <p className="text-sm text-slate-400">등록된 템플릿이 없습니다.</p>
            ) : (
              templates.map((template) => (
                <div
                  key={template.id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 rounded-full bg-navy-50 px-2 py-0.5 text-xs font-medium text-navy-700">
                      {TEMPLATE_TYPE_LABELS[template.type] ?? template.type}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {template.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {template.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleTemplateActive(template)}
                      className={`rounded-lg border px-3 py-1 text-xs font-medium transition ${
                        template.isActive
                          ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                          : 'border-slate-300 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {template.isActive ? '활성' : '비활성'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditTemplateClick(template)}
                      className="rounded-lg border border-navy-200 px-3 py-1 text-xs font-medium text-navy-700 transition hover:bg-navy-50"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTemplate(template)}
                      className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <form
            onSubmit={handleTemplateSubmit}
            className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5"
          >
            <h3 className="text-sm font-semibold text-navy-800">
              {editingTemplateId ? '템플릿 수정' : '템플릿 추가'}
            </h3>

            <div className="flex flex-wrap gap-2">
              {['document', 'image'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTemplateForm((prev) => ({ ...prev, type }))}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                    templateForm.type === type
                      ? 'border-navy-600 bg-navy-600 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-navy-300 hover:bg-navy-50'
                  }`}
                >
                  {TEMPLATE_TYPE_LABELS[type]}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={templateForm.name}
              onChange={(e) =>
                setTemplateForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="템플릿명 (예: 가정통신문)"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20"
            />

            <input
              type="text"
              value={templateForm.description}
              onChange={(e) =>
                setTemplateForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="설명 (예: 학부모에게 보내는 각종 안내문)"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20"
            />

            <div>
              <textarea
                value={templateForm.promptTemplate}
                onChange={(e) =>
                  setTemplateForm((prev) => ({
                    ...prev,
                    promptTemplate: e.target.value,
                  }))
                }
                rows={5}
                placeholder="프롬프트 템플릿"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20"
              />
              <p className="mt-1 text-xs text-slate-400">
                사용 가능한 변수: {'{{name}}'} {'{{content}}'} {'{{tones}}'}{' '}
                {'{{formats}}'} {'{{conditions}}'}
              </p>
            </div>

            <textarea
              value={templateForm.conditions}
              onChange={(e) =>
                setTemplateForm((prev) => ({ ...prev, conditions: e.target.value }))
              }
              rows={3}
              placeholder={'조건 (줄바꿈으로 구분)\n예: 학부모가 읽기 쉽게 작성'}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20"
            />

            <input
              type="text"
              value={templateForm.quickFixes}
              onChange={(e) =>
                setTemplateForm((prev) => ({ ...prev, quickFixes: e.target.value }))
              }
              placeholder="빠른 수정 버튼 목록 (쉼표로 구분, 예: 더 구체적으로, 더 간결하게)"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20"
            />

            {templateError && (
              <p className="text-sm text-red-600">{templateError}</p>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-lg bg-navy-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-navy-600/20 transition hover:bg-navy-700 hover:shadow-lg"
              >
                {editingTemplateId ? '저장' : '추가'}
              </button>
              {editingTemplateId && (
                <button
                  type="button"
                  onClick={handleCancelTemplateEdit}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  취소
                </button>
              )}
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}
