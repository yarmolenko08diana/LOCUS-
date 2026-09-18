import { Link } from 'react-router-dom'
import type { ChanceLevel, Recommendation } from '../types'
import { Badge, Card, Meter } from './ui'
import { COUNTRY_FLAG, COUNTRY_LABEL } from '../data/taxonomy'
import { countryAngle } from '../data/countryNotes'
import { scoreLabel } from '../engine/match'
import { useL } from '../i18n/LangContext'
import { L } from '../i18n/lang'

export const CHANCE_META: Record<
  ChanceLevel,
  { label: string; labelKk: string; tone: 'mint' | 'sun' | 'coral' | 'neutral' }
> = {
  high: { label: 'Шансы высокие', labelKk: 'Мүмкіндік жоғары', tone: 'mint' },
  medium: { label: 'Шансы средние', labelKk: 'Мүмкіндік орташа', tone: 'sun' },
  low: { label: 'Шансы низкие', labelKk: 'Мүмкіндік төмен', tone: 'coral' },
  unknown: { label: 'Шансы не оценены', labelKk: 'Мүмкіндік бағаланбаған', tone: 'neutral' },
}

/** Подпись уровня шансов на текущем языке. */
export function chanceLabel(level: ChanceLevel): string {
  return L(CHANCE_META[level].label, CHANCE_META[level].labelKk)
}

export function money(n: number): string {
  return '$' + Math.round(n).toLocaleString('ru-RU')
}

export function tuitionLabel(rec: Recommendation): string {
  const [lo, hi] = rec.program.tuitionUsd
  if (lo === 0 && hi === 0) return L('Бесплатно по гранту вуза', 'ЖОО гранты бойынша тегін')
  if (lo === hi) return `${money(lo)} ${L('в год', 'жылына')}`
  return `${money(lo)} – ${money(hi)} ${L('в год', 'жылына')}`
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
  const Lc = useL()
  const chance = CHANCE_META[rec.chance.level]
  // Строка «зачем эта страна» читается на языке интерфейса, поэтому берётся
  // при отрисовке, а не один раз на уровне модуля.
  const angle = countryAngle(p.country)

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
            {angle && <p className="mt-1 text-[12.5px] font-semibold text-mint-600">{angle}</p>}
            <h2 className="mt-2 text-[19px] font-extrabold leading-snug tracking-[-0.01em]">
              <Link to={`/program/${p.id}`} className="-my-1 inline-block py-1 hover:text-brand-700">
                {p.program}
              </Link>
            </h2>
            <p className="mt-0.5 text-[14px] font-semibold text-ink-soft">{p.university}</p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[28px] font-extrabold leading-none tabular-nums text-brand-600">{rec.score}%</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
              {Lc('совпадение', 'сәйкестік')}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone="brand">{scoreLabel(rec.score)}</Badge>
          <Badge tone={chance.tone}>{Lc(chance.label, chance.labelKk)}</Badge>
          {p.grant.available && <Badge tone="mint">{Lc('Есть грант', 'Грант бар')}</Badge>}
          {p.requirements.csca !== undefined && (
            <Badge tone="sun">{Lc('CSCA', 'CSCA')} ≈ {p.requirements.csca}</Badge>
          )}
          {!rec.affordable && !p.grant.available && (
            <Badge tone="coral">{Lc('Выше бюджета', 'Бюджеттен жоғары')}</Badge>
          )}
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
            <span className="font-bold">{Lc('Обрати внимание', 'Назар аудар')}. </span>
            {rec.watchouts[0].text}
          </p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-3">
          <div>
            <p className="label mb-1">{Lc('Обучение', 'Оқу')}</p>
            <p className="text-[14px] font-bold leading-tight">{tuitionLabel(rec)}</p>
          </div>
          <div>
            <p className="label mb-1">{Lc('Год с жильём', 'Тұрғын үймен бір жыл')}</p>
            <p className="text-[14px] font-bold leading-tight tabular-nums">≈ {money(rec.yearlyCostUsd)}</p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="label mb-1">{Lc('Язык и срок', 'Тіл және мерзім')}</p>
            <p className="text-[14px] font-bold leading-tight">
              {p.languages.map((l) => l.toUpperCase()).join('/')} · {p.durationYears} {Lc('года', 'жыл')}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <Meter
            value={rec.score}
            tone="brand"
            label={Lc('Совпадение с профилем', 'Профильмен сәйкестік')}
            sublabel={Lc(`${rec.score} из 100`, `100-ден ${rec.score}`)}
          />
        </div>
      </div>

      <div className="flex items-stretch divide-x divide-line border-t border-line">
        <Link
          to={`/program/${p.id}`}
          className="flex-1 py-3 text-center text-[14px] font-bold text-brand-700 transition-colors hover:bg-brand-50"
        >
          {Lc('Разбор', 'Талдау')}
        </Link>
        <button
          type="button"
          onClick={onCompare}
          aria-pressed={inCompare}
          className={`flex-1 py-3 text-center text-[14px] font-bold transition-colors ${
            inCompare ? 'bg-brand-50 text-brand-700' : 'text-ink-soft hover:bg-paper'
          }`}
        >
          {inCompare ? Lc('В сравнении ✓', 'Салыстыруда ✓') : Lc('Сравнить', 'Салыстыру')}
        </button>
        <button
          type="button"
          onClick={onSave}
          aria-pressed={saved}
          aria-label={saved ? Lc('Убрать из избранного', 'Таңдаулыдан алу') : Lc('Сохранить', 'Сақтау')}
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
