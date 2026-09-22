import { useDarkMode } from '../hooks/useDarkMode'

export default function DarkModeToggle({ className = '' }) {
  const { theme, toggleTheme } = useDarkMode()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="다크모드 전환"
      className={`rounded-lg border border-white/30 px-3 py-1.5 text-sm text-white transition hover:bg-white/10 ${className}`}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
