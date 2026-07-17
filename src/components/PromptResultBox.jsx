import { useState } from 'react'

export default function PromptResultBox({ result, onSave }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="rounded-2xl border-2 border-sky-200 bg-white p-5 shadow-md shadow-slate-200/60">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-navy-700">생성된 프롬프트</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!result}
            className="rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-medium text-navy-700 transition hover:bg-navy-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copied ? '복사됨!' : '복사'}
          </button>
          <button
            type="button"
            onClick={onSave}
            className="rounded-lg bg-navy-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-navy-700"
          >
            저장
          </button>
        </div>
      </div>
      <div className="mt-3 min-h-32 whitespace-pre-wrap rounded-lg border border-sky-100 bg-sky-50 p-4 text-sm text-slate-700">
        {result || '프롬프트를 생성하면 여기에 표시됩니다.'}
      </div>
    </div>
  )
}
