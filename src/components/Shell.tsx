import { Link, NavLink, useLocation } from 'react-router-dom'
import { useEffect, type ReactNode } from 'react'
import { useApp } from '../store/app'
import { STEPS, stepIndexForPath } from './Journey'
import { ChangeToast } from './ChangeToast'

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="Qadam — на главную">
      <span aria-hidden className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600">
        <svg viewBox="0 0 64 64" className="h-6 w-6">
          <path
            d="M18 44 C 26 44, 26 32, 34 32 C 42 32, 42 20, 50 20"
            fill="none" stroke="#CFF3E4" strokeWidth="6" strokeLinecap="round"
          />
          <circle cx="18" cy="44" r="5.5" fill="#FFFFFF" />
          <circle cx="50" cy="20" r="5.5" fill="#12A87A" />
        </svg>
      </span>
      <span className="leading-none">
        <span className="block text-[17px] font-extrabold tracking-[-0.02em]">Qadam</span>
        <span className="block text-[11px] font-medium text-ink-muted">маршрут поступления</span>
      </span>
    </Link>
  )
}

/** Горизонтальный рейл шагов: где пользователь сейчас и что уже пройдено. */
function StepRail({ current }: { current: number }) {
  return (
    <nav aria-label="Этапы маршрута" className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ol className="flex min-w-max items-center gap-1 sm:min-w-0 sm:gap-1.5">
        {STEPS.map((step, i) => {
          const state = i < current ? 'done' : i === current ? 'current' : 'todo'
          return (
            <li key={step.id} className="flex items-center gap-1 sm:flex-1 sm:gap-1.5">
              <NavLink
                to={step.path}
                title={step.what}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold transition-colors sm:w-full ${
                  state === 'current'
                    ? 'bg-brand-600 text-white'
                    : state === 'done'
                      ? 'text-brand-700 hover:bg-brand-50'
                      : 'text-ink-muted hover:bg-paper'
                }`}
              >
                <span
                  aria-hidden
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                    state === 'current'
                      ? 'bg-white/20 text-white'
                      : state === 'done'
                        ? 'bg-mint-100 text-mint-700'
                        : 'bg-line/70 text-ink-muted'
                  }`}
                >
                  {state === 'done' ? '✓' : i + 1}
                </span>
                <span className="whitespace-nowrap">{step.label}</span>
              </NavLink>
              {i < STEPS.length - 1 && (
                <span aria-hidden className={`hidden h-px w-3 shrink-0 sm:block ${i < current ? 'bg-brand-300' : 'bg-line'}`} />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function BottomBar({ current }: { current: number }) {
  return (
    <nav
      aria-label="Навигация по маршруту"
      className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pt-1.5 backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2">
        {STEPS.map((step, i) => (
          <li key={step.id} className="flex-1">
            <NavLink
              to={step.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[11px] font-semibold transition-colors ${
                  isActive ? 'text-brand-700' : 'text-ink-muted'
                }`
              }
            >
              <span
                aria-hidden
                className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold ${
                  i === current
                    ? 'bg-brand-600 text-white'
                    : i < current
                      ? 'bg-mint-100 text-mint-700'
                      : 'bg-line/70 text-ink-muted'
                }`}
              >
                {i < current ? '✓' : i + 1}
              </span>
              {step.short}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function Shell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const { completed, done, tasks } = useApp()
  const current = stepIndexForPath(pathname)
  const isLanding = pathname === '/'

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])

  const progress = tasks.length ? Math.round((done.filter((d) => tasks.some((t) => t.id === d)).length / tasks.length) * 100) : 0

  return (
    <div className="min-h-dvh bg-paper">
      <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Logo />
          {completed && !isLanding && (
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Прогресс плана</p>
                <p className="text-sm font-bold tabular-nums text-ink">{progress}%</p>
              </div>
              <Link
                to="/survey"
                className="rounded-lg border border-line bg-surface px-3 py-2 text-[13px] font-semibold text-ink-soft transition-colors hover:border-brand-300 hover:text-brand-700"
              >
                Изменить анкету
              </Link>
            </div>
          )}
        </div>
        {completed && !isLanding && (
          <div className="mx-auto max-w-5xl px-4 pb-2.5">
            <StepRail current={current} />
          </div>
        )}
      </header>

      <main className={`mx-auto max-w-5xl px-4 pt-5 ${completed && !isLanding ? 'pb-28 md:pb-16' : 'pb-16'}`}>
        {children}
      </main>

      {completed && !isLanding && <BottomBar current={current} />}
      <ChangeToast />
    </div>
  )
}
