import { useState } from 'react'

const TAG_BASE_CLASS = 'rounded-full border px-3 py-1.5 text-sm font-medium transition'
const TAG_ACTIVE_CLASS =
  'border-navy-600 bg-navy-600 text-white shadow-sm shadow-navy-600/20 dark:border-blue-500 dark:bg-blue-500'
const TAG_INACTIVE_CLASS =
  'border-slate-200 bg-slate-100 text-slate-600 hover:border-navy-300 hover:bg-navy-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-500/50 dark:hover:bg-slate-700'
const TAG_ADD_CLASS =
  'rounded-full border border-dashed border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:border-navy-400 hover:text-navy-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-blue-500/50 dark:hover:text-blue-400'

export default function TagSelector({ categories, selected, onChange, placeholder }) {
  const [openCategories, setOpenCategories] = useState({})
  const [customTexts, setCustomTexts] = useState({})

  const allPredefinedTags = categories.flatMap((category) => category.tags)
  const extraSelectedTags = selected.filter((tag) => !allPredefinedTags.includes(tag))

  const toggleTag = (tag) => {
    onChange(selected.includes(tag) ? selected.filter((item) => item !== tag) : [...selected, tag])
  }

  const toggleCustomOpen = (label) => {
    setOpenCategories((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const handleCustomTextChange = (label, value) => {
    setCustomTexts((prev) => ({ ...prev, [label]: value }))
  }

  const handleAddCustom = (label) => {
    const value = (customTexts[label] ?? '').trim()
    if (!value || selected.includes(value)) return
    onChange([...selected, value])
    setCustomTexts((prev) => ({ ...prev, [label]: '' }))
  }

  const handleCustomKeyDown = (label, e) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    handleAddCustom(label)
  }

  return (
    <div className="flex flex-col gap-4">
      {categories.map((category) => (
        <div key={category.label} className="flex flex-col gap-2">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{category.label}</p>
          <div className="flex flex-wrap gap-2">
            {category.tags.map((tag) => {
              const active = selected.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`${TAG_BASE_CLASS} ${active ? TAG_ACTIVE_CLASS : TAG_INACTIVE_CLASS}`}
                >
                  {tag}
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => toggleCustomOpen(category.label)}
              className={TAG_ADD_CLASS}
            >
              + 직접입력
            </button>
          </div>

          {openCategories[category.label] && (
            <div className="flex gap-2">
              <input
                type="text"
                value={customTexts[category.label] ?? ''}
                onChange={(e) => handleCustomTextChange(category.label, e.target.value)}
                onKeyDown={(e) => handleCustomKeyDown(category.label, e)}
                placeholder={placeholder ?? '직접 입력 후 Enter'}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm transition focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
              <button
                type="button"
                onClick={() => handleAddCustom(category.label)}
                className="shrink-0 rounded-lg bg-navy-600 px-3 py-1.5 text-sm font-medium text-white transition hover:brightness-110 dark:bg-blue-500"
              >
                추가
              </button>
            </div>
          )}
        </div>
      ))}

      {extraSelectedTags.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">직접 입력한 태그</p>
          <div className="flex flex-wrap gap-2">
            {extraSelectedTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`${TAG_BASE_CLASS} ${TAG_ACTIVE_CLASS}`}
              >
                {tag} ✕
              </button>
            ))}
          </div>
        </div>
      )}

      {selected.length > 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400">선택됨: {selected.join(', ')}</p>
      )}
    </div>
  )
}
