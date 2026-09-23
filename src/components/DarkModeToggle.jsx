import { useDarkMode } from '../hooks/useDarkMode'

export default function DarkModeToggle({ className = '' }) {
  const { theme, toggleTheme } = useDarkMode()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="다크모드 전환"
      className={`rounded-lg border border-navy-600 bg-gray-100 px-3 py-1.5 text-sm text-navy-600 transition hover:bg-gray-200 dark:border-white/30 dark:bg-transparent dark:text-white dark:hover:bg-white/10 ${className}`}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
