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

/** Тема оформления: по системе, светлая, тёмная. Переключается по кругу. */
export function ThemeToggle() {
  const { theme, setTheme } = useApp()
  const L = useL()
  const icon: Record<ThemeMode, string> = { system: '🖥', light: '☀', dark: '☾' }
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
      <span aria-hidden>{icon[theme]}</span>
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
      className={`inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-700 ${className}`}
    >
      <span aria-hidden>📱</span>
      {L('Приложение — скоро', 'Қосымша — жақында')}
    </span>
  )
}
