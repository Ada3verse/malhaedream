import { useState } from 'react'
import { MARKER_STYLES, parseMarkedText, stripMarkers } from '../utils/promptMarkers'

function PromptField({ value, onChange, placeholder, disabled, rows = 8, textClassName = '' }) {
  const [isEditing, setIsEditing] = useState(false)
  const plainValue = stripMarkers(value ?? '')
  const segments = parseMarkedText(value ?? '')

  if (disabled || isEditing) {
    return (
      <textarea
        autoFocus={isEditing}
        value={plainValue}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setIsEditing(false)}
        disabled={disabled}
        rows={rows}
        placeholder={placeholder}
        className={`w-full resize-y rounded-lg border border-violet-100 p-4 text-sm transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20 disabled:cursor-default dark:border-slate-600 ${textClassName}`}
      />
    )
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`min-h-32 w-full cursor-text whitespace-pre-wrap rounded-lg border border-violet-100 p-4 text-sm leading-relaxed transition hover:border-violet-300 dark:border-slate-600 ${textClassName}`}
      style={{ minHeight: `${rows * 1.5}rem` }}
    >
      {segments.length === 0 ? (
        <span className="text-slate-400">{placeholder}</span>
      ) : (
        segments.map((segment, index) =>
          segment.type === 'plain' ? (
            <span key={index}>{segment.content}</span>
          ) : (
            <span
              key={index}
              className={`rounded px-0.5 ${MARKER_STYLES[segment.type] ?? ''}`}
            >
              {segment.content}
            </span>
          ),
        )
      )}
    </div>
  )
}

export default function PromptResultBox({ result, onSave, refined = false, onEdit, onCopy, title, hint }) {
  const [copied, setCopied] = useState(false)

  const ko = result?.ko
  const hasResult = Boolean(ko)
  const copyTarget = stripMarkers(ko || '')

  const handleCopy = async () => {
    if (!copyTarget) return
    try {
      await navigator.clipboard.writeText(copyTarget)
      setCopied(true)
      onCopy?.()
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const handleChangeKo = (value) => onEdit?.({ ...result, ko: value })

  return (
    <div className="rounded-2xl border-2 border-violet-600 bg-[#faf5ff] p-5 shadow-md shadow-violet-200/60 dark:border-violet-500/40 dark:bg-slate-800">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-navy-700 dark:text-slate-200">
          {refined ? '🔄 보완된 프롬프트' : (title ?? '생성된 프롬프트')}
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!copyTarget}
            className="rounded-lg border border-violet-300 px-3 py-1.5 text-xs font-medium text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-violet-500/40 dark:text-violet-400 dark:hover:bg-violet-500/10"
          >
            {copied ? '복사됨!' : '복사'}
          </button>
          <button
            type="button"
            onClick={onSave}
            className="rounded-lg border-2 border-violet-600 px-3 py-1.5 text-xs font-medium text-violet-700 transition hover:bg-violet-50 dark:border-violet-500 dark:text-violet-400 dark:hover:bg-violet-500/10"
          >
            저장
          </button>
        </div>
      </div>

      {hasResult && (
        <p className="mt-2 text-xs text-slate-400">
          ✏️ 직접 클릭해서 수정할 수 있어요
        </p>
      )}

      <div className="mt-3">
        <PromptField
          value={ko ?? ''}
          onChange={handleChangeKo}
          disabled={!hasResult}
          rows={8}
          placeholder="프롬프트를 생성하면 여기에 표시됩니다."
          textClassName="bg-white/70 text-slate-700 disabled:text-slate-400 dark:bg-slate-900 dark:text-slate-200 dark:disabled:text-slate-500"
        />
      </div>

      {hasResult && hint && (
        <p className="mt-2 text-xs text-slate-400">{hint}</p>
      )}
    </div>
  )
}
