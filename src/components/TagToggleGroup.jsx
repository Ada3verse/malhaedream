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
                ? 'border-navy-600 bg-navy-600 text-white shadow-sm shadow-navy-600/20'
                : 'border-slate-200 bg-white text-slate-600 hover:border-navy-300 hover:bg-navy-50'
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
              ? 'border-navy-600 bg-navy-600 text-white shadow-sm shadow-navy-600/20'
              : 'border-slate-200 bg-white text-slate-600 hover:border-navy-300 hover:bg-navy-50'
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
          className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20 sm:w-auto"
        />
      )}
    </div>
  )
}
