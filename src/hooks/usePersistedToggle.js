import { useEffect, useState } from 'react'

function readStoredValue(key, defaultValue) {
  try {
    const stored = localStorage.getItem(key)
    if (stored === 'true') return true
    if (stored === 'false') return false
  } catch {
    // localStorage 접근 불가 시 기본값 사용
  }
  return defaultValue
}

export function usePersistedToggle(key, defaultValue = false) {
  const [value, setValue] = useState(() => readStoredValue(key, defaultValue))

  useEffect(() => {
    try {
      localStorage.setItem(key, String(value))
    } catch {
      // 저장 실패 시 무시 (세션 동안만 적용)
    }
  }, [key, value])

  const toggle = () => setValue((prev) => !prev)

  return [value, toggle]
}
