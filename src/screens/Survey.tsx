import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, Card, Chip, DemoNote, Meter } from '../components/ui'
import { useApp } from '../store/app'
import { useL } from '../i18n/LangContext'
import {
  ACHIEVEMENT_KIND_EMOJI, achievementAwards, achievementExample, achievementForms,
  achievementKinds, achievementLevels,
  budgets, countries, englishLevels, exams, fields, languages, priorities,
  schoolSystems, stages, subjects, tones,
} from '../data/taxonomy'
import { achievementLabel, summarizeAchievements } from '../engine/achievements'
import { cscaPlan } from '../engine/csca'
import type {
  Achievement, AchievementAward, AchievementForm, AchievementKind, AchievementLevel, ExamId, Profile,
} from '../types'

interface StepDef {
  id: string
  title: string
  titleKk: string
  hint: string
  hintKk: string
  /** Можно ли идти дальше. */
  valid: (p: Profile) => boolean
  error?: string
  errorKk?: string
}

const STEP_DEFS: StepDef[] = [
  {
    id: 'about',
    title: 'Расскажи о себе', titleKk: 'Өзің туралы айт',
    hint: 'Этап учёбы задаёт, сколько времени осталось до подачи.',
    hintKk: 'Оқу кезеңі өтінім беруге қанша уақыт қалғанын анықтайды.',
    valid: () => true,
  },
  {
    id: 'fields',
    title: 'Что тебе интересно?', titleKk: 'Саған не қызық?',
    hint: 'Выбери до трёх направлений. Первое выбранное считается главным.',
    hintKk: 'Үш бағытқа дейін таңда. Бірінші таңдағаның басты болып саналады.',
    valid: (p) => p.fields.length > 0,
    error: 'Выбери хотя бы одно направление',
    errorKk: 'Кемінде бір бағыт таңда',
  },
  {
    id: 'study',
    title: 'Как учишься сейчас?', titleKk: 'Қазір қалай оқып жүрсің?',
    hint: 'Система школы и баллы влияют на то, как считается проходимость.',
    hintKk: 'Мектеп жүйесі мен балдар өту мүмкіндігінің қалай есептелетініне әсер етеді.',
    valid: () => true,
  },
  {
    id: 'language',
    title: 'Языки', titleKk: 'Тілдер',
    hint: 'На каких языках тебе подходит учиться.',
    hintKk: 'Қай тілдерде оқу саған қолайлы.',
    valid: (p) => p.languages.length > 0,
    error: 'Отметь хотя бы один язык',
    errorKk: 'Кемінде бір тілді белгіле',
  },
  {
    id: 'exams',
    title: 'Экзамены', titleKk: 'Емтихандар',
    hint: 'Что уже сдано и что планируешь сдавать.',
    hintKk: 'Не тапсырылды және нені тапсыруды жоспарлайсың.',
    valid: () => true,
  },
  {
    id: 'achievements',
    title: 'Достижения', titleKk: 'Жетістіктер',
    hint: 'Олимпиады, проекты, волонтёрство, хакатоны. Каждое добавленное достижение сразу меняет подбор и маршрут.',
    hintKk: 'Олимпиадалар, жобалар, волонтёрлық, хакатондар. Қосылған әр жетістік таңдау мен маршрутты бірден өзгертеді.',
    valid: () => true,
  },
  {
    id: 'geo',
    title: 'География', titleKk: 'География',
    hint: 'Куда в принципе есть смысл смотреть.',
    hintKk: 'Қай елдерге қарауға болады.',
    valid: (p) => p.countries.length > 0,
    error: 'Выбери хотя бы одну страну',
    errorKk: 'Кемінде бір ел таңда',
  },
  {
    id: 'budget',
    title: 'Бюджет и приоритеты', titleKk: 'Бюджет және басымдықтар',
    hint: 'Последний шаг: что важнее всего при выборе и как с тобой разговаривать.',
    hintKk: 'Соңғы қадам: таңдауда не маңызды және сенімен қалай сөйлесу керек.',
    valid: (p) => p.priorities.length > 0,
    error: 'Отметь хотя бы один приоритет',
    errorKk: 'Кемінде бір басымдықты белгіле',
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

/** Форма добавления достижения: вид, масштаб, результат и название. */
function AchievementForm({ onAdd }: { onAdd: (a: Omit<Achievement, 'id'>) => void }) {
  const L = useL()
  const currentYear = new Date().getFullYear()
  const [kind, setKind] = useState<AchievementKind>('olympiad')
  const [form, setForm] = useState<AchievementForm | ''>('')
  const [level, setLevel] = useState<AchievementLevel>('city')
  const [award, setAward] = useState<AchievementAward>('participant')
  const [title, setTitle] = useState('')
  const [year, setYear] = useState(currentYear)
  const [hours, setHours] = useState<number | undefined>(undefined)

  const needsHours = kind === 'volunteer' || kind === 'internship' || kind === 'course'
  const canAdd = title.trim().length >= 3
  // Виды зависят от типа, поэтому при смене типа выбранный вид сбрасывается.
  const forms = achievementForms(kind)
  const formHint = forms.find((f) => f.id === form)?.hint

  return (
    <Card className="p-4">
      <p className="label mb-2.5">{L('Добавить достижение', 'Жетістік қосу')}</p>

      {/*
        Раньше типы лежали в горизонтальной ленте со скрытой полосой прокрутки:
        с мышью до дальних типов было не добраться, и не было видно, что они есть.
        Теперь все одиннадцать просто переносятся по строкам.
      */}
      <div>
        <div className="flex flex-wrap gap-1.5">
          {achievementKinds().map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => { setKind(k.id); setForm('') }}
              aria-pressed={kind === k.id}
              className={`flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-[13px] font-semibold transition-colors ${
                kind === k.id
                  ? 'border-brand-500 bg-brand-50 text-brand-900'
                  : 'border-line bg-surface text-ink-soft hover:border-brand-300'
              }`}
            >
              <span aria-hidden>{k.emoji}</span>
              {k.label}
            </button>
          ))}
        </div>
      </div>

      <label className="mt-3 block">
        <span className="text-sm font-semibold">{L('Название', 'Атауы')}</span>
        <input
          type="text"
          value={title}
          placeholder={achievementExample(kind)}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1.5 h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-[15px] transition-colors placeholder:text-ink-muted focus:border-brand-400"
        />
      </label>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold">{L('Вид', 'Түрі')}</span>
          <select
            value={form}
            onChange={(e) => setForm(e.target.value as AchievementForm | '')}
            className="mt-1.5 h-11 w-full rounded-xl border border-line bg-surface px-3 text-[15px] focus:border-brand-400"
          >
            <option value="">{L('Не уточнять', 'Нақтыламау')}</option>
            {forms.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
          {formHint && <span className="mt-1 block text-[12.5px] leading-relaxed text-ink-muted">{formHint}</span>}
        </label>
        <label className="block">
          <span className="text-sm font-semibold">{L('Масштаб', 'Деңгейі')}</span>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as AchievementLevel)}
            className="mt-1.5 h-11 w-full rounded-xl border border-line bg-surface px-3 text-[15px] focus:border-brand-400"
          >
            {achievementLevels(kind).map((l) => (
              <option key={l.id} value={l.id}>{l.label}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold">{L('Результат', 'Нәтиже')}</span>
          <select
            value={award}
            onChange={(e) => setAward(e.target.value as AchievementAward)}
            className="mt-1.5 h-11 w-full rounded-xl border border-line bg-surface px-3 text-[15px] focus:border-brand-400"
          >
            {achievementAwards().map((a) => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <NumberField
          label={L('Год', 'Жылы')}
          hint={L('когда это было', 'қашан болды')}
          placeholder={String(currentYear)}
          min={currentYear - 8}
          max={currentYear}
          value={year}
          onChange={(v) => setYear(v ?? currentYear)}
        />
        {needsHours && (
          <NumberField
            label={L('Часы', 'Сағат')}
            hint={L('сколько часов всего', 'барлығы қанша сағат')}
            placeholder={L('необязательно', 'міндетті емес')}
            min={0}
            max={2000}
            step={10}
            value={hours}
            onChange={setHours}
          />
        )}
      </div>

      <Button
        className="mt-4"
        full
        disabled={!canAdd}
        onClick={() => {
          onAdd({
            kind, level, award, title: title.trim(), year,
            hours: needsHours ? hours : undefined,
            form: form === '' ? undefined : form,
          })
          setTitle('')
          setHours(undefined)
          setForm('')
        }}
      >
        {L('Добавить', 'Қосу')}
      </Button>
      {!canAdd && (
        <p className="mt-2 text-xs text-ink-muted">
          {L('Напиши название — так достижение будет понятно и тебе, и приёмной комиссии.', 'Атауын жаз — сонда жетістік саған да, қабылдау комиссиясына да түсінікті болады.')}
        </p>
      )}
    </Card>
  )
}

export function Survey() {
  const { profile, completed, completeSurvey, setProfile } = useApp()
  const L = useL()
  const navigate = useNavigate()
  const [draft, setDraft] = useState<Profile>(profile)
  const [index, setIndex] = useState(0)
  const [touched, setTouched] = useState(false)

  // Набор предметов CSCA пересобирается на лету: он зависит от направления
  // и от языков в анкете, а их правят на соседних шагах.
  const csca = useMemo(() => cscaPlan(draft), [draft])

  const step = STEP_DEFS[index]
  const isLast = index === STEP_DEFS.length - 1
  const valid = step.valid(draft)
  const progress = Math.round(((index + (valid ? 1 : 0)) / STEP_DEFS.length) * 100)

  const patch = (p: Partial<Profile>) => { setDraft((d) => ({ ...d, ...p })); setTouched(false) }

  const currentYear = new Date().getFullYear()
  const years = useMemo(() => [currentYear, currentYear + 1, currentYear + 2, currentYear + 3], [currentYear])
  const achSummary = useMemo(() => summarizeAchievements(draft), [draft])

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
          <p className="label">
            {L(`Шаг ${index + 1} из ${STEP_DEFS.length}`, `${STEP_DEFS.length} қадамның ${index + 1}-сі`)}
          </p>
          <p className="text-xs font-semibold tabular-nums text-ink-muted">{progress}%</p>
        </div>
        <Meter value={progress} />
      </div>

      <h1 className="text-[26px] font-extrabold leading-tight tracking-[-0.02em] sm:text-3xl">
        {L(step.title, step.titleKk)}
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{L(step.hint, step.hintKk)}</p>

      <div className="mt-6 space-y-6">
        {step.id === 'about' && (
          <>
            <label className="block">
              <span className="text-[15px] font-semibold">{L('Как к тебе обращаться?', 'Саған қалай жүгінейік?')}</span>
              <span className="mt-0.5 block text-xs text-ink-muted">
                {L('Необязательно. Имя никуда не отправляется.', 'Міндетті емес. Есім ешқайда жіберілмейді.')}
              </span>
              <input
                type="text"
                value={draft.name}
                placeholder={L('Имя', 'Есім')}
                onChange={(e) => patch({ name: e.target.value })}
                className="mt-2 h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-[15px] transition-colors placeholder:text-ink-muted focus:border-brand-400"
              />
            </label>

            <fieldset>
              <legend className="text-[15px] font-semibold">{L('На каком ты этапе?', 'Қай кезеңдесің?')}</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {stages().map((s) => (
                  <Chip key={s.id} active={draft.stage === s.id} hint={s.hint} onClick={() => patch({ stage: s.id })}>
                    {s.label}
                  </Chip>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-[15px] font-semibold">{L('Год поступления', 'Оқуға түсу жылы')}</legend>
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
            {fields().map((f) => (
              <Chip
                key={f.id}
                active={draft.fields.includes(f.id)}
                hint={draft.fields[0] === f.id ? L('главное направление', 'басты бағыт') : f.hint}
                onClick={() => patch({ fields: toggle(draft.fields, f.id, 3) })}
              >
                {f.emoji} {f.label}
              </Chip>
            ))}
          </div>
        )}

        {step.id === 'study' && (
          <>
            <fieldset>
              <legend className="text-[15px] font-semibold">{L('В какой школе учишься?', 'Қай мектепте оқисың?')}</legend>
              <span className="mt-0.5 block text-xs text-ink-muted">
                {L('От этого зависит, в каких баллах считать успеваемость.', 'Үлгерімді қандай балмен санайтыны осыған байланысты.')}
              </span>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {schoolSystems().map((s) => (
                  <Chip
                    key={s.id}
                    active={draft.schoolSystem === s.id}
                    hint={s.hint}
                    onClick={() => patch({ schoolSystem: s.id })}
                  >
                    {s.label}
                  </Chip>
                ))}
              </div>
            </fieldset>

            {draft.schoolSystem === 'nis' && (
              <NumberField
                label={L('Итоговый балл НИШ', 'НЗМ қорытынды балы')}
                hint={L('по 100-балльной шкале', '100 балдық шкала бойынша')}
                placeholder={L('например, 85', 'мысалы, 85')}
                min={0}
                max={100}
                value={draft.exams.nis}
                onChange={(v) => patch({ exams: { ...draft.exams, nis: v } })}
              />
            )}

            {draft.schoolSystem === 'ib' && (
              <NumberField
                label={L('Итоговый балл IB', 'IB қорытынды балы')}
                hint={L('24–45, диплом International Baccalaureate', '24–45, International Baccalaureate дипломы')}
                placeholder={L('например, 34', 'мысалы, 34')}
                min={24}
                max={45}
                value={draft.exams.ib}
                onChange={(v) => patch({ exams: { ...draft.exams, ib: v } })}
              />
            )}

            {(draft.schoolSystem === 'kz' || draft.schoolSystem === 'other') && (
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[15px] font-semibold">{L('Средний балл', 'Орташа бал')}</span>
                  <span className="text-2xl font-extrabold tabular-nums text-brand-600">{draft.gpa.toFixed(1)}</span>
                </div>
                <span className="mt-0.5 block text-xs text-ink-muted">
                  {L('По пятибалльной шкале, примерно.', 'Бес балдық шкала бойынша, шамамен.')}
                </span>
                <input
                  type="range"
                  min={3}
                  max={5}
                  step={0.1}
                  value={draft.gpa}
                  aria-label={L('Средний балл', 'Орташа бал')}
                  onChange={(e) => patch({ gpa: Number(e.target.value) })}
                  className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-line accent-brand-600"
                />
                <div className="mt-1 flex justify-between text-xs text-ink-muted">
                  <span>3.0</span><span>4.0</span><span>5.0</span>
                </div>
              </div>
            )}

            {(draft.schoolSystem === 'nis' || draft.schoolSystem === 'ib') && (
              <DemoNote>
                {L(
                  'Балл переводится в пятибалльную шкалу, чтобы сравнение с требованиями вузов было честным. Это ориентировочный пересчёт: вуз делает собственный.',
                  'Бал жоғары оқу орындарының талаптарымен әділ салыстыру үшін бес балдық шкалаға аударылады. Бұл — болжамды есеп, ЖОО өз есебін жасайды.',
                )}
              </DemoNote>
            )}

            <fieldset>
              <legend className="text-[15px] font-semibold">{L('Сильные предметы', 'Күшті пәндер')}</legend>
              <span className="mt-0.5 block text-xs text-ink-muted">
                {L('Отметь те, где стабильно хорошо.', 'Тұрақты жақсы болатындарын белгіле.')}
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {subjects().map((s) => {
                  const active = draft.strongSubjects.includes(s.id)
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => patch({ strongSubjects: toggle(draft.strongSubjects, s.id) })}
                      aria-pressed={active}
                      className={`h-10 rounded-full border px-3.5 text-[14px] font-semibold transition-colors ${
                        active
                          ? 'border-brand-500 bg-brand-50 text-brand-900'
                          : 'border-line bg-surface text-ink-soft hover:border-brand-300'
                      }`}
                    >
                      {s.label}
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
              <legend className="text-[15px] font-semibold">
                {L('Языки обучения, которые тебе подходят', 'Саған қолайлы оқу тілдері')}
              </legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {languages().map((l) => (
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
              <legend className="text-[15px] font-semibold">{L('Уровень английского', 'Ағылшын тілі деңгейі')}</legend>
              <span className="mt-0.5 block text-xs text-ink-muted">
                {L('Честная самооценка точнее, чем желаемая.', 'Шынайы өзін-өзі бағалау қалаған деңгейден дәлірек.')}
              </span>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {englishLevels().map((e) => (
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
              <legend className="text-[15px] font-semibold">{L('Что планируешь сдавать', 'Нені тапсыруды жоспарлайсың')}</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {exams().map((e) => (
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

            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField
                label="ЕНТ" hint={L('0–140, если уже есть', '0–140, егер бар болса')} placeholder={L('нет', 'жоқ')}
                min={0} max={140} value={draft.exams.ent}
                onChange={(v) => patch({ exams: { ...draft.exams, ent: v } })}
              />
              <NumberField
                label="IELTS" hint="4.0–9.0" placeholder={L('нет', 'жоқ')}
                min={4} max={9} step={0.5} value={draft.exams.ielts}
                onChange={(v) => patch({ exams: { ...draft.exams, ielts: v } })}
              />
              <NumberField
                label="TOEFL iBT" hint={L('0–120, засчитывается вместо IELTS', '0–120, IELTS орнына есептеледі')} placeholder={L('нет', 'жоқ')}
                min={0} max={120} value={draft.exams.toefl}
                onChange={(v) => patch({ exams: { ...draft.exams, toefl: v } })}
              />
              <NumberField
                label="SAT" hint="400–1600" placeholder={L('нет', 'жоқ')}
                min={400} max={1600} step={10} value={draft.exams.sat}
                onChange={(v) => patch({ exams: { ...draft.exams, sat: v } })}
              />
            </div>
            {csca.subjects.length > 0 && (draft.exams.planned.includes('csca') || csca.relevant) && (
              <Card className="p-4">
                <p className="label mb-1">{L('Что сдавать на CSCA', 'CSCA-да не тапсырасың')}</p>
                <p className="text-[13.5px] leading-relaxed text-ink-soft">{csca.trackNote}</p>
                <ul className="mt-3 space-y-2.5">
                  {csca.subjects.map((sub) => (
                    <li key={sub.id} className="border-t border-line pt-2.5 first:border-t-0 first:pt-0">
                      <p className="text-[14px] font-bold">
                        {L(sub.title, sub.titleKk)} <span className="font-normal text-ink-muted">{sub.original}</span>
                      </p>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-ink-muted">{L(sub.why, sub.whyKk)}</p>
                    </li>
                  ))}
                </ul>
                <DemoNote className="mt-3">
                  {L('Состав предметов зависит от вуза и программы. Сверяйте на ', 'Пәндер құрамы ЖОО мен бағдарламаға байланысты. Тексеріңіз: ')}
                  <a href={csca.source.url} target="_blank" rel="noreferrer noopener" className="font-semibold underline underline-offset-2">
                    {csca.source.label} ↗
                  </a>
                </DemoNote>
              </Card>
            )}

            <DemoNote>
              {L(
                'Если баллов пока нет — ничего не заполняй. Оценка шансов станет осторожнее, и это честнее, чем подставлять цифры.',
                'Егер бал әлі жоқ болса — ештеңе толтырма. Мүмкіндік бағасы сақтырақ болады, бұл ойдан цифр қоюдан адалырақ.',
              )}
            </DemoNote>
          </>
        )}

        {step.id === 'achievements' && (
          <>
            {draft.achievements.length > 0 ? (
              <ul className="space-y-2">
                {draft.achievements.map((a) => (
                  <Card as="li" key={a.id} className="flex items-start gap-3 p-3.5">
                    <span aria-hidden className="mt-0.5 shrink-0 text-lg">{ACHIEVEMENT_KIND_EMOJI[a.kind]}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-tight">{a.title}</p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {achievementLabel(a)} · {a.year}
                        {a.hours ? ` · ${a.hours} ч` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => patch({ achievements: draft.achievements.filter((x) => x.id !== a.id) })}
                      aria-label={L(`Удалить: ${a.title}`, `Жою: ${a.title}`)}
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line bg-surface text-ink-muted transition-colors hover:border-coral-100 hover:text-coral-600"
                    >
                      <span aria-hidden>✕</span>
                    </button>
                  </Card>
                ))}
              </ul>
            ) : (
              <Card className="p-4">
                <p className="text-[15px] leading-relaxed text-ink-soft">
                  {L(
                    'Пока пусто. Считается всё: школьная олимпиада, кружок, свой проект, помощь в фонде, спортивный разряд. Приёмные комиссии за рубежом читают именно это, а не только аттестат.',
                    'Әзірге бос. Бәрі есепке алынады: мектеп олимпиадасы, үйірме, өз жобаң, қордағы көмек, спорттық разряд. Шетелдегі қабылдау комиссиялары аттестатты ғана емес, дәл осыны оқиды.',
                  )}
                </p>
              </Card>
            )}

            <AchievementForm
              onAdd={(value) =>
                patch({
                  achievements: [
                    ...draft.achievements,
                    { ...value, id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
                  ],
                })
              }
            />

            {draft.achievements.length > 0 && (
              <Card className="p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="label">{L('Сила профиля', 'Профиль күші')}</p>
                  <Badge tone={achSummary.strength >= 0.5 ? 'mint' : 'sun'}>
                    {Math.round(achSummary.strength * 100)}%
                  </Badge>
                </div>
                <div className="mt-2">
                  <Meter value={achSummary.strength * 100} tone={achSummary.strength >= 0.5 ? 'mint' : 'sun'} />
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">
                  {L(
                    'Это влияет только на вузы, которые читают заявку целиком. Там, где решает ЕНТ, портфолио почти не считается — и продукт этого не скрывает.',
                    'Бұл өтінімді толық оқитын ЖОО-ларға ғана әсер етеді. ҰБТ шешетін жерде портфолио дерлік есепке алынбайды — өнім мұны жасырмайды.',
                  )}
                </p>
              </Card>
            )}
          </>
        )}

        {step.id === 'geo' && (
          <>
            <div className="grid gap-2 sm:grid-cols-2">
              {countries().map((c) => (
                <Chip
                  key={c.code}
                  active={draft.countries.includes(c.code)}
                  hint={c.hint}
                  onClick={() => patch({ countries: toggle(draft.countries, c.code) })}
                >
                  {c.flag} {c.label}
                </Chip>
              ))}
            </div>
            <Card className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="text-[15px] font-semibold">
                  {L('Готовность к переезду в другую страну', 'Басқа елге көшуге дайындық')}
                </p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  {L(
                    'Если да, в подбор попадут и страны, которые не отмечены выше.',
                    'Иә болса, таңдауға жоғарыда белгіленбеген елдер де кіреді.',
                  )}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={draft.relocation}
                aria-label={L('Готовность к переезду', 'Көшуге дайындық')}
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
              <legend className="text-[15px] font-semibold">{L('Бюджет на обучение', 'Оқуға бюджет')}</legend>
              <span className="mt-0.5 block text-xs text-ink-muted">
                {L('Только плата за обучение, без проживания.', 'Тек оқу ақысы, тұрғын үйсіз.')}
              </span>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {budgets().map((b) => (
                  <Chip key={b.id} active={draft.budget === b.id} hint={b.hint} onClick={() => patch({ budget: b.id })}>
                    {b.label}
                  </Chip>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-[15px] font-semibold">{L('Что для тебя важнее всего', 'Сен үшін не маңызды')}</legend>
              <span className="mt-0.5 block text-xs text-ink-muted">{L('Можно выбрать несколько.', 'Бірнешеуін таңдауға болады.')}</span>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {priorities().map((p) => (
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

            <fieldset>
              <legend className="text-[15px] font-semibold">{L('Как с тобой разговаривать', 'Сенімен қалай сөйлесу керек')}</legend>
              <span className="mt-0.5 block text-xs text-ink-muted">
                {L('Меняет тон подсказок и диагностики, но не сами рекомендации.', 'Кеңестер мен диагностика үнін өзгертеді, ұсыныстарды емес.')}
              </span>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {tones().map((t) => (
                  <Chip key={t.id} active={draft.tone === t.id} hint={t.hint} onClick={() => patch({ tone: t.id })}>
                    {t.emoji} {t.label}
                  </Chip>
                ))}
              </div>
            </fieldset>
          </>
        )}
      </div>

      {touched && !valid && step.error && (
        <p role="alert" className="mt-4 rounded-xl border border-coral-100 bg-coral-50 px-3.5 py-2.5 text-sm font-semibold text-coral-700">
          {L(step.error, step.errorKk ?? step.error)}
        </p>
      )}

      <div className="safe-bottom sticky bottom-0 -mx-4 mt-8 border-t border-line bg-paper/95 px-4 pt-3 backdrop-blur">
        <div className="flex gap-3">
          {index > 0 ? (
            <Button variant="secondary" size="lg" onClick={() => setIndex((i) => i - 1)}>
              {L('Назад', 'Артқа')}
            </Button>
          ) : (
            <Button variant="secondary" size="lg" onClick={() => navigate('/')}>
              {L('На главную', 'Басты бет')}
            </Button>
          )}
          <Button size="lg" full onClick={goNext}>
            {isLast
              ? completed
                ? L('Пересчитать маршрут', 'Маршрутты қайта есептеу')
                : L('Показать результат', 'Нәтижені көрсету')
              : L('Дальше', 'Әрі қарай')}
            <span aria-hidden>→</span>
          </Button>
        </div>
        {completed && !isLast && (
          <button
            type="button"
            onClick={() => { setProfile(draft); navigate('/matches') }}
            className="mt-2 w-full py-2 text-[13px] font-semibold text-ink-muted hover:text-brand-700"
          >
            {L('Сохранить изменения и вернуться к подбору', 'Өзгерістерді сақтап, таңдауға оралу')}
          </button>
        )}
      </div>
    </div>
  )
}
