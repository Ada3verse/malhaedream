import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DarkModeToggle from '../components/DarkModeToggle'
import { useToast } from '../components/Toast'
import { db } from '../firebase'
import { useAuthGuard } from '../hooks/useAuthGuard'
import { clearStoredUser } from '../utils/auth'
import { hashPin } from '../utils/hash'
import { getAllPrompts, getSharedPrompts, unsharePrompt } from '../utils/prompts'
import {
  addTemplate,
  deleteTemplate,
  getAllTemplates,
  updateTemplate,
} from '../utils/templates'

const SHARED_PAGE_SIZE = 10
const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60

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

const TEMPLATE_TYPE_LABELS = {
  document: '문서',
  image: '이미지',
}

const TEMPLATE_TYPE_BADGE_STYLES = {
  document: 'bg-navy-50 text-navy-700 dark:bg-slate-700 dark:text-slate-200',
  image: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
}

const EMPTY_TEMPLATE_FORM = {
  type: 'document',
  name: '',
  description: '',
  promptTemplate: '',
  conditions: '',
  quickFixes: '',
}

const JSON_PLACEHOLDER = `아래 형식으로 JSON을 붙여넣으세요. 단일 객체 또는 배열 모두 가능합니다.

단일 템플릿:
{
  "type": "document",
  "name": "템플릿명",
  "description": "설명",
  "isActive": true,
  "order": 10,
  "promptTemplate": "프롬프트 내용 {{content}} {{tones}} {{formats}} {{conditions}}",
  "conditions": ["조건1", "조건2"],
  "quickFixes": ["빠른수정1", "빠른수정2"]
}

여러 템플릿 (배열):
[
  { ... },
  { ... }
]`

export default function AdminPage() {
  const navigate = useNavigate()
  const user = useAuthGuard('admin')
  const showToast = useToast()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [newNickname, setNewNickname] = useState('')
  const [newPin, setNewPin] = useState('')
  const [addError, setAddError] = useState('')

  const [newAdminPin, setNewAdminPin] = useState('')
  const [confirmAdminPin, setConfirmAdminPin] = useState('')
  const [adminPinError, setAdminPinError] = useState('')
  const [adminPinSuccess, setAdminPinSuccess] = useState('')
  const [changingAdminPin, setChangingAdminPin] = useState(false)

  const [templates, setTemplates] = useState([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [editingTemplateId, setEditingTemplateId] = useState(null)
  const [templateForm, setTemplateForm] = useState(EMPTY_TEMPLATE_FORM)
  const [templateError, setTemplateError] = useState('')

  const [addTab, setAddTab] = useState('form')
  const [jsonInput, setJsonInput] = useState('')
  const [jsonPreview, setJsonPreview] = useState(null)
  const [jsonError, setJsonError] = useState('')
  const [jsonSaveMessage, setJsonSaveMessage] = useState('')

  const [prompts, setPrompts] = useState([])
  const [loadingPrompts, setLoadingPrompts] = useState(true)

  const [sharedPrompts, setSharedPrompts] = useState([])
  const [loadingSharedPrompts, setLoadingSharedPrompts] = useState(true)
  const [visibleSharedCount, setVisibleSharedCount] = useState(SHARED_PAGE_SIZE)

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

  const loadPrompts = useCallback(async () => {
    setLoadingPrompts(true)
    setPrompts(await getAllPrompts())
    setLoadingPrompts(false)
  }, [])

  const loadSharedPrompts = useCallback(async () => {
    setLoadingSharedPrompts(true)
    setSharedPrompts(await getSharedPrompts())
    setLoadingSharedPrompts(false)
  }, [])

  useEffect(() => {
    if (!user) return
    loadUsers()
    loadTemplates()
    loadPrompts()
    loadSharedPrompts()
  }, [user, loadUsers, loadTemplates, loadPrompts, loadSharedPrompts])

  const handleLogout = () => {
    clearStoredUser()
    navigate('/', { replace: true })
  }

  const handleChangeAdminPin = async (e) => {
    e.preventDefault()
    setAdminPinError('')
    setAdminPinSuccess('')

    if (!/^\d{4}$/.test(newAdminPin) || !/^\d{4}$/.test(confirmAdminPin)) {
      setAdminPinError('PIN은 숫자 4자리여야 합니다.')
      return
    }

    if (newAdminPin !== confirmAdminPin) {
      setAdminPinError('PIN이 일치하지 않습니다.')
      return
    }

    setChangingAdminPin(true)
    try {
      const snapshot = await getDocs(
        query(collection(db, 'users'), where('nickname', '==', user.nickname)),
      )

      if (snapshot.empty) {
        setAdminPinError('계정 정보를 찾을 수 없습니다.')
        return
      }

      const hashedPin = await hashPin(newAdminPin)
      await updateDoc(doc(db, 'users', snapshot.docs[0].id), { pin: hashedPin })

      setAdminPinSuccess('관리자 PIN이 변경되었습니다.')
      setNewAdminPin('')
      setConfirmAdminPin('')
    } catch {
      setAdminPinError('PIN 변경 중 오류가 발생했습니다.')
    } finally {
      setChangingAdminPin(false)
    }
  }

  const handleResetPin = async (targetUser) => {
    const hashedPin = await hashPin('0000')
    await updateDoc(doc(db, 'users', targetUser.id), { pin: hashedPin })
    showToast('PIN이 0000으로 초기화되었습니다.', 'success')
    loadUsers()
  }

  const handleUnlock = async (targetUser) => {
    await updateDoc(doc(db, 'users', targetUser.id), { loginFailCount: 0 })
    showToast('로그인 잠금이 해제되었습니다.', 'success')
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
      const isDuplicate = templates.some((item) => item.name === data.name)
      if (isDuplicate) {
        setTemplateError(
          `'${data.name}'은 이미 존재하는 템플릿입니다. 다른 이름을 사용하거나 기존 템플릿을 수정해주세요.`,
        )
        return
      }

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

  const handleJsonPreview = () => {
    setJsonSaveMessage('')

    try {
      const parsed = JSON.parse(jsonInput)
      setJsonPreview(Array.isArray(parsed) ? parsed : [parsed])
      setJsonError('')
    } catch {
      setJsonPreview(null)
      setJsonError('JSON 형식이 올바르지 않습니다. 다시 확인해주세요.')
    }
  }

  const handleJsonSave = async () => {
    if (!jsonPreview || jsonPreview.length === 0) return

    const existingNames = new Set(templates.map((item) => item.name))

    let nextOrder =
      templates.length > 0
        ? Math.max(...templates.map((item) => item.order ?? 0)) + 1
        : 1

    let addedCount = 0
    let skippedCount = 0

    for (const item of jsonPreview) {
      const name = item.name ?? ''

      if (existingNames.has(name)) {
        skippedCount += 1
        continue
      }

      await addTemplate({
        type: item.type ?? 'document',
        name,
        description: item.description ?? '',
        promptTemplate: item.promptTemplate ?? '',
        conditions: Array.isArray(item.conditions) ? item.conditions : [],
        quickFixes: Array.isArray(item.quickFixes) ? item.quickFixes : [],
        isActive: item.isActive ?? true,
        order: item.order ?? nextOrder++,
      })

      existingNames.add(name)
      addedCount += 1
    }

    setJsonSaveMessage(
      skippedCount > 0
        ? `${addedCount}개 추가, ${skippedCount}개 중복으로 건너뜀`
        : `${addedCount}개 템플릿이 추가되었습니다.`,
    )
    setJsonInput('')
    setJsonPreview(null)
    loadTemplates()
  }

  const handleUnsharePrompt = async (item) => {
    if (!confirm('이 프롬프트를 라이브러리에서 삭제하시겠습니까?')) return
    await unsharePrompt(item.id)
    setSharedPrompts((prev) => prev.filter((p) => p.id !== item.id))
    showToast('라이브러리에서 삭제되었습니다.', 'success')
  }

  if (!user) return null

  const sevenDaysAgoSeconds = Math.floor(Date.now() / 1000) - SEVEN_DAYS_IN_SECONDS
  const recentPromptsCount = prompts.filter(
    (item) => (item.createdAt?.seconds ?? 0) >= sevenDaysAgoSeconds,
  ).length

  const templateUsageCounts = Object.entries(
    prompts.reduce((acc, item) => {
      const key = item.templateName ?? '기타'
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    }, {}),
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  const maxTemplateUsage = templateUsageCounts[0]?.count ?? 0

  const visibleSharedPrompts = sharedPrompts.slice(0, visibleSharedCount)
  const hasMoreShared = visibleSharedCount < sharedPrompts.length

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="flex items-center justify-between bg-navy-700 px-4 py-3 shadow-md sm:px-6">
        <span className="text-lg font-bold text-white">말해드림 관리자</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-white/30 px-3 py-1.5 text-sm text-white transition hover:bg-white/10"
          >
            로그아웃
          </button>
          <DarkModeToggle />
        </div>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-8 sm:px-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="border-l-4 border-violet-600 pl-3 text-base font-semibold text-navy-800 dark:text-white">통계</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-sky-50 p-4 dark:bg-slate-700">
              <p className="text-xs text-sky-700 dark:text-sky-300">전체 가입자 수</p>
              <p className="mt-1 text-2xl font-semibold text-navy-800 dark:text-white">
                {users.length}
              </p>
            </div>
            <div className="rounded-xl bg-sky-50 p-4 dark:bg-slate-700">
              <p className="text-xs text-sky-700 dark:text-sky-300">전체 저장된 프롬프트 수</p>
              <p className="mt-1 text-2xl font-semibold text-navy-800 dark:text-white">
                {loadingPrompts ? '-' : prompts.length}
              </p>
            </div>
            <div className="rounded-xl bg-sky-50 p-4 dark:bg-slate-700">
              <p className="text-xs text-sky-700 dark:text-sky-300">최근 7일간 생성된 프롬프트</p>
              <p className="mt-1 text-2xl font-semibold text-navy-800 dark:text-white">
                {loadingPrompts ? '-' : recentPromptsCount}
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-navy-800 dark:text-white">
              템플릿별 사용 횟수
            </h3>
            {loadingPrompts ? (
              <p className="mt-3 text-sm text-slate-400">불러오는 중...</p>
            ) : templateUsageCounts.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">
                아직 저장된 프롬프트가 없습니다.
              </p>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                {templateUsageCounts.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-3 text-sm"
                  >
                    <span className="w-28 shrink-0 truncate text-slate-700 dark:text-slate-300">
                      {item.name}
                    </span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                      <div
                        className="h-full rounded-full bg-violet-600 dark:bg-violet-500"
                        style={{
                          width: `${(item.count / maxTemplateUsage) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="w-10 shrink-0 text-right font-medium text-navy-800 dark:text-white">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="border-l-4 border-violet-600 pl-3 text-base font-semibold text-navy-800 dark:text-white">교사 계정 추가</h2>
          <form
            onSubmit={handleAddUser}
            className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <label
                htmlFor="new-nickname"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                닉네임
              </label>
              <input
                id="new-nickname"
                type="text"
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div className="sm:w-32">
              <label
                htmlFor="new-pin"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
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
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tracking-[0.3em] transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-br from-navy-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-navy-600/20 transition hover:shadow-lg hover:brightness-110 dark:bg-blue-500 dark:bg-none dark:hover:bg-blue-600"
            >
              추가
            </button>
          </form>
          {addError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{addError}</p>}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="border-l-4 border-violet-600 pl-3 text-base font-semibold text-navy-800 dark:text-white">관리자 PIN 변경</h2>
          <form
            onSubmit={handleChangeAdminPin}
            className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="sm:w-32">
              <label
                htmlFor="new-admin-pin"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                새 PIN
              </label>
              <input
                id="new-admin-pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={newAdminPin}
                onChange={(e) =>
                  setNewAdminPin(e.target.value.replace(/\D/g, '').slice(0, 4))
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tracking-[0.3em] transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div className="sm:w-32">
              <label
                htmlFor="confirm-admin-pin"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                새 PIN 확인
              </label>
              <input
                id="confirm-admin-pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmAdminPin}
                onChange={(e) =>
                  setConfirmAdminPin(e.target.value.replace(/\D/g, '').slice(0, 4))
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tracking-[0.3em] transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={changingAdminPin}
              className="rounded-lg bg-gradient-to-br from-navy-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-navy-600/20 transition hover:shadow-lg hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:bg-none dark:hover:bg-blue-600"
            >
              {changingAdminPin ? '변경 중...' : '변경'}
            </button>
          </form>
          {adminPinError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{adminPinError}</p>
          )}
          {adminPinSuccess && (
            <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">{adminPinSuccess}</p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="border-l-4 border-violet-600 pl-3 text-base font-semibold text-navy-800 dark:text-white">교사 계정 목록</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="bg-navy-50 text-navy-700 dark:bg-slate-700 dark:text-slate-200">
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
                      className={
                        index % 2 === 0
                          ? 'bg-white dark:bg-slate-800'
                          : 'bg-slate-50 dark:bg-slate-800/60'
                      }
                    >
                      <td className="py-2.5 pl-3 pr-4 text-slate-900 dark:text-white">
                        {item.nickname}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-300">{item.role}</td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={
                            (item.loginFailCount ?? 0) > 5
                              ? 'font-semibold text-red-600 dark:text-red-400'
                              : 'text-slate-600 dark:text-slate-300'
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

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="border-l-4 border-violet-600 pl-3 text-base font-semibold text-navy-800 dark:text-white">템플릿 관리</h2>

          <div className="mt-4 flex flex-col gap-3">
            {loadingTemplates ? (
              <p className="text-sm text-slate-400">불러오는 중...</p>
            ) : templates.length === 0 ? (
              <p className="text-sm text-slate-400">등록된 템플릿이 없습니다.</p>
            ) : (
              templates.map((template) => (
                <div
                  key={template.id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        TEMPLATE_TYPE_BADGE_STYLES[template.type] ?? 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {TEMPLATE_TYPE_LABELS[template.type] ?? template.type}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">
                        {template.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
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
                          ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10'
                          : 'border-slate-300 text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700'
                      }`}
                    >
                      {template.isActive ? '활성' : '비활성'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditTemplateClick(template)}
                      className="rounded-lg border border-violet-300 px-3 py-1 text-xs font-medium text-violet-700 transition hover:bg-violet-50 dark:border-violet-500/40 dark:text-violet-400 dark:hover:bg-violet-500/10"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTemplate(template)}
                      className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-navy-800 dark:text-white">
              {editingTemplateId ? '템플릿 수정' : '템플릿 추가'}
            </h3>

            {!editingTemplateId && (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setAddTab('form')}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                    addTab === 'form'
                      ? 'border-violet-600 bg-violet-600 text-white dark:border-violet-500 dark:bg-violet-500'
                      : 'border-slate-200 bg-slate-100 text-slate-700 hover:border-violet-300 hover:bg-violet-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  폼으로 추가
                </button>
                <button
                  type="button"
                  onClick={() => setAddTab('json')}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                    addTab === 'json'
                      ? 'border-violet-600 bg-violet-600 text-white dark:border-violet-500 dark:bg-violet-500'
                      : 'border-slate-200 bg-slate-100 text-slate-700 hover:border-violet-300 hover:bg-violet-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  JSON으로 추가
                </button>
              </div>
            )}

            {editingTemplateId || addTab === 'form' ? (
              <form
                onSubmit={handleTemplateSubmit}
                className="mt-4 flex flex-col gap-3"
              >
                <div className="flex flex-wrap gap-2">
                  {['document', 'image'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setTemplateForm((prev) => ({ ...prev, type }))}
                      className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                        templateForm.type === type
                          ? 'border-violet-600 bg-violet-600 text-white dark:border-violet-500 dark:bg-violet-500'
                          : 'border-slate-200 bg-slate-100 text-slate-700 hover:border-violet-300 hover:bg-violet-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
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
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                />

                <input
                  type="text"
                  value={templateForm.description}
                  onChange={(e) =>
                    setTemplateForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="설명 (예: 학부모에게 보내는 각종 안내문)"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
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
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  />
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    사용 가능한 변수: {'{{name}}'} {'{{content}}'} {'{{tones}}'}{' '}
                    {'{{formats}}'} {'{{conditions}}'}
                  </p>
                </div>

                <textarea
                  value={templateForm.conditions}
                  onChange={(e) =>
                    setTemplateForm((prev) => ({
                      ...prev,
                      conditions: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder={'조건 (줄바꿈으로 구분)\n예: 학부모가 읽기 쉽게 작성'}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                />

                <input
                  type="text"
                  value={templateForm.quickFixes}
                  onChange={(e) =>
                    setTemplateForm((prev) => ({
                      ...prev,
                      quickFixes: e.target.value,
                    }))
                  }
                  placeholder="빠른 수정 버튼 목록 (쉼표로 구분, 예: 더 구체적으로, 더 간결하게)"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                />

                {templateError && (
                  <p className="text-sm text-red-600 dark:text-red-400">{templateError}</p>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="rounded-lg bg-gradient-to-br from-navy-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-navy-600/20 transition hover:shadow-lg hover:brightness-110 dark:bg-blue-500 dark:bg-none dark:hover:bg-blue-600"
                  >
                    {editingTemplateId ? '저장' : '추가'}
                  </button>
                  {editingTemplateId && (
                    <button
                      type="button"
                      onClick={handleCancelTemplateEdit}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      취소
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                <textarea
                  value={jsonInput}
                  onChange={(e) => {
                    setJsonInput(e.target.value)
                    setJsonError('')
                    setJsonSaveMessage('')
                  }}
                  rows={10}
                  placeholder={JSON_PLACEHOLDER}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleJsonPreview}
                    className="rounded-lg border-2 border-violet-600 px-4 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-50 dark:border-violet-500 dark:text-violet-400 dark:hover:bg-violet-500/10"
                  >
                    JSON 파싱 미리보기
                  </button>
                  {jsonPreview && (
                    <button
                      type="button"
                      onClick={handleJsonSave}
                      className="rounded-lg bg-gradient-to-br from-navy-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-navy-600/20 transition hover:shadow-lg hover:brightness-110 dark:bg-blue-500 dark:bg-none dark:hover:bg-blue-600"
                    >
                      Firestore에 저장
                    </button>
                  )}
                </div>

                {jsonError && <p className="text-sm text-red-600 dark:text-red-400">{jsonError}</p>}
                {jsonSaveMessage && (
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">{jsonSaveMessage}</p>
                )}

                {jsonPreview && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      미리보기 ({jsonPreview.length}개)
                    </p>
                    {jsonPreview.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700"
                      >
                        <span
                          className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                            TEMPLATE_TYPE_BADGE_STYLES[item.type] ?? 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {TEMPLATE_TYPE_LABELS[item.type] ?? item.type ?? '문서'}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-white">
                            {item.name || '(이름 없음)'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="border-l-4 border-violet-600 pl-3 text-base font-semibold text-navy-800 dark:text-white">공유 라이브러리 관리</h2>

          <div className="mt-4 flex flex-col gap-3">
            {loadingSharedPrompts ? (
              <p className="text-sm text-slate-400">불러오는 중...</p>
            ) : sharedPrompts.length === 0 ? (
              <p className="text-sm text-slate-400">공유된 프롬프트가 없습니다.</p>
            ) : (
              <>
                {visibleSharedPrompts.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            TEMPLATE_TYPE_BADGE_STYLES[item.type] ?? 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {TEMPLATE_TYPE_LABELS[item.type] ?? item.type}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {item.nickname}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm text-slate-700 dark:text-slate-300">
                        {item.content.length > 50
                          ? `${item.content.slice(0, 50)}...`
                          : item.content}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUnsharePrompt(item)}
                      className="shrink-0 rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"
                    >
                      삭제
                    </button>
                  </div>
                ))}

                {hasMoreShared && (
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleSharedCount((count) => count + SHARED_PAGE_SIZE)
                    }
                    className="self-center rounded-lg border border-violet-300 px-4 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-50 dark:border-violet-500/40 dark:text-violet-400 dark:hover:bg-violet-500/10"
                  >
                    더 보기
                  </button>
                )}
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
