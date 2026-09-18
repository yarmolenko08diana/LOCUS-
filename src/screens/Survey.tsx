import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Chip, DemoNote, Meter } from '../components/ui'
import { useApp } from '../store/app'
import {
  BUDGETS, COUNTRIES, ENGLISH_LEVELS, EXAMS, FIELDS, LANGUAGES, PRIORITIES, STAGES, SUBJECTS,
} from '../data/taxonomy'
import type { ExamId, Profile } from '../types'

interface StepDef {
  id: string
  title: string
  hint: string
  /** Можно ли идти дальше. */
  valid: (p: Profile) => boolean
  error?: string
}

const STEP_DEFS: StepDef[] = [
  { id: 'about', title: 'Расскажи о себе', hint: 'Этап учёбы задаёт, сколько времени осталось до подачи.', valid: () => true },
  {
    id: 'fields',
    title: 'Что тебе интересно?',
    hint: 'Выбери до трёх направлений. Первое выбранное считается главным.',
    valid: (p) => p.fields.length > 0,
    error: 'Выбери хотя бы одно направление',
  },
  { id: 'study', title: 'Как учишься сейчас?', hint: 'Средний балл и сильные предметы влияют на проходимость.', valid: () => true },
  {
    id: 'language',
    title: 'Языки',
    hint: 'На каких языках тебе подходит учиться.',
    valid: (p) => p.languages.length > 0,
    error: 'Отметь хотя бы один язык',
  },
  { id: 'exams', title: 'Экзамены', hint: 'Что уже сдано и что планируешь сдавать.', valid: () => true },
  {
    id: 'geo',
    title: 'География',
    hint: 'Куда в принципе есть смысл смотреть.',
    valid: (p) => p.countries.length > 0,
    error: 'Выбери хотя бы одну страну',
  },
  {
    id: 'budget',
    title: 'Бюджет и приоритеты',
    hint: 'Последний шаг: что важнее всего при выборе.',
    valid: (p) => p.priorities.length > 0,
    error: 'Отметь хотя бы один приоритет',
  },
]

function toggle<T>(list: T[], value: T, max?: number): T[] {
  if (list.includes(value)) return list.filter((x) => x !== value)
  if (max && list.length >= max) return [...list.slice(1), value]
  return [...list, value]
}

function NumberField({
  label, hint, value, onChange, min, max, step = 1, placeholder,
}: {
  label: string
  hint: string
  value: number | undefined
  onChange: (v: number | undefined) => void
  min: number
  max: number
  step?: number
  placeholder: string
}) {
  return (
    <label className="block">
      <span className="text-[15px] font-semibold">{label}</span>
      <span className="mt-0.5 block text-xs text-ink-muted">{hint}</span>
      <input
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => {
          const raw = e.target.value
          if (raw === '') return onChange(undefined)
          const n = Number(raw)
          if (Number.isNaN(n)) return
          onChange(Math.max(min, Math.min(max, n)))
        }}
        className="mt-2 h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-[15px] font-semibold tabular-nums transition-colors placeholder:font-normal placeholder:text-ink-muted focus:border-brand-400"
      />
    </label>
  )
}

export function Survey() {
  const { profile, completed, completeSurvey, setProfile } = useApp()
  const navigate = useNavigate()
  const [draft, setDraft] = useState<Profile>(profile)
  const [index, setIndex] = useState(0)
  const [touched, setTouched] = useState(false)

  const step = STEP_DEFS[index]
  const isLast = index === STEP_DEFS.length - 1
  const valid = step.valid(draft)
  const progress = Math.round(((index + (valid ? 1 : 0)) / STEP_DEFS.length) * 100)

  const patch = (p: Partial<Profile>) => { setDraft((d) => ({ ...d, ...p })); setTouched(false) }

  const currentYear = new Date().getFullYear()
  const years = useMemo(() => [currentYear, currentYear + 1, currentYear + 2, currentYear + 3], [currentYear])

  function goNext() {
    if (!valid) { setTouched(true); return }
    if (!isLast) { setIndex((i) => i + 1); return }
    if (completed) {
      // Профиль уже был: показываем, что именно изменилось в подборе.
      setProfile(draft)
      navigate('/matches')
    } else {
      completeSurvey(draft)
      navigate('/diagnosis')
    }
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-up pb-8">
      <div className="mb-6">
        <div className="mb-2 flex items-baseline justify-between">
          <p className="label">Шаг {index + 1} из {STEP_DEFS.length}</p>
          <p className="text-xs font-semibold tabular-nums text-ink-muted">{progress}%</p>
        </div>
        <Meter value={progress} />
      </div>

      <h1 className="text-[26px] font-extrabold leading-tight tracking-[-0.02em] sm:text-3xl">{step.title}</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{step.hint}</p>

      <div className="mt-6 space-y-6">
        {step.id === 'about' && (
          <>
            <label className="block">
              <span className="text-[15px] font-semibold">Как к тебе обращаться?</span>
              <span className="mt-0.5 block text-xs text-ink-muted">Необязательно. Имя никуда не отправляется.</span>
              <input
                type="text"
                value={draft.name}
                placeholder="Имя"
                onChange={(e) => patch({ name: e.target.value })}
                className="mt-2 h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-[15px] transition-colors placeholder:text-ink-muted focus:border-brand-400"
              />
            </label>

            <fieldset>
              <legend className="text-[15px] font-semibold">На каком ты этапе?</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {STAGES.map((s) => (
                  <Chip key={s.id} active={draft.stage === s.id} hint={s.hint} onClick={() => patch({ stage: s.id })}>
                    {s.label}
                  </Chip>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-[15px] font-semibold">Год поступления</legend>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {years.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => patch({ intakeYear: y })}
                    className={`h-11 rounded-xl border text-[15px] font-bold tabular-nums transition-colors ${
                      draft.intakeYear === y
                        ? 'border-brand-500 bg-brand-50 text-brand-900'
                        : 'border-line bg-surface text-ink-soft hover:border-brand-300'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </fieldset>
          </>
        )}

        {step.id === 'fields' && (
          <div className="grid gap-2 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <Chip
                key={f.id}
                active={draft.fields.includes(f.id)}
                hint={draft.fields[0] === f.id ? 'главное направление' : f.hint}
                onClick={() => patch({ fields: toggle(draft.fields, f.id, 3) })}
              >
                {f.emoji} {f.label}
              </Chip>
            ))}
          </div>
        )}

        {step.id === 'study' && (
          <>
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-[15px] font-semibold">Средний балл</span>
                <span className="text-2xl font-extrabold tabular-nums text-brand-600">{draft.gpa.toFixed(1)}</span>
              </div>
              <span className="mt-0.5 block text-xs text-ink-muted">По пятибалльной шкале, примерно.</span>
              <input
                type="range"
                min={3}
                max={5}
                step={0.1}
                value={draft.gpa}
                onChange={(e) => patch({ gpa: Number(e.target.value) })}
                className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-line accent-brand-600"
              />
              <div className="mt-1 flex justify-between text-xs text-ink-muted">
                <span>3.0</span><span>4.0</span><span>5.0</span>
              </div>
            </div>

            <fieldset>
              <legend className="text-[15px] font-semibold">Сильные предметы</legend>
              <span className="mt-0.5 block text-xs text-ink-muted">Отметь те, где стабильно хорошо.</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {SUBJECTS.map((s) => {
                  const active = draft.strongSubjects.includes(s)
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => patch({ strongSubjects: toggle(draft.strongSubjects, s) })}
                      aria-pressed={active}
                      className={`h-10 rounded-full border px-3.5 text-[14px] font-semibold transition-colors ${
                        active
                          ? 'border-brand-500 bg-brand-50 text-brand-900'
                          : 'border-line bg-surface text-ink-soft hover:border-brand-300'
                      }`}
                    >
                      {s}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          </>
        )}

        {step.id === 'language' && (
          <>
            <fieldset>
              <legend className="text-[15px] font-semibold">Языки обучения, которые тебе подходят</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {LANGUAGES.map((l) => (
                  <Chip
                    key={l.code}
                    active={draft.languages.includes(l.code)}
                    onClick={() => patch({ languages: toggle(draft.languages, l.code) })}
                  >
                    {l.label}
                  </Chip>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-[15px] font-semibold">Уровень английского</legend>
              <span className="mt-0.5 block text-xs text-ink-muted">Честная самооценка точнее, чем желаемая.</span>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {ENGLISH_LEVELS.map((e) => (
                  <Chip key={e.id} active={draft.english === e.id} hint={e.hint} onClick={() => patch({ english: e.id })}>
                    {e.label}
                  </Chip>
                ))}
              </div>
            </fieldset>
          </>
        )}

        {step.id === 'exams' && (
          <>
            <fieldset>
              <legend className="text-[15px] font-semibold">Что планируешь сдавать</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {EXAMS.map((e) => (
                  <Chip
                    key={e.id}
                    active={draft.exams.planned.includes(e.id)}
                    hint={e.hint}
                    onClick={() =>
                      patch({ exams: { ...draft.exams, planned: toggle<ExamId>(draft.exams.planned, e.id) } })
                    }
                  >
                    {e.label}
                  </Chip>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-3">
              <NumberField
                label="ЕНТ" hint="0–140, если уже есть" placeholder="нет"
                min={0} max={140} value={draft.exams.ent}
                onChange={(v) => patch({ exams: { ...draft.exams, ent: v } })}
              />
              <NumberField
                label="IELTS" hint="4.0–9.0" placeholder="нет"
                min={4} max={9} step={0.5} value={draft.exams.ielts}
                onChange={(v) => patch({ exams: { ...draft.exams, ielts: v } })}
              />
              <NumberField
                label="SAT" hint="400–1600" placeholder="нет"
                min={400} max={1600} step={10} value={draft.exams.sat}
                onChange={(v) => patch({ exams: { ...draft.exams, sat: v } })}
              />
            </div>
            <DemoNote>
              Если баллов пока нет — ничего не заполняй. Оценка шансов станет осторожнее,
              и это честнее, чем подставлять цифры.
            </DemoNote>
          </>
        )}

        {step.id === 'geo' && (
          <>
            <div className="grid gap-2 sm:grid-cols-2">
              {COUNTRIES.map((c) => (
                <Chip
                  key={c.code}
                  active={draft.countries.includes(c.code)}
                  hint={c.note}
                  onClick={() => patch({ countries: toggle(draft.countries, c.code) })}
                >
                  {c.flag} {c.label}
                </Chip>
              ))}
            </div>
            <Card className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="text-[15px] font-semibold">Готовность к переезду в другую страну</p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  Если да, в подбор попадут и страны, которые не отмечены выше.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={draft.relocation}
                onClick={() => patch({ relocation: !draft.relocation })}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                  draft.relocation ? 'bg-brand-600' : 'bg-line'
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                    draft.relocation ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </Card>
          </>
        )}

        {step.id === 'budget' && (
          <>
            <fieldset>
              <legend className="text-[15px] font-semibold">Бюджет на обучение</legend>
              <span className="mt-0.5 block text-xs text-ink-muted">Только плата за обучение, без проживания.</span>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {BUDGETS.map((b) => (
                  <Chip key={b.id} active={draft.budget === b.id} hint={b.hint} onClick={() => patch({ budget: b.id })}>
                    {b.label}
                  </Chip>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-[15px] font-semibold">Что для тебя важнее всего</legend>
              <span className="mt-0.5 block text-xs text-ink-muted">Можно выбрать несколько.</span>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {PRIORITIES.map((p) => (
                  <Chip
                    key={p.id}
                    active={draft.priorities.includes(p.id)}
                    hint={p.hint}
                    onClick={() => patch({ priorities: toggle(draft.priorities, p.id) })}
                  >
                    {p.label}
                  </Chip>
                ))}
              </div>
            </fieldset>
          </>
        )}
      </div>

      {touched && !valid && step.error && (
        <p role="alert" className="mt-4 rounded-xl border border-coral-100 bg-coral-50 px-3.5 py-2.5 text-sm font-semibold text-coral-700">
          {step.error}
        </p>
      )}

      <div className="safe-bottom sticky bottom-0 -mx-4 mt-8 border-t border-line bg-paper/95 px-4 pt-3 backdrop-blur">
        <div className="flex gap-3">
          {index > 0 ? (
            <Button variant="secondary" size="lg" onClick={() => setIndex((i) => i - 1)}>
              Назад
            </Button>
          ) : (
            <Button variant="secondary" size="lg" onClick={() => navigate('/')}>
              На главную
            </Button>
          )}
          <Button size="lg" full onClick={goNext}>
            {isLast ? (completed ? 'Пересчитать маршрут' : 'Показать результат') : 'Дальше'}
            <span aria-hidden>→</span>
          </Button>
        </div>
        {completed && !isLast && (
          <button
            type="button"
            onClick={() => { setProfile(draft); navigate('/matches') }}
            className="mt-2 w-full py-2 text-[13px] font-semibold text-ink-muted hover:text-brand-700"
          >
            Сохранить изменения и вернуться к подбору
          </button>
        )}
      </div>
    </div>
  )
}
