import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useL } from '../i18n/LangContext'

type Tone = 'brand' | 'mint' | 'coral' | 'sun' | 'neutral'

const TONE_SOFT: Record<Tone, string> = {
  brand: 'bg-brand-50 text-brand-700 border-brand-100',
  mint: 'bg-mint-50 text-mint-700 border-mint-100',
  coral: 'bg-coral-50 text-coral-700 border-coral-100',
  sun: 'bg-sun-50 text-sun-700 border-sun-100',
  neutral: 'bg-paper text-ink-soft border-line',
}

export function Badge({
  children, tone = 'neutral', className = '',
}: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${TONE_SOFT[tone]} ${className}`}
    >
      {children}
    </span>
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  full?: boolean
}

const VARIANT = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-700 shadow-card disabled:bg-brand-200',
  secondary: 'bg-surface text-ink border border-line hover:border-brand-300 hover:text-brand-700 disabled:text-ink-muted',
  ghost: 'bg-transparent text-ink-soft hover:bg-brand-50 hover:text-brand-700',
  danger: 'bg-surface text-coral-600 border border-coral-100 hover:bg-coral-50',
}

const SIZE = {
  sm: 'h-9 px-3 text-sm rounded-lg',
  md: 'h-11 px-4 text-[15px] rounded-xl',
  lg: 'h-13 px-6 text-base rounded-xl min-h-[3.25rem]',
}

export function Button({
  variant = 'primary', size = 'md', full, className = '', ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-70 active:scale-[0.985] ${VARIANT[variant]} ${SIZE[size]} ${full ? 'w-full' : ''} ${className}`}
    />
  )
}

export function Card({
  children, className = '', as: As = 'div',
}: { children: ReactNode; className?: string; as?: 'div' | 'section' | 'li' | 'article' }) {
  return <As className={`card ${className}`}>{children}</As>
}

export function Chip({
  active, children, onClick, disabled, hint,
}: {
  active: boolean
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  hint?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`group flex min-h-[3rem] w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all duration-150 active:scale-[0.99] disabled:opacity-40 ${
        active
          ? 'border-brand-500 bg-brand-50 text-brand-900 shadow-[inset_0_0_0_1px_rgba(91,91,230,0.35)]'
          : 'border-line bg-surface text-ink hover:border-brand-300 hover:bg-brand-50/40'
      }`}
    >
      <span className="min-w-0">
        <span className="block truncate text-[15px] font-semibold leading-tight">{children}</span>
        {hint && <span className="mt-0.5 block truncate text-xs text-ink-muted">{hint}</span>}
      </span>
      <span
        aria-hidden
        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors ${
          active ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-paper text-transparent'
        }`}
      >
        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M2.5 6.2 4.8 8.5 9.5 3.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  )
}

export function Meter({
  value, tone = 'brand', label, sublabel,
}: { value: number; tone?: Tone; label?: string; sublabel?: string }) {
  const bar: Record<Tone, string> = {
    brand: 'bg-brand-500',
    mint: 'bg-mint-500',
    coral: 'bg-coral-500',
    sun: 'bg-sun-500',
    neutral: 'bg-ink-muted',
  }
  return (
    <div>
      {(label || sublabel) && (
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          {label && <span className="text-sm font-medium text-ink-soft">{label}</span>}
          {sublabel && <span className="text-xs font-semibold tabular-nums text-ink-muted">{sublabel}</span>}
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-line/70">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-out ${bar[tone]}`}
          style={{ width: `${Math.max(2, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  )
}

export function SectionTitle({
  eyebrow, title, description, action,
}: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="label mb-1.5">{eyebrow}</p>}
        <h2 className="text-xl font-bold leading-tight tracking-[-0.01em] sm:text-2xl">{title}</h2>
        {description && <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function DemoNote({ children, className = '' }: { children?: ReactNode; className?: string }) {
  const L = useL()
  return (
    <p className={`flex items-start gap-1.5 text-xs leading-relaxed text-ink-muted ${className}`}>
      <span aria-hidden className="mt-[1px] shrink-0 text-[13px]">ⓘ</span>
      <span>
        {children ?? L(
          'Демо-данные прототипа. Сверяйте с официальным сайтом вуза.',
          'Прототиптің демо-деректері. ЖОО ресми сайтымен тексеріңіз.',
        )}
      </span>
    </p>
  )
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="min-w-0">
      <p className="label mb-1">{label}</p>
      <p className="truncate text-[17px] font-bold leading-tight">{value}</p>
      {hint && <p className="mt-0.5 truncate text-xs text-ink-muted">{hint}</p>}
    </div>
  )
}

export function Empty({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <Card className="px-6 py-12 text-center">
      <div aria-hidden className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-xl">🧭</div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-ink-soft">{description}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </Card>
  )
}
