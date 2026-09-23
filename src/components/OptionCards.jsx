import { useState } from 'react'

export default function OptionCards({ options, onChange, value }) {
  const [internalValue, setInternalValue] = useState(null)
  const [customText, setCustomText] = useState('')

  const isControlled = value !== undefined
  const selectedValue = isControlled ? value : internalValue
  const selectedOption = options.find((option) => option.value === selectedValue)

  const emit = (val, text) => {
    const option = options.find((item) => item.value === val)
    if (!option) {
      onChange('')
      return
    }
    onChange(option.custom ? text.trim() : option.label)
  }

  const handleSelect = (val) => {
    if (!isControlled) setInternalValue(val)
    emit(val, customText)
  }

  const handleCustomTextChange = (value) => {
    setCustomText(value)
    emit(selectedValue, value)
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selectedValue === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                active
                  ? 'border-violet-600 bg-violet-600 text-white shadow-md shadow-violet-600/20 dark:border-violet-500 dark:bg-violet-500'
                  : 'border-slate-200 bg-slate-100 text-slate-700 hover:border-violet-300 hover:bg-violet-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-violet-500/50 dark:hover:bg-slate-700'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
      {selectedOption?.custom && (
        <input
          type="text"
          value={customText}
          onChange={(e) => handleCustomTextChange(e.target.value)}
          placeholder="직접 입력하세요"
          className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        />
      )}
    </div>
  )
}
