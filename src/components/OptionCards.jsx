import { useState } from 'react'

export default function OptionCards({ options, onChange }) {
  const [selectedValue, setSelectedValue] = useState(null)
  const [customText, setCustomText] = useState('')

  const selectedOption = options.find((option) => option.value === selectedValue)

  const emit = (value, text) => {
    const option = options.find((item) => item.value === value)
    if (!option) {
      onChange('')
      return
    }
    onChange(option.custom ? text.trim() : option.label)
  }

  const handleSelect = (value) => {
    setSelectedValue(value)
    emit(value, customText)
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
                  ? 'border-navy-600 bg-navy-600 text-white shadow-md shadow-navy-600/20'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-navy-300 hover:bg-navy-50'
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
          className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20"
        />
      )}
    </div>
  )
}
