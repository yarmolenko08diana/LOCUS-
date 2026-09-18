import { useApp } from '../store/app'
import { useL } from '../i18n/LangContext'
import type { Lang, ThemeMode } from '../types'

/** Переключатель языка интерфейса: казахский и русский. */
export function LangToggle() {
  const { lang, setLang } = useApp()
  const L = useL()
  const options: { id: Lang; label: string }[] = [
    { id: 'kk', label: 'ҚАЗ' },
    { id: 'ru', label: 'РУС' },
  ]
  return (
    <div
      role="group"
      aria-label={L('Язык интерфейса', 'Интерфейс тілі')}
      className="flex items-center rounded-lg border border-line bg-surface p-0.5"
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => setLang(o.id)}
          aria-pressed={lang === o.id}
          className={`min-h-[2rem] rounded-md px-2 text-[11px] font-bold tracking-wide transition-colors ${
            lang === o.id ? 'bg-brand-600 text-white' : 'text-ink-muted hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

const THEME_ORDER: ThemeMode[] = ['system', 'light', 'dark']

/**
 * Иконка темы рисуется контуром, а не эмодзи: эмодзи монитора и телефона
 * подгружаются системным шрифтом и на секунду мелькали при переключении.
 */
function ThemeIcon({ mode }: { mode: ThemeMode }) {
  return (
    <svg viewBox="0 0 20 20" className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      {mode === 'dark' ? (
        <path d="M16 12.4A6.6 6.6 0 0 1 7.6 4a6.8 6.8 0 1 0 8.4 8.4Z" />
      ) : mode === 'light' ? (
        <>
          <circle cx="10" cy="10" r="3.4" />
          <path d="M10 2.6v1.7M10 15.7v1.7M2.6 10h1.7M15.7 10h1.7M4.8 4.8l1.2 1.2M14 14l1.2 1.2M15.2 4.8 14 6M6 14l-1.2 1.2" />
        </>
      ) : (
        <>
          <circle cx="10" cy="10" r="6.6" />
          <path d="M10 3.4a6.6 6.6 0 0 1 0 13.2Z" fill="currentColor" stroke="none" />
        </>
      )}
    </svg>
  )
}

/** Тема оформления: по системе, светлая, тёмная. Переключается по кругу. */
export function ThemeToggle() {
  const { theme, setTheme } = useApp()
  const L = useL()
  const name: Record<ThemeMode, string> = {
    system: L('как в системе', 'жүйедегідей'),
    light: L('светлая', 'ашық'),
    dark: L('тёмная', 'қою'),
  }
  const next = THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length]
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      title={`${L('Тема', 'Тақырып')}: ${name[theme]}`}
      aria-label={`${L('Тема оформления', 'Безендіру тақырыбы')}: ${name[theme]}. ${L('Переключить на', 'Ауыстыру')}: ${name[next]}`}
      className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-surface text-[14px] text-ink-soft transition-colors hover:border-brand-300 hover:text-brand-700"
    >
      <ThemeIcon mode={theme} />
    </button>
  )
}

/**
 * Плашка «Приложение — Скоро».
 * Прототип работает в браузере; мобильное приложение пока в планах, и об этом
 * лучше сказать честно, чем показывать кнопку, которая никуда не ведёт.
 */
export function AppSoonBadge({ className = '' }: { className?: string }) {
  const L = useL()
  return (
    <span
      className={`inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-700 ${className}`}
    >
      {L('Приложение — скоро', 'Қосымша — жақында')}
    </span>
  )
}
