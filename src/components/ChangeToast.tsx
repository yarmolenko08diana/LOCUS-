import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/app'
import { useL } from '../i18n/LangContext'

/**
 * Обратная связь на изменение анкеты. Требование кейса — после смены ключевого
 * ответа маршрут должен заметно меняться, а пользователь должен это увидеть.
 */
export function ChangeToast() {
  const { changeNote, dismissChange } = useApp()
  const L = useL()
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
      <div className="pointer-events-auto w-full max-w-md animate-fade-up rounded-2xl border border-deep/40 bg-deep p-4 text-deep-ink shadow-lift">
        <div className="flex items-start gap-3">
          <span aria-hidden className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-mint-500 text-[13px]">↻</span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold leading-snug">{changeNote.headline}</p>
            <ul className="mt-1.5 space-y-1">
              {changeNote.details.map((d) => (
                <li key={d} className="text-[13px] leading-snug text-deep-soft">{d}</li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => { dismissChange(); navigate('/matches') }}
                className="rounded-lg bg-deep-ink px-3 py-1.5 text-[13px] font-bold text-deep"
              >
                {L('Посмотреть подбор', 'Таңдауды қарау')}
              </button>
              <button
                type="button"
                onClick={dismissChange}
                className="rounded-lg px-3 py-1.5 text-[13px] font-semibold text-deep-muted hover:text-deep-ink"
              >
                {L('Скрыть', 'Жасыру')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
