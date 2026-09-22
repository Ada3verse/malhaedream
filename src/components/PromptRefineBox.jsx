import { useState } from 'react'
import TagToggleGroup from './TagToggleGroup'

export default function PromptRefineBox({ options, onRefine }) {
  const [quickFixes, setQuickFixes] = useState([])
  const [customRequest, setCustomRequest] = useState('')
  const [error, setError] = useState('')

  const handleRefine = () => {
    if (!quickFixes.length && !customRequest.trim()) {
      setError('수정할 내용을 선택하거나 입력해주세요.')
      return
    }
    setError('')
    onRefine(quickFixes, customRequest)
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-100 p-5 dark:border-slate-700 dark:bg-slate-800">
      <h3 className="text-sm font-semibold text-navy-700 dark:text-slate-200">🔧 프롬프트 보완</h3>

      <div className="mt-3">
        <TagToggleGroup options={options} onChange={setQuickFixes} />
      </div>

      <textarea
        value={customRequest}
        onChange={(e) => setCustomRequest(e.target.value)}
        rows={2}
        placeholder="추가로 원하는 조건을 직접 입력하세요 (예: 문단을 3개로 나눠줘, 인사말을 먼저 써줘)"
        className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
      />

      {error && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleRefine}
        className="mt-3 w-full rounded-lg border-2 border-navy-600 py-2 text-sm font-medium text-navy-700 transition hover:bg-navy-50 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-500/10"
      >
        프롬프트 보완
      </button>
    </div>
  )
}
