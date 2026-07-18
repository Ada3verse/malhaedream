import { useEffect } from 'react'

export default function Modal({
  title,
  onClose,
  children,
  maxWidthClass = 'max-w-lg',
  bodyClassName = 'px-6 py-5',
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[80vh] w-full ${maxWidthClass} flex-col overflow-hidden rounded-2xl bg-white shadow-xl`}
      >
        <div className="bg-navy-700 px-6 py-4">
          <h2 className="text-lg font-bold text-white">{title}</h2>
        </div>

        <div className={`flex-1 overflow-y-auto text-sm text-slate-700 ${bodyClassName}`}>
          {children}
        </div>

        <div className="border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg bg-navy-600 py-2.5 text-sm font-medium text-white transition hover:bg-navy-700"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
