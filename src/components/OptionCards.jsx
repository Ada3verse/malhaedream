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
              className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                active
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
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
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
        />
      )}
    </div>
  )
}
