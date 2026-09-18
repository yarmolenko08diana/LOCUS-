import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/app'

/**
 * Обратная связь на изменение анкеты. Требование кейса — после смены ключевого
 * ответа маршрут должен заметно меняться, а пользователь должен это увидеть.
 */
export function ChangeToast() {
  const { changeNote, dismissChange } = useApp()
  const navigate = useNavigate()

  useEffect(() => {
    if (!changeNote) return
    const t = window.setTimeout(dismissChange, 9000)
    return () => window.clearTimeout(t)
  }, [changeNote, dismissChange])

  if (!changeNote) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="safe-bottom pointer-events-none fixed inset-x-0 bottom-16 z-50 flex justify-center px-4 md:bottom-6"
    >
      <div className="pointer-events-auto w-full max-w-md animate-fade-up rounded-2xl border border-brand-200 bg-brand-900 p-4 text-white shadow-lift">
        <div className="flex items-start gap-3">
          <span aria-hidden className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-mint-500 text-[13px]">↻</span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold leading-snug">{changeNote.headline}</p>
            <ul className="mt-1.5 space-y-1">
              {changeNote.details.map((d) => (
                <li key={d} className="text-[13px] leading-snug text-brand-100">{d}</li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => { dismissChange(); navigate('/matches') }}
                className="rounded-lg bg-white px-3 py-1.5 text-[13px] font-bold text-brand-900"
              >
                Посмотреть подбор
              </button>
              <button
                type="button"
                onClick={dismissChange}
                className="rounded-lg px-3 py-1.5 text-[13px] font-semibold text-brand-200 hover:text-white"
              >
                Скрыть
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
