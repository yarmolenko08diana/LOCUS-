import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge, Button, Card, DemoNote, Empty } from '../components/ui'
import { CHANCE_META, money, tuitionLabel } from '../components/ProgramCard'
import { useApp } from '../store/app'
import { COUNTRY_FLAG, COUNTRY_LABEL, LANGUAGE_LABEL, PRIORITY_LABEL } from '../data/taxonomy'
import { countOf } from '../lib/text'
import type { Recommendation } from '../types'

interface Row {
  label: string
  render: (r: Recommendation) => React.ReactNode
  /** Кто выигрывает по этой строке; undefined — сравнение не имеет смысла. */
  best?: (list: Recommendation[]) => string | undefined
}

const ROWS: Row[] = [
  {
    label: 'Совпадение с профилем',
    render: (r) => <span className="text-[19px] font-extrabold tabular-nums text-brand-600">{r.score}%</span>,
    best: (l) => [...l].sort((a, b) => b.score - a.score)[0].program.id,
  },
  {
    label: 'Ориентировочные шансы',
    render: (r) => <Badge tone={CHANCE_META[r.chance.level].tone}>{CHANCE_META[r.chance.level].label}</Badge>,
  },
  { label: 'Страна и город', render: (r) => `${COUNTRY_FLAG[r.program.country]} ${COUNTRY_LABEL[r.program.country]}, ${r.program.city}` },
  {
    label: 'Стоимость обучения',
    render: (r) => tuitionLabel(r),
    best: (l) => [...l].sort((a, b) => a.program.tuitionUsd[0] - b.program.tuitionUsd[0])[0].program.id,
  },
  {
    label: 'Год с проживанием',
    render: (r) => `≈ ${money(r.yearlyCostUsd)}`,
    best: (l) => [...l].sort((a, b) => a.yearlyCostUsd - b.yearlyCostUsd)[0].program.id,
  },
  { label: 'Грант или стипендия', render: (r) => (r.program.grant.available ? r.program.grant.note : 'Не предусмотрено для международных студентов') },
  { label: 'Язык обучения', render: (r) => r.program.languages.map((l) => LANGUAGE_LABEL[l]).join(', ') },
  { label: 'Длительность', render: (r) => `${r.program.durationYears} года` },
  {
    label: 'Что нужно для поступления',
    render: (r) => {
      const req = r.program.requirements
      const parts = [
        req.ent !== undefined ? `ЕНТ от ${req.ent}` : null,
        req.ielts !== undefined ? `IELTS ${req.ielts}` : null,
        req.sat !== undefined ? `SAT ${req.sat}` : null,
        req.gpa !== undefined ? `средний балл ${req.gpa.toFixed(1)}` : null,
        req.portfolio ? 'портфолио' : null,
        req.entranceExam ?? null,
      ].filter(Boolean)
      return parts.length ? parts.join(', ') : 'уточняется на сайте вуза'
    },
  },
  { label: 'Ближайший период подачи', render: (r) => `${r.program.deadlines[0].label}: ${r.program.deadlines[0].window}` },
  {
    label: 'Трудоустройство',
    render: (r) => '★'.repeat(r.program.employability) + '☆'.repeat(5 - r.program.employability),
    best: (l) => [...l].sort((a, b) => b.program.employability - a.program.employability)[0].program.id,
  },
  {
    label: 'Репутация вуза',
    render: (r) => '★'.repeat(r.program.prestige) + '☆'.repeat(5 - r.program.prestige),
    best: (l) => [...l].sort((a, b) => b.program.prestige - a.program.prestige)[0].program.id,
  },
  {
    label: 'Главное «но»',
    render: (r) => (r.watchouts.length ? r.watchouts[0].text : 'Явных препятствий по твоему профилю нет'),
  },
]

/** Короткий вывод: какой вариант ближе к приоритетам пользователя и почему. */
function verdict(list: Recommendation[], priorities: string[]): { winner: Recommendation; text: string } | null {
  if (list.length < 2) return null
  const winner = [...list].sort((a, b) => b.score - a.score)[0]
  const cheapest = [...list].sort((a, b) => a.yearlyCostUsd - b.yearlyCostUsd)[0]
  const safest = [...list].sort(
    (a, b) => ({ high: 0, medium: 1, unknown: 2, low: 3 })[a.chance.level] - ({ high: 0, medium: 1, unknown: 2, low: 3 })[b.chance.level],
  )[0]

  const bits: string[] = [
    `По совокупности критериев ближе всего ${winner.program.universityShort} — ${winner.score}% совпадения.`,
  ]
  if (cheapest.program.id !== winner.program.id) {
    bits.push(`Дешевле выходит ${cheapest.program.universityShort}: около ${money(cheapest.yearlyCostUsd)} за год против ${money(winner.yearlyCostUsd)}.`)
  }
  if (safest.program.id !== winner.program.id && safest.chance.level !== winner.chance.level) {
    bits.push(`Надёжнее по проходимости ${safest.program.universityShort}.`)
  }
  if (priorities.length) {
    bits.push(`Как важное отмечено: ${priorities.join(', ').toLowerCase()} — смотри на эти строки в первую очередь.`)
  }
  return { winner, text: bits.join(' ') }
}

export function Compare() {
  const { recommendations, compare, toggleCompare, completed, profile } = useApp()
  const navigate = useNavigate()

  const list = useMemo(
    () => compare.map((id) => recommendations.find((r) => r.program.id === id)).filter(Boolean) as Recommendation[],
    [compare, recommendations],
  )
  const conclusion = useMemo(
    () => verdict(list, profile.priorities.map((p) => PRIORITY_LABEL[p])),
    [list, profile.priorities],
  )

  if (!completed) {
    return (
      <Empty
        title="Сравнение появится после анкеты"
        description="Сначала нужен профиль, чтобы было что с чем сравнивать."
        action={<Button onClick={() => navigate('/survey')}>Заполнить анкету</Button>}
      />
    )
  }

  if (list.length < 2) {
    const suggestions = recommendations.slice(0, 4)
    return (
      <div className="animate-fade-up space-y-6">
        <header>
          <p className="label mb-2">Шаг 4 · Сравнение</p>
          <h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.02em] sm:text-4xl">
            Выбери минимум два варианта
          </h1>
          <p className="mt-2 max-w-2xl text-[16px] leading-relaxed text-ink-soft">
            {list.length === 1
              ? 'Один вариант уже отмечен. Добавь второй, и мы разложим их по стоимости, требованиям и шансам.'
              : 'Отметь варианты здесь или кнопкой «Сравнить» на карточках в подборе.'}
          </p>
        </header>

        <Card className="divide-y divide-line">
          {suggestions.map((r) => {
            const active = compare.includes(r.program.id)
            return (
              <button
                key={r.program.id}
                type="button"
                onClick={() => toggleCompare(r.program.id)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-paper"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-bold">{r.program.program}</span>
                  <span className="block truncate text-[13px] text-ink-muted">
                    {r.program.university} · {r.score}% совпадения
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-lg border px-3 py-1.5 text-[13px] font-bold ${
                    active ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-line text-ink-soft'
                  }`}
                >
                  {active ? 'Выбрано ✓' : 'Добавить'}
                </span>
              </button>
            )
          })}
        </Card>

        <Button variant="secondary" full size="lg" onClick={() => navigate('/matches')}>
          Вернуться к подбору
        </Button>
      </div>
    )
  }

  return (
    <div className="animate-fade-up space-y-6">
      <header>
        <p className="label mb-2">Шаг 4 · Сравнение</p>
        <h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.02em] sm:text-4xl">
          {countOf(list.length, 'вариант', 'варианта', 'вариантов')} рядом
        </h1>
        <p className="mt-2 max-w-2xl text-[16px] leading-relaxed text-ink-soft">
          Зелёной точкой отмечено, где вариант выигрывает по строке.
        </p>
      </header>

      {conclusion && (
        <Card className="bg-brand-900 p-6 text-white">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-brand-300">Короткий вывод</p>
          <p className="mt-2 text-[16px] leading-relaxed">{conclusion.text}</p>
        </Card>
      )}

      <div className="no-scrollbar -mx-4 overflow-x-auto px-4">
        <table className="w-full min-w-[640px] border-separate border-spacing-0">
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 w-40 bg-paper px-3 pb-3 text-left align-bottom">
                <span className="label">Параметр</span>
              </th>
              {list.map((r) => (
                <th key={r.program.id} scope="col" className="px-3 pb-3 text-left align-bottom">
                  <Link to={`/program/${r.program.id}`} className="block text-[15px] font-extrabold leading-tight hover:text-brand-700">
                    {r.program.universityShort}
                  </Link>
                  <span className="mt-1 block text-[12px] font-medium leading-snug text-ink-muted">{r.program.program}</span>
                  <button
                    type="button"
                    onClick={() => toggleCompare(r.program.id)}
                    className="mt-2 text-[12px] font-bold text-coral-600 hover:underline"
                  >
                    Убрать
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => {
              const bestId = row.best?.(list)
              return (
                <tr key={row.label} className={i % 2 === 0 ? 'bg-surface' : ''}>
                  <th
                    scope="row"
                    className={`sticky left-0 z-10 border-t border-line px-3 py-3 text-left align-top text-[13px] font-semibold text-ink-muted ${
                      i % 2 === 0 ? 'bg-surface' : 'bg-paper'
                    }`}
                  >
                    {row.label}
                  </th>
                  {list.map((r) => (
                    <td key={r.program.id} className="border-t border-line px-3 py-3 align-top text-[14px] leading-relaxed text-ink-soft">
                      <span className="flex items-start gap-1.5">
                        {bestId === r.program.id && (
                          <span aria-label="лучший по этой строке" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-mint-500" />
                        )}
                        <span className="min-w-0">{row.render(r)}</span>
                      </span>
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="label mb-1.5">Что дальше</p>
          <p className="text-[17px] font-bold leading-snug">Собрать план подготовки</p>
          <p className="mt-1 text-[14px] text-ink-soft">
            План строится под требования программ из твоего топа, включая эти.
          </p>
        </div>
        <Button size="lg" onClick={() => navigate('/roadmap')} className="shrink-0">
          К плану <span aria-hidden>→</span>
        </Button>
      </Card>

      <DemoNote />
    </div>
  )
}
