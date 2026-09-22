import { createContext, useCallback, useContext, useState } from 'react'

const ToastContext = createContext(null)

const TOAST_STYLES = {
  success: 'bg-emerald-600',
  warning: 'bg-amber-600',
  error: 'bg-red-600',
}

const TOAST_DURATION = 2000

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'success') => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, TOAST_DURATION)
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}

      <div className="fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-slate-900/20 ${
              TOAST_STYLES[toast.type] ?? TOAST_STYLES.success
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const showToast = useContext(ToastContext)
  if (!showToast) {
    throw new Error('useToast는 ToastProvider 내부에서만 사용할 수 있습니다.')
  }
  return showToast
}
