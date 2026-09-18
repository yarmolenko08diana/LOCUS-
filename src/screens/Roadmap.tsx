import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, Card, DemoNote, Empty, Meter } from '../components/ui'
import { useApp } from '../store/app'
import type { RoadmapTask, TaskCategory } from '../types'
import { useL } from '../i18n/LangContext'
import { nudge } from '../engine/tone'
import { countOf } from '../lib/text'

const CATEGORY: Record<
  TaskCategory,
  { label: string; labelKk: string; tone: 'brand' | 'mint' | 'sun' | 'coral' | 'neutral' }
> = {
  exam: { label: 'Экзамен', labelKk: 'Емтихан', tone: 'brand' },
  document: { label: 'Документы', labelKk: 'Құжаттар', tone: 'sun' },
  academic: { label: 'Учёба', labelKk: 'Оқу', tone: 'mint' },
  activity: { label: 'Активности', labelKk: 'Белсенділік', tone: 'coral' },
  essay: { label: 'Эссе', labelKk: 'Эссе', tone: 'brand' },
  contest: { label: 'Конкурсы', labelKk: 'Байқаулар', tone: 'sun' },
  scholarship: { label: 'Стипендии', labelKk: 'Шәкіртақылар', tone: 'mint' },
  research: { label: 'Разобраться', labelKk: 'Анықтау', tone: 'neutral' },
}

function TaskRow({
  task, done, onToggle, isNext,
}: { task: RoadmapTask; done: boolean; onToggle: () => void; isNext: boolean }) {
  const meta = CATEGORY[task.category]
  const L = useL()
  const [open, setOpen] = useState(false)

  return (
    <li
      className={`group relative flex gap-3.5 px-5 py-4 transition-colors ${
        done ? 'opacity-55' : isNext ? 'bg-brand-50/40' : ''
      }`}
    >
      {/* Кнопка шире круга: видимый кружок 24px, зона нажатия 40px. */}
      <button
        type="button"
        onClick={onToggle}
        role="checkbox"
        aria-checked={done}
        aria-label={
          done
            ? L(`Снять отметку: ${task.title}`, `Белгіні алу: ${task.title}`)
            : L(`Отметить выполненным: ${task.title}`, `Орындалды деп белгілеу: ${task.title}`)
        }
        className="group/check -m-2 grid h-10 w-10 shrink-0 place-items-center rounded-full"
      >
        <span
          aria-hidden
          className={`grid h-6 w-6 place-items-center rounded-full border-2 transition-all group-active/check:scale-90 ${
            done
              ? 'border-mint-500 bg-mint-500 text-white'
              : 'border-line bg-surface text-transparent group-hover/check:border-brand-400'
          }`}
        >
          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M2.5 6.2 4.8 8.5 9.5 3.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={meta.tone}>{L(meta.label, meta.labelKk)}</Badge>
          <span className="text-[12px] font-semibold text-ink-muted">{task.window}</span>
          {isNext && !done && <Badge tone="brand">{L('следующий шаг', 'келесі қадам')}</Badge>}
        </div>
        <p className={`mt-1.5 text-[15px] font-bold leading-snug ${done ? 'line-through' : ''}`}>{task.title}</p>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="-mx-1 mt-0.5 min-h-[32px] px-1 py-1.5 text-[13px] font-semibold text-brand-600 hover:underline"
        >
          {open ? L('Скрыть', 'Жасыру') : L('Зачем это', 'Бұл не үшін')}
        </button>

        {open && (
          <div className="mt-2 animate-fade-up rounded-xl bg-paper px-3.5 py-3">
            <p className="text-[14px] leading-relaxed text-ink-soft">{task.why}</p>
            <p className="mt-2 text-[12px] font-semibold text-ink-muted">
              {L('Примерные затраты', 'Болжамды шығын')}: {task.effort}
            </p>
            {task.source && (
              <a
                href={task.source.url}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-2 inline-block text-[13px] font-bold text-brand-600 underline underline-offset-2"
              >
                {L('Источник', 'Дереккөз')}: {task.source.label} ↗
              </a>
            )}
          </div>
        )}
      </div>
    </li>
  )
}

export function Roadmap() {
  const { roadmap, tasks, next, done, toggleDone, completed, recommendations, profile } = useApp()
  const L = useL()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<TaskCategory | 'all'>('all')

  const doneCount = useMemo(() => done.filter((d) => tasks.some((t) => t.id === d)).length, [done, tasks])
  const progress = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0

  const deadlines = useMemo(
    () =>
      recommendations.slice(0, 4).flatMap((r) =>
        r.program.deadlines.map((d) => ({
          uni: r.program.universityShort,
          label: d.label,
          window: d.window,
          url: r.program.source.url,
        })),
      ),
    [recommendations],
  )

  if (!completed) {
    return (
      <Empty
        title={L('План появится после анкеты', 'Жоспар сауалнамадан кейін пайда болады')}
        description={L(
          'Шаги зависят от твоего этапа, экзаменов и требований программ в подборе.',
          'Қадамдар кезеңіңе, емтихандарыңа және таңдаудағы бағдарламалардың талаптарына байланысты.',
        )}
        action={
          <Button onClick={() => navigate('/survey')}>{L('Заполнить анкету', 'Сауалнаманы толтыру')}</Button>
        }
      />
    )
  }

  return (
    <div className="animate-fade-up space-y-6">
      <header>
        <p className="label mb-2">{L('Шаг 5 · План', '5-қадам · Жоспар')}</p>
        <h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.02em] sm:text-4xl">
          {L(`Маршрут до поступления в ${profile.intakeYear}`, `${profile.intakeYear} жылы оқуға түсуге дейінгі маршрут`)}
        </h1>
        <p className="mt-2 max-w-2xl text-[16px] leading-relaxed text-ink-soft">
          {L(
            `${countOf(tasks.length, 'шаг', 'шага', 'шагов')}, собранных под требования программ из твоего топа. Отмечай выполненное — следующий шаг обновляется сам.`,
            `Топ бағдарламаларыңның талаптарына сай жиналған ${tasks.length} қадам. Орындалғанын белгіле — келесі қадам өзі жаңарады.`,
          )}
        </p>
      </header>

      {next ? (
        <Card className="overflow-hidden border-brand-200">
          <div className="bg-deep px-6 py-5 text-deep-ink">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-deep-muted">
              {nudge()}
            </p>
            <h2 className="mt-2 text-[21px] font-extrabold leading-snug sm:text-[24px]">{next.title}</h2>
            <p className="mt-2.5 text-[15px] leading-relaxed text-deep-soft">{next.why}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-deep-ink/15 px-3 py-1.5 text-[13px] font-semibold">
                {L(CATEGORY[next.category].label, CATEGORY[next.category].labelKk)}
              </span>
              <span className="rounded-full bg-deep-ink/15 px-3 py-1.5 text-[13px] font-semibold">{next.window}</span>
              <span className="rounded-full bg-deep-ink/15 px-3 py-1.5 text-[13px] font-semibold">{next.effort}</span>
            </div>
          </div>
          <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
            <Button size="lg" onClick={() => toggleDone(next.id)} className="sm:w-auto">
              {L('Отметить выполненным ✓', 'Орындалды деп белгілеу ✓')}
            </Button>
            {next.source && (
              <a
                href={next.source.url}
                target="_blank"
                rel="noreferrer noopener"
                className="text-[14px] font-bold text-brand-600 underline underline-offset-2"
              >
                {L('Открыть источник', 'Дереккөзді ашу')}: {next.source.label} ↗
              </a>
            )}
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <h2 className="text-[20px] font-extrabold">{L('Все шаги отмечены', 'Барлық қадам белгіленді')}</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
            {L(
              'План пройден полностью. Если что-то изменилось — обнови анкету, и маршрут пересоберётся под новые условия.',
              'Жоспар толық орындалды. Бірдеңе өзгерсе — сауалнаманы жаңарт, маршрут жаңа шарттарға сай қайта құрылады.',
            )}
          </p>
          <Button variant="secondary" className="mt-4" onClick={() => navigate('/survey')}>
            {L('Обновить анкету', 'Сауалнаманы жаңарту')}
          </Button>
        </Card>
      )}

      <Card className="p-5">
        <Meter
          value={progress}
          tone={progress === 100 ? 'mint' : 'brand'}
          label={L('Прогресс по плану', 'Жоспар барысы')}
          sublabel={L(`${doneCount} из ${tasks.length}`, `${tasks.length}-ден ${doneCount}`)}
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`h-8 rounded-full border px-3 text-[13px] font-bold transition-colors ${
              filter === 'all' ? 'border-brand-500 bg-brand-50 text-brand-900' : 'border-line text-ink-soft hover:border-brand-300'
            }`}
          >
            {L('Все', 'Барлығы')}
          </button>
          {(Object.keys(CATEGORY) as TaskCategory[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilter(c)}
              className={`h-8 rounded-full border px-3 text-[13px] font-bold transition-colors ${
                filter === c ? 'border-brand-500 bg-brand-50 text-brand-900' : 'border-line text-ink-soft hover:border-brand-300'
              }`}
            >
              {L(CATEGORY[c].label, CATEGORY[c].labelKk)}
            </button>
          ))}
        </div>
      </Card>

      <div className="space-y-5">
        {roadmap.map((phase) => {
          const visible = phase.tasks.filter((t) => filter === 'all' || t.category === filter)
          if (visible.length === 0) return null
          const phaseDone = phase.tasks.filter((t) => done.includes(t.id)).length
          return (
            <section key={phase.id}>
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-[19px] font-extrabold tracking-[-0.01em]">{phase.title}</h2>
                  <p className="text-[13px] text-ink-muted">{phase.subtitle}</p>
                </div>
                <span className="text-[13px] font-bold tabular-nums text-ink-muted">
                  {phaseDone}/{phase.tasks.length}
                </span>
              </div>
              <Card>
                <ul className="divide-y divide-line">
                  {visible.map((t) => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      done={done.includes(t.id)}
                      onToggle={() => toggleDone(t.id)}
                      isNext={next?.id === t.id}
                    />
                  ))}
                </ul>
              </Card>
            </section>
          )
        })}
      </div>

      <section>
        <h2 className="mb-3 text-[19px] font-extrabold tracking-[-0.01em]">
          {L('Периоды подачи по твоему топу', 'Топ бойынша өтінім кезеңдері')}
        </h2>
        <Card>
          <ul className="divide-y divide-line">
            {deadlines.map((d, i) => (
              <li key={i} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-bold">{d.uni}</p>
                  <p className="truncate text-[13px] text-ink-muted">{d.label}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[14px] font-bold text-brand-700">{d.window}</p>
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="-mx-1 inline-block px-1 py-2 text-[12px] font-semibold text-ink-muted underline underline-offset-2"
                  >
                    {L('сверить', 'тексеру')} ↗
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <DemoNote className="mt-3">
          {L(
            'Периоды указаны ориентировочно по демо-данным. Точные даты каждого года публикует сам вуз — ссылка «сверить» ведёт на официальную страницу приёма.',
            'Кезеңдер демо-дерек бойынша болжаммен берілген. Әр жылдың нақты күндерін ЖОО өзі жариялайды — «тексеру» сілтемесі ресми қабылдау бетіне апарады.',
          )}
        </DemoNote>
      </section>
    </div>
  )
}
