import { Link } from 'react-router-dom'
import type { ChanceLevel, Recommendation } from '../types'
import { Badge, Card, Meter } from './ui'
import { COUNTRY_FLAG, COUNTRY_LABEL } from '../data/taxonomy'
import { scoreLabel } from '../engine/match'

export const CHANCE_META: Record<ChanceLevel, { label: string; tone: 'mint' | 'sun' | 'coral' | 'neutral' }> = {
  high: { label: 'Шансы высокие', tone: 'mint' },
  medium: { label: 'Шансы средние', tone: 'sun' },
  low: { label: 'Шансы низкие', tone: 'coral' },
  unknown: { label: 'Шансы не оценены', tone: 'neutral' },
}

export function money(n: number): string {
  return '$' + Math.round(n).toLocaleString('ru-RU')
}

export function tuitionLabel(rec: Recommendation): string {
  const [lo, hi] = rec.program.tuitionUsd
  if (lo === 0 && hi === 0) return 'Бесплатно по гранту вуза'
  if (lo === hi) return `${money(lo)} в год`
  return `${money(lo)} – ${money(hi)} в год`
}

export function ProgramCard({
  rec, rank, inCompare, onCompare, saved, onSave,
}: {
  rec: Recommendation
  rank?: number
  inCompare: boolean
  onCompare: () => void
  saved: boolean
  onSave: () => void
}) {
  const { program: p } = rec
  const chance = CHANCE_META[rec.chance.level]

  return (
    <Card as="article" className="overflow-hidden transition-shadow hover:shadow-lift">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {rank !== undefined && (
                <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-[12px] font-bold text-white">
                  {rank}
                </span>
              )}
              <span className="text-[13px] font-semibold text-ink-muted">
                {COUNTRY_FLAG[p.country]} {COUNTRY_LABEL[p.country]}, {p.city}
              </span>
            </div>
            <h2 className="mt-2 text-[19px] font-extrabold leading-snug tracking-[-0.01em]">
              <Link to={`/program/${p.id}`} className="-my-1 inline-block py-1 hover:text-brand-700">
                {p.program}
              </Link>
            </h2>
            <p className="mt-0.5 text-[14px] font-semibold text-ink-soft">{p.university}</p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[28px] font-extrabold leading-none tabular-nums text-brand-600">{rec.score}%</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">совпадение</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone="brand">{scoreLabel(rec.score)}</Badge>
          <Badge tone={chance.tone}>{chance.label}</Badge>
          {p.grant.available && <Badge tone="mint">Есть грант</Badge>}
          {!rec.affordable && !p.grant.available && <Badge tone="coral">Выше бюджета</Badge>}
        </div>

        <ul className="mt-4 space-y-2.5">
          {rec.reasons.slice(0, 3).map((r, i) => (
            <li key={i} className="flex gap-2.5">
              <span
                aria-hidden
                className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${
                  r.tone === 'good' ? 'bg-mint-500' : 'bg-sun-500'
                }`}
              />
              <p className="text-[14px] leading-relaxed text-ink-soft">
                <span className="font-bold text-ink">{r.tag}. </span>
                {r.text}
              </p>
            </li>
          ))}
        </ul>

        {rec.watchouts.length > 0 && (
          <p className="mt-3 rounded-xl border border-sun-100 bg-sun-50 px-3 py-2.5 text-[13px] leading-relaxed text-sun-700">
            <span className="font-bold">Обрати внимание. </span>
            {rec.watchouts[0].text}
          </p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-3">
          <div>
            <p className="label mb-1">Обучение</p>
            <p className="text-[14px] font-bold leading-tight">{tuitionLabel(rec)}</p>
          </div>
          <div>
            <p className="label mb-1">Год с жильём</p>
            <p className="text-[14px] font-bold leading-tight tabular-nums">≈ {money(rec.yearlyCostUsd)}</p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="label mb-1">Язык и срок</p>
            <p className="text-[14px] font-bold leading-tight">
              {p.languages.map((l) => l.toUpperCase()).join('/')} · {p.durationYears} года
            </p>
          </div>
        </div>

        <div className="mt-4">
          <Meter value={rec.score} tone="brand" label="Совпадение с профилем" sublabel={`${rec.score} из 100`} />
        </div>
      </div>

      <div className="flex items-stretch divide-x divide-line border-t border-line">
        <Link
          to={`/program/${p.id}`}
          className="flex-1 py-3 text-center text-[14px] font-bold text-brand-700 transition-colors hover:bg-brand-50"
        >
          Разбор
        </Link>
        <button
          type="button"
          onClick={onCompare}
          aria-pressed={inCompare}
          className={`flex-1 py-3 text-center text-[14px] font-bold transition-colors ${
            inCompare ? 'bg-brand-50 text-brand-700' : 'text-ink-soft hover:bg-paper'
          }`}
        >
          {inCompare ? 'В сравнении ✓' : 'Сравнить'}
        </button>
        <button
          type="button"
          onClick={onSave}
          aria-pressed={saved}
          aria-label={saved ? 'Убрать из избранного' : 'Сохранить'}
          className={`w-14 shrink-0 text-center text-[15px] transition-colors ${
            saved ? 'bg-sun-50 text-sun-600' : 'text-ink-muted hover:bg-paper'
          }`}
        >
          {saved ? '★' : '☆'}
        </button>
      </div>
    </Card>
  )
}
