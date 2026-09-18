import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store/app'
import { useL } from '../i18n/LangContext'
import { alertLabel, deadlineAlerts, urgentCount, type DeadlineAlert } from '../engine/alerts'

/**
 * Колокольчик с ближайшими дедлайнами.
 *
 * Сервера у прототипа нет, поэтому письма и push отправить неоткуда — и
 * обещать их в интерфейсе было бы обманом. Вместо этого напоминание живёт
 * на странице: колокольчик считает оставшееся время при каждой отрисовке
 * и краснеет, когда период уже идёт или начнётся в течение месяца.
 */
export function DeadlineBell() {
  const { calendar, reminders, completed } = useApp()
  const L = useL()
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  const alerts = useMemo(() => deadlineAlerts(calendar, reminders), [calendar, reminders])
  const urgent = urgentCount(alerts)

  // Клик мимо и Esc закрывают панель: она перекрывает шапку.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!completed) return null

  const label = urgent > 0
    ? L(`Дедлайны: ${urgent} требуют внимания`, `Дедлайндар: ${urgent} назар аударуды талап етеді`)
    : L('Дедлайны', 'Дедлайндар')

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        aria-expanded={open}
        title={label}
        className={`relative grid h-8 w-8 place-items-center rounded-lg border bg-surface transition-colors ${
          urgent > 0
            ? 'border-coral-500 text-coral-600 hover:bg-coral-50'
            : 'border-line text-ink-soft hover:border-brand-300 hover:text-brand-700'
        }`}
      >
        <svg viewBox="0 0 20 20" className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
          <path d="M10 2.6a4.7 4.7 0 0 0-4.7 4.7c0 4-1.5 5.2-1.5 5.2h12.4s-1.5-1.2-1.5-5.2A4.7 4.7 0 0 0 10 2.6Z" />
          <path d="M11.5 15.4a1.7 1.7 0 0 1-3 0" />
        </svg>
        {urgent > 0 && (
          <span className="absolute -right-1 -top-1 grid min-w-[16px] place-items-center rounded-full bg-coral-600 px-1 text-[10px] font-bold leading-4 text-white">
            {urgent}
          </span>
        )}
      </button>

      {/*
        На узком экране панель шире кнопки, и, прицепленная к ней, уезжала за
        левый край. Поэтому на мобильном она прижата к самому экрану, а рядом
        с кнопкой встаёт только начиная с sm.
      */}
      {open && (
        <div className="fixed inset-x-4 top-[4.25rem] z-50 animate-pop rounded-2xl border border-line bg-surface p-3 shadow-lift sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80">
          <p className="label mb-2">{L('Ближайшие дедлайны', 'Жақын дедлайндар')}</p>
          {alerts.length === 0 ? (
            <p className="text-[13.5px] leading-relaxed text-ink-muted">
              {L(
                'Пока ничего срочного. Периоды подачи появятся здесь, когда приблизятся.',
                'Әзірге шұғыл ештеңе жоқ. Өтінім кезеңдері жақындағанда осында шығады.',
              )}
            </p>
          ) : (
            <ul className="space-y-2">
              {alerts.slice(0, 5).map((a) => (
                <AlertRow key={a.entry.id} alert={a} />
              ))}
            </ul>
          )}
          <Link
            to="/calendar"
            onClick={() => setOpen(false)}
            className="mt-3 block rounded-xl border border-line px-3 py-2 text-center text-[13px] font-bold text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-50"
          >
            {L('Открыть календарь', 'Күнтізбені ашу')}
          </Link>
          <p className="mt-2 text-[11.5px] leading-relaxed text-ink-muted">
            {L(
              'Периоды ориентировочные, сроки сверяй по ссылкам в календаре. Писем и push прототип не отправляет.',
              'Кезеңдер болжамды, мерзімдерді күнтізбедегі сілтемелер бойынша тексер. Прототип хат пен push жібермейді.',
            )}
          </p>
        </div>
      )}
    </div>
  )
}

function AlertRow({ alert }: { alert: DeadlineAlert }) {
  const L = useL()
  const hot = alert.level === 'now' || alert.level === 'soon'
  return (
    <li
      className={`rounded-xl border px-3 py-2 ${
        hot ? 'border-coral-100 bg-coral-50' : 'border-line bg-paper'
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[13.5px] font-bold leading-snug">{alert.entry.title}</p>
        {alert.starred && (
          <span aria-label={L('отмечено', 'белгіленген')} className="shrink-0 text-[12px] text-sun-600">★</span>
        )}
      </div>
      <p className="mt-0.5 text-[12.5px] leading-snug text-ink-muted">{alert.entry.subtitle}</p>
      <p className={`mt-1 text-[12.5px] font-bold ${hot ? 'text-coral-700' : 'text-ink-soft'}`}>
        {alertLabel(alert)} · {alert.entry.window}
      </p>
    </li>
  )
}
