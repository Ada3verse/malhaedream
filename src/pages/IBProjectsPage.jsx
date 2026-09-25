import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DarkModeToggle from '../components/DarkModeToggle'
import Modal from '../components/Modal'
import { useToast } from '../components/Toast'
import { useAuthGuard } from '../hooks/useAuthGuard'
import { ibData } from '../utils/ibData'
import {
  IB_PROJECT_SECTIONS,
  createIBProject,
  deleteIBProject,
  getIBProjects,
  updateIBProjectInfo,
} from '../utils/ibProjectService'

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

function ProjectCard({ project, onDelete, onEdit }) {
  const navigate = useNavigate()
  const completedCount = IB_PROJECT_SECTIONS.filter((section) => project.sections?.[section.key]).length

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/prompt/ib?projectId=${project.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') navigate(`/prompt/ib?projectId=${project.id}`)
      }}
      className="relative flex cursor-pointer flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-md shadow-slate-200/60 transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:shadow-none"
    >
      <div className="absolute right-3 top-3 flex gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onEdit(project)
          }}
          aria-label="프로젝트 편집"
          className="text-slate-400 transition hover:text-navy-600 dark:hover:text-blue-400"
        >
          ✏️
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(project)
          }}
          aria-label="프로젝트 삭제"
          className="text-slate-400 transition hover:text-red-500"
        >
          ✕
        </button>
      </div>

      <h2 className="pr-12 text-lg font-semibold text-navy-800 dark:text-white">{project.title}</h2>

      <div className="flex flex-wrap gap-1.5">
        {project.subject && (
          <span className="rounded-full bg-navy-50 px-2.5 py-0.5 text-xs font-medium text-navy-700 dark:bg-slate-700 dark:text-slate-200">
            {project.subject}
          </span>
        )}
        {project.mypYear && (
          <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
            {project.mypYear}
          </span>
        )}
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        {completedCount}/{IB_PROJECT_SECTIONS.length} 섹션 완료
      </p>

      <div className="flex flex-wrap gap-1.5">
        {IB_PROJECT_SECTIONS.map((section) => {
          const done = Boolean(project.sections?.[section.key])
          return (
            <span
              key={section.key}
              title={section.label}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                done
                  ? 'bg-emerald-100 dark:bg-emerald-500/20'
                  : 'bg-slate-100 grayscale opacity-50 dark:bg-slate-700'
              }`}
            >
              {section.icon}
            </span>
          )
        })}
      </div>

      <p className="mt-1 text-xs text-slate-400">마지막 수정: {formatDate(project.updatedAt) || '-'}</p>
    </div>
  )
}

export default function IBProjectsPage() {
  const user = useAuthGuard()
  const showToast = useToast()

  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newSubject, setNewSubject] = useState('')
  const [newMypYear, setNewMypYear] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const [editingProject, setEditingProject] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editSubject, setEditSubject] = useState('')
  const [editMypYear, setEditMypYear] = useState('')
  const [editKeyConcept, setEditKeyConcept] = useState('')
  const [editGlobalContext, setEditGlobalContext] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState('')

  const navigate = useNavigate()

  const loadProjects = async (userId) => {
    setLoading(true)
    setError('')
    try {
      const list = await getIBProjects(userId)
      setProjects(list)
    } catch {
      setError('프로젝트를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    loadProjects(user.nickname)
  }, [user])

  if (!user) return null

  const openCreateModal = () => {
    setNewTitle('')
    setNewSubject('')
    setNewMypYear('')
    setCreateError('')
    setShowCreateModal(true)
  }

  const handleCreate = async () => {
    if (!newTitle.trim()) {
      setCreateError('프로젝트 제목을 입력해주세요.')
      return
    }

    setCreating(true)
    setCreateError('')
    try {
      const projectId = await createIBProject({
        userId: user.nickname,
        title: newTitle.trim(),
        subject: newSubject,
        mypYear: newMypYear,
      })
      setShowCreateModal(false)
      navigate(`/prompt/ib?projectId=${projectId}`)
    } catch {
      setCreateError('프로젝트 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (project) => {
    if (!confirm(`'${project.title}' 프로젝트를 삭제하시겠습니까?`)) return
    try {
      await deleteIBProject(project.id)
      setProjects((prev) => prev.filter((item) => item.id !== project.id))
      showToast('삭제되었습니다.', 'success')
    } catch {
      showToast('삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error')
    }
  }

  const openEditModal = (project) => {
    setEditingProject(project)
    setEditTitle(project.title ?? '')
    setEditSubject(project.subject ?? '')
    setEditMypYear(project.mypYear ?? '')
    setEditKeyConcept(project.keyConcept ?? '')
    setEditGlobalContext(project.globalContext ?? '')
    setEditError('')
  }

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      setEditError('프로젝트 제목을 입력해주세요.')
      return
    }

    setSavingEdit(true)
    setEditError('')
    try {
      await updateIBProjectInfo(editingProject.id, {
        title: editTitle.trim(),
        subject: editSubject,
        mypYear: editMypYear,
        keyConcept: editKeyConcept,
        relatedConcepts: editingProject.relatedConcepts ?? '',
        globalContext: editGlobalContext,
        exploration: editingProject.exploration ?? '',
        statementKeyword: editingProject.statementKeyword ?? '',
      })
      setProjects((prev) =>
        prev.map((item) =>
          item.id === editingProject.id
            ? {
                ...item,
                title: editTitle.trim(),
                subject: editSubject,
                mypYear: editMypYear,
                keyConcept: editKeyConcept,
                globalContext: editGlobalContext,
              }
            : item,
        ),
      )
      setEditingProject(null)
      showToast('저장됐어요!', 'success')
    } catch {
      setEditError('저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16 dark:bg-slate-900">
      <header className="flex items-center justify-between border-b-2 border-violet-500 bg-white px-4 py-3 shadow-md dark:bg-[#1e293b] sm:px-6">
        <Link
          to="/home"
          className="text-sm text-navy-600 transition hover:text-navy-700 dark:text-white/90 dark:hover:text-white"
        >
          ← 돌아가기
        </Link>
        <DarkModeToggle />
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-navy-800 dark:text-white">
            🎓 내 IB 유닛 플랜 프로젝트
          </h1>
          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-lg bg-gradient-to-br from-navy-600 to-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-navy-600/20 transition hover:shadow-lg hover:brightness-110 dark:bg-blue-500 dark:bg-none dark:hover:bg-blue-600"
          >
            + 새 프로젝트 만들기
          </button>
        </div>

        {loading ? (
          <p className="mt-10 text-center text-slate-400">불러오는 중...</p>
        ) : error ? (
          <p className="mt-10 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        ) : projects.length === 0 ? (
          <p className="mt-10 text-center text-slate-400 dark:text-slate-500">
            아직 프로젝트가 없어요. 새 프로젝트를 만들어보세요.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} onDelete={handleDelete} onEdit={openEditModal} />
            ))}
          </div>
        )}
      </main>

      {showCreateModal && (
        <Modal
          title="새 IB 프로젝트 만들기"
          onClose={() => setShowCreateModal(false)}
          footer={
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 rounded-lg bg-gradient-to-br from-navy-600 to-violet-600 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:bg-none dark:hover:bg-blue-600"
              >
                {creating ? '만드는 중...' : '만들기'}
              </button>
            </div>
          }
        >
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-navy-700 dark:text-slate-300">
                프로젝트 제목
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="예: 과학 MYP2 생태계 단원"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-navy-700 dark:text-slate-300">
                교과군
              </label>
              <select
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              >
                <option value="">선택하세요</option>
                {ibData.subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="mb-1 block text-sm font-medium text-navy-700 dark:text-slate-300">MYP 학년</p>
              <div className="flex flex-wrap gap-2">
                {ibData.mypYears.map((year) => {
                  const active = newMypYear === year
                  return (
                    <button
                      key={year}
                      type="button"
                      onClick={() => setNewMypYear(year)}
                      className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                        active
                          ? 'border-navy-600 bg-navy-600 text-white dark:border-blue-500 dark:bg-blue-500'
                          : 'border-slate-200 bg-slate-100 text-slate-700 hover:border-navy-300 hover:bg-navy-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      {year}
                    </button>
                  )
                })}
              </div>
            </div>

            {createError && (
              <p className="text-sm text-red-600 dark:text-red-400">{createError}</p>
            )}
          </div>
        </Modal>
      )}

      {editingProject && (
        <Modal
          title="프로젝트 편집"
          onClose={() => setEditingProject(null)}
          footer={
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditingProject(null)}
                className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="flex-1 rounded-lg bg-gradient-to-br from-navy-600 to-violet-600 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:bg-none dark:hover:bg-blue-600"
              >
                {savingEdit ? '저장 중...' : '저장'}
              </button>
            </div>
          }
        >
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-navy-700 dark:text-slate-300">
                프로젝트 제목
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-navy-700 dark:text-slate-300">
                교과군
              </label>
              <select
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              >
                <option value="">선택하세요</option>
                {ibData.subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="mb-1 block text-sm font-medium text-navy-700 dark:text-slate-300">MYP 학년</p>
              <div className="flex flex-wrap gap-2">
                {ibData.mypYears.map((year) => {
                  const active = editMypYear === year
                  return (
                    <button
                      key={year}
                      type="button"
                      onClick={() => setEditMypYear(year)}
                      className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                        active
                          ? 'border-navy-600 bg-navy-600 text-white dark:border-blue-500 dark:bg-blue-500'
                          : 'border-slate-200 bg-slate-100 text-slate-700 hover:border-navy-300 hover:bg-navy-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      {year}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-navy-700 dark:text-slate-300">
                핵심 개념 (Key Concept)
              </label>
              <select
                value={editKeyConcept}
                onChange={(e) => setEditKeyConcept(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              >
                <option value="">선택하세요</option>
                {ibData.keyConcepts.map((concept) => (
                  <option key={concept} value={concept}>
                    {concept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-navy-700 dark:text-slate-300">
                세계적 맥락 (Global Context)
              </label>
              <select
                value={editGlobalContext}
                onChange={(e) => setEditGlobalContext(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              >
                <option value="">선택하세요</option>
                {ibData.globalContexts.map((context) => (
                  <option key={context.name} value={context.name}>
                    {context.name}
                  </option>
                ))}
              </select>
            </div>

            {editError && <p className="text-sm text-red-600 dark:text-red-400">{editError}</p>}
          </div>
        </Modal>
      )}
    </div>
  )
}
