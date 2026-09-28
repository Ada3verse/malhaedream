import { useState } from 'react'

export default function TagToggleGroup({ options, allowCustom = false, onChange }) {
  const [selected, setSelected] = useState([])
  const [customActive, setCustomActive] = useState(false)
  const [customText, setCustomText] = useState('')

  const emit = (nextSelected, nextCustomActive, nextCustomText) => {
    onChange([
      ...nextSelected,
      ...(nextCustomActive && nextCustomText.trim() ? [nextCustomText.trim()] : []),
    ])
  }

  const toggleOption = (option) => {
    const next = selected.includes(option)
      ? selected.filter((item) => item !== option)
      : [...selected, option]
    setSelected(next)
    emit(next, customActive, customText)
  }

  const toggleCustom = () => {
    const next = !customActive
    setCustomActive(next)
    emit(selected, next, customText)
  }

  const handleCustomTextChange = (value) => {
    setCustomText(value)
    emit(selected, customActive, value)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.map((option) => {
        const active = selected.includes(option)
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggleOption(option)}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              active
                ? 'border-mint-600 bg-mint-600 text-white shadow-sm shadow-mint-600/20 dark:border-mint-500 dark:bg-mint-500'
                : 'border-slate-200 bg-slate-100 text-slate-600 hover:border-mint-300 hover:bg-mint-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-mint-500/50 dark:hover:bg-slate-700'
            }`}
          >
            {option}
          </button>
        )
      })}

      {allowCustom && (
        <button
          type="button"
          onClick={toggleCustom}
          className={`rounded-full border px-3 py-1.5 text-sm transition ${
            customActive
              ? 'border-mint-600 bg-mint-600 text-white shadow-sm shadow-mint-600/20 dark:border-mint-500 dark:bg-mint-500'
              : 'border-slate-200 bg-slate-100 text-slate-600 hover:border-mint-300 hover:bg-mint-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-mint-500/50 dark:hover:bg-slate-700'
          }`}
        >
          직접입력
        </button>
      )}

      {allowCustom && customActive && (
        <input
          type="text"
          value={customText}
          onChange={(e) => handleCustomTextChange(e.target.value)}
          placeholder="키워드 직접 입력"
          className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm transition focus:border-mint-700 focus:outline-none focus:ring-2 focus:ring-mint-700/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white sm:w-auto"
        />
      )}
    </div>
  )
}
