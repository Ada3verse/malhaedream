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
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-700">생성된 프롬프트</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!result}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copied ? '복사됨!' : '복사'}
          </button>
          <button
            type="button"
            onClick={onSave}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
          >
            저장
          </button>
        </div>
      </div>
      <div className="mt-3 min-h-32 whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
        {result || '프롬프트를 생성하면 여기에 표시됩니다.'}
      </div>
    </div>
  )
}
