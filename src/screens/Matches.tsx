import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, Card, DemoNote, Empty } from '../components/ui'
import { ProgramCard } from '../components/ProgramCard'
import { useApp } from '../store/app'
import { BUDGETS, COUNTRIES, FIELDS } from '../data/taxonomy'
import { countOf } from '../lib/text'
import { explainEmpty } from '../engine/diagnoseEmpty'
import type { BudgetTier, CountryCode, FieldId } from '../types'

type Sort = 'match' | 'cost' | 'chance'

const SORTS: { id: Sort; label: string }[] = [
  { id: 'match', label: 'По совпадению' },
  { id: 'cost', label: 'По стоимости' },
  { id: 'chance', label: 'По шансам' },
]

const CHANCE_ORDER = { high: 0, medium: 1, unknown: 2, low: 3 }

/** Быстрая правка ключевых ответов прямо на экране подбора. */
function QuickTune() {
  const { profile, setProfile } = useApp()
  const [open, setOpen] = useState(false)

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-paper"
      >
        <span className="min-w-0">
          <span className="block text-[15px] font-bold">Поменять условия и увидеть разницу</span>
          <span className="mt-0.5 block text-[13px] text-ink-muted">
            Бюджет, страны и главное направление — подбор пересчитается сразу
          </span>
        </span>
        <span aria-hidden className={`shrink-0 text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="animate-fade-up space-y-5 border-t border-line px-5 py-5">
          <div>
            <p className="label mb-2">Бюджет на обучение</p>
            <div className="flex flex-wrap gap-2">
              {BUDGETS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setProfile({ budget: b.id as BudgetTier })}
                  className={`h-9 rounded-full border px-3 text-[13px] font-semibold transition-colors ${
                    profile.budget === b.id
                      ? 'border-brand-500 bg-brand-50 text-brand-900'
                      : 'border-line bg-surface text-ink-soft hover:border-brand-300'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="label mb-2">Страны</p>
            <div className="flex flex-wrap gap-2">
              {COUNTRIES.map((c) => {
                const active = profile.countries.includes(c.code)
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() =>
                      setProfile({
                        countries: active
                          ? profile.countries.filter((x) => x !== c.code)
                          : [...profile.countries, c.code as CountryCode],
                      })
                    }
                    className={`h-9 rounded-full border px-3 text-[13px] font-semibold transition-colors ${
                      active
                        ? 'border-brand-500 bg-brand-50 text-brand-900'
                        : 'border-line bg-surface text-ink-soft hover:border-brand-300'
                    }`}
                  >
                    {c.flag} {c.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className="label mb-2">Главное направление</p>
            <div className="flex flex-wrap gap-2">
              {FIELDS.map((f) => {
                const active = profile.fields[0] === f.id
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() =>
                      setProfile({
                        fields: [f.id as FieldId, ...profile.fields.filter((x) => x !== f.id)].slice(0, 3),
                      })
                    }
                    className={`h-9 rounded-full border px-3 text-[13px] font-semibold transition-colors ${
                      active
                        ? 'border-brand-500 bg-brand-50 text-brand-900'
                        : 'border-line bg-surface text-ink-soft hover:border-brand-300'
                    }`}
                  >
                    {f.emoji} {f.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

/**
 * Пустая выдача — это тоже ответ. Показываем, какой ответ анкеты отсекает
 * все варианты и сколько появится, если его ослабить, вместо общего
 * «ничего не найдено».
 */
function EmptyResult({ onResetFilter }: { onResetFilter?: () => void }) {
  const { profile, setProfile } = useApp()
  const { cause, relaxations } = useMemo(() => explainEmpty(profile), [profile])

  return (
    <Card className="p-6">
      <div aria-hidden className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-sun-50 text-xl">🧭</div>
      <h2 className="text-[20px] font-extrabold leading-snug">Под эти условия ничего не нашлось</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{cause}</p>

      {onResetFilter && (
        <p className="mt-3 text-[14px] text-ink-soft">
          Сейчас включён фильтр «только в бюджет» —{' '}
          <button type="button" onClick={onResetFilter} className="font-bold text-brand-600 underline underline-offset-2">
            снять его
          </button>
          .
        </p>
      )}

      {relaxations.length > 0 && (
        <ul className="mt-5 space-y-2.5">
          {relaxations.map((r) => (
            <li key={r.label}>
              <button
                type="button"
                onClick={() => setProfile(r.patch)}
                className="flex w-full items-center justify-between gap-4 rounded-xl border border-line bg-surface px-4 py-3 text-left transition-colors hover:border-brand-300 hover:bg-brand-50/40"
              >
                <span className="text-[15px] font-bold">{r.label}</span>
                <span className="shrink-0 text-[13px] font-bold tabular-nums text-mint-600">
                  +{countOf(r.gain, 'вариант', 'варианта', 'вариантов')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Button variant="secondary" className="mt-5" onClick={() => (window.location.hash = '#/survey')}>
        Вернуться в анкету
      </Button>
    </Card>
  )
}

export function Matches() {
  const {
    recommendations, completed, compare, toggleCompare, saved, toggleSaved, profile,
  } = useApp()
  const navigate = useNavigate()
  const [sort, setSort] = useState<Sort>('match')
  const [onlyAffordable, setOnlyAffordable] = useState(false)
  const [limit, setLimit] = useState(6)

  const list = useMemo(() => {
    let items = recommendations.filter((r) => r.score >= 40)
    if (onlyAffordable) items = items.filter((r) => r.affordable)
    if (sort === 'cost') items = [...items].sort((a, b) => a.yearlyCostUsd - b.yearlyCostUsd)
    if (sort === 'chance') {
      items = [...items].sort(
        (a, b) => CHANCE_ORDER[a.chance.level] - CHANCE_ORDER[b.chance.level] || b.score - a.score,
      )
    }
    return items
  }, [recommendations, sort, onlyAffordable])

  if (!completed) {
    return (
      <Empty
        title="Рекомендации появятся после анкеты"
        description="Подбор строится из твоего профиля: направления, экзаменов, бюджета и стран."
        action={<Button onClick={() => navigate('/survey')}>Заполнить анкету</Button>}
      />
    )
  }

  return (
    <div className="animate-fade-up space-y-6">
      <header>
        <p className="label mb-2">Шаг 3 · Рекомендации</p>
        <h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.02em] sm:text-4xl">
          {countOf(list.length, 'подходящая программа', 'подходящие программы', 'подходящих программ')}
        </h1>
        <p className="mt-2 max-w-2xl text-[16px] leading-relaxed text-ink-soft">
          Отсортированы по совпадению с твоим профилем. У каждой карточки написано,
          что именно совпало и что стоит учесть.
        </p>
      </header>

      <QuickTune />

      <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1">
        <div className="flex shrink-0 rounded-xl border border-line bg-surface p-1">
          {SORTS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSort(s.id)}
              className={`h-8 whitespace-nowrap rounded-lg px-3 text-[13px] font-bold transition-colors ${
                sort === s.id ? 'bg-brand-600 text-white' : 'text-ink-soft hover:text-brand-700'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setOnlyAffordable((v) => !v)}
          aria-pressed={onlyAffordable}
          className={`h-10 shrink-0 whitespace-nowrap rounded-xl border px-3.5 text-[13px] font-bold transition-colors ${
            onlyAffordable
              ? 'border-brand-500 bg-brand-50 text-brand-900'
              : 'border-line bg-surface text-ink-soft hover:border-brand-300'
          }`}
        >
          Только в бюджет
        </button>
        {compare.length > 0 && (
          <Button variant="secondary" size="sm" onClick={() => navigate('/compare')} className="ml-auto shrink-0 whitespace-nowrap">
            Сравнить · {compare.length}
          </Button>
        )}
      </div>

      {list.length === 0 ? (
        <EmptyResult onResetFilter={onlyAffordable ? () => setOnlyAffordable(false) : undefined} />
      ) : (
        <>
          {list.length < 3 && (
            <p className="rounded-xl border border-sun-100 bg-sun-50 px-4 py-3 text-[14px] leading-relaxed text-sun-700">
              Вариантов меньше трёх. Это честный результат по текущим условиям: чтобы список
              вырос, добавь страну, подними бюджет или включи готовность к переезду в анкете.
            </p>
          )}

          <div className="space-y-4">
            {list.slice(0, limit).map((rec, i) => (
              <ProgramCard
                key={rec.program.id}
                rec={rec}
                rank={sort === 'match' ? i + 1 : undefined}
                inCompare={compare.includes(rec.program.id)}
                onCompare={() => toggleCompare(rec.program.id)}
                saved={saved.includes(rec.program.id)}
                onSave={() => toggleSaved(rec.program.id)}
              />
            ))}
          </div>

          {limit < list.length && (
            <Button variant="secondary" full size="lg" onClick={() => setLimit((l) => l + 6)}>
              Показать ещё {Math.min(6, list.length - limit)}
            </Button>
          )}
        </>
      )}

      {list.length > 0 && (
        <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="label mb-1.5">Что дальше</p>
            <p className="text-[17px] font-bold leading-snug">
              {compare.length >= 2
                ? 'Сравни отмеченные варианты по важным для тебя параметрам'
                : 'Отметь два варианта кнопкой «Сравнить»'}
            </p>
            <p className="mt-1 text-[14px] text-ink-soft">
              Дальше соберём план подготовки под твой список.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="secondary" size="lg" onClick={() => navigate('/compare')}>Сравнение</Button>
            <Button size="lg" onClick={() => navigate('/roadmap')}>План <span aria-hidden>→</span></Button>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="neutral">
          Профиль: {countOf(profile.fields.length, 'направление', 'направления', 'направлений')}
        </Badge>
        <Badge tone="neutral">{countOf(profile.countries.length, 'страна', 'страны', 'стран')}</Badge>
        {saved.length > 0 && <Badge tone="sun">★ {saved.length} в избранном</Badge>}
      </div>

      <DemoNote />
    </div>
  )
}
