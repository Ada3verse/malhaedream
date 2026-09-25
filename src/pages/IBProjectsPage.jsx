import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DarkModeToggle from '../components/DarkModeToggle'
import { useToast } from '../components/Toast'
import { useAuthGuard } from '../hooks/useAuthGuard'
import { deleteIBProject, getIBProjectsByNickname } from '../utils/ibProjects'
import { exportIBProjectToXlsx } from '../utils/ibProjectExport'

const SECTION_LABELS = {
  unitPlan: '전체 유닛 플랜',
  inquiry: '탐구 질문',
  statement: '탐구 진술문',
  assessment: '총괄 평가',
  atl: 'ATL 기능',
}

const SECTION_ORDER = ['unitPlan', 'inquiry', 'statement', 'assessment', 'atl']

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

export default function IBProjectsPage() {
  const user = useAuthGuard()
  const showToast = useToast()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [exportingId, setExportingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    getIBProjectsByNickname(user.nickname, user.deviceId)
      .then(setProjects)
      .catch(() => showToast('프로젝트 목록을 불러오지 못했습니다.', 'error'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  if (!user) return null

  const handleExport = async (project) => {
    setExportingId(project.id)
    try {
      await exportIBProjectToXlsx(project)
      showToast('xlsx 파일을 다운로드했습니다!', 'success')
    } catch (error) {
      showToast(error.message || 'xlsx 내보내기에 실패했습니다.', 'error')
    } finally {
      setExportingId(null)
    }
  }

  const handleDelete = async (project) => {
    if (!window.confirm('이 프로젝트를 삭제할까요? 되돌릴 수 없습니다.')) return
    setDeletingId(project.id)
    try {
      await deleteIBProject(project.id, { nickname: user.nickname, deviceId: user.deviceId })
      setProjects((prev) => prev.filter((item) => item.id !== project.id))
      showToast('삭제되었습니다.', 'success')
    } catch {
      showToast('삭제 중 오류가 발생했습니다.', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16 dark:bg-slate-900">
      <header className="flex items-center justify-between border-b-2 border-violet-500 bg-white px-4 py-3 shadow-md dark:bg-[#1e293b] sm:px-6">
        <Link
          to="/prompt/ib"
          className="text-sm text-navy-600 transition hover:text-navy-700 dark:text-white/90 dark:hover:text-white"
        >
          ← IB 프롬프트로 돌아가기
        </Link>
        <DarkModeToggle />
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-navy-800 dark:text-white">📁 내 IB 프로젝트</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          IB 프롬프트 생성 페이지에서 만든 내용이 프로젝트별로 자동 저장됩니다. 완성된
          프로젝트는 학교 원본 양식(xlsx)으로 내보낼 수 있어요.
        </p>

        <div className="mt-6">
          {loading ? (
            <p className="py-12 text-center text-slate-400">불러오는 중...</p>
          ) : projects.length === 0 ? (
            <p className="py-12 text-center text-slate-400">
              아직 생성된 프로젝트가 없습니다. IB 프롬프트를 먼저 생성해보세요!
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {projects.map((project) => {
                const completedSections = SECTION_ORDER.filter(
                  (key) => project.sections?.[key]?.prompt,
                )
                return (
                  <li
                    key={project.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h2 className="text-base font-semibold text-navy-800 dark:text-white">
                          {project.title || project.subject || '(제목 없음)'}
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {[project.subject, project.mypYear].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <span className="text-xs text-slate-400">
                        {formatDate(project.updatedAt)} 업데이트
                      </span>
                    </div>

                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                      완성된 섹션: {completedSections.length}/{SECTION_ORDER.length}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {SECTION_ORDER.map((key) => (
                        <span
                          key={key}
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            project.sections?.[key]?.prompt
                              ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300'
                              : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
                          }`}
                        >
                          {SECTION_LABELS[key]}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleExport(project)}
                        disabled={exportingId === project.id}
                        className="rounded-lg bg-gradient-to-br from-navy-600 to-violet-600 px-3 py-1.5 text-xs font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:bg-none dark:hover:bg-blue-600"
                      >
                        {exportingId === project.id ? '내보내는 중...' : '📊 xlsx로 내보내기'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(project)}
                        disabled={deletingId === project.id}
                        className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"
                      >
                        삭제
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}
