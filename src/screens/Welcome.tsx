import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, DemoNote } from '../components/ui'
import { STEPS } from '../components/Journey'
import { useApp } from '../store/app'
import { PROGRAMS } from '../data/programs'

const RESULT = [
  {
    icon: '🎯',
    title: 'Список программ, а не список вузов',
    text: 'Минимум три варианта с процентом совпадения и разбором, почему подходит именно тебе.',
  },
  {
    icon: '💬',
    title: 'Объяснение вместо рейтинга',
    text: 'Каждая рекомендация написана словами: что совпало, что не совпало и на что смотреть.',
  },
  {
    icon: '🗺️',
    title: 'План до самой подачи',
    text: 'Экзамены, документы, дедлайны и активности — с одним выделенным следующим шагом.',
  },
]

export function Welcome() {
  const { completed, loadDemo } = useApp()
  const navigate = useNavigate()

  return (
    <div className="animate-fade-up">
      <section className="pt-6 sm:pt-12">
        <p className="label mb-3">Персональный маршрут поступления</p>
        <h1 className="max-w-2xl text-[32px] font-extrabold leading-[1.1] tracking-[-0.025em] sm:text-5xl">
          Поступление — это не выбор вуза.
          <br />
          <span className="text-brand-600">Это последовательность шагов.</span>
        </h1>
        <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-ink-soft">
          Qadam за семь минут превращает твой профиль и цель в маршрут: куда поступать,
          почему этот вариант подходит и что сделать прямо сейчас.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" onClick={() => navigate('/survey')} className="sm:w-auto">
            {completed ? 'Продолжить маршрут' : 'Начать анкету'}
            <span aria-hidden>→</span>
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => { loadDemo(); navigate('/diagnosis') }}
          >
            Посмотреть на готовом примере
          </Button>
        </div>
        <p className="mt-3 text-[13px] text-ink-muted">
          Без регистрации. Ответы хранятся только в твоём браузере.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-muted">Что ты получишь</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {RESULT.map((r) => (
            <Card key={r.title} className="p-5">
              <span aria-hidden className="text-2xl">{r.icon}</span>
              <h3 className="mt-3 text-[16px] font-bold leading-snug">{r.title}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">{r.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-muted">Путь из пяти экранов</h2>
        <Card className="mt-4 divide-y divide-line">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-4 p-4">
              <span
                aria-hidden
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-50 text-[13px] font-bold text-brand-700"
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-bold leading-tight">{s.label}</p>
                <p className="text-[13px] text-ink-muted">{s.what}</p>
              </div>
            </div>
          ))}
        </Card>
      </section>

      <section className="mt-10">
        <Card className="bg-brand-900 p-6 text-white sm:p-8">
          <div className="flex flex-wrap items-end gap-x-10 gap-y-5">
            <div>
              <p className="text-3xl font-extrabold tabular-nums">{PROGRAMS.length}</p>
              <p className="mt-1 text-sm text-brand-200">программ в демо-базе</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold tabular-nums">6</p>
              <p className="mt-1 text-sm text-brand-200">критериев подбора с весами</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold tabular-nums">15</p>
              <p className="mt-1 text-sm text-brand-200">стран в подборе</p>
            </div>
          </div>
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-brand-100">
            Подбор строится прозрачным движком: каждый процент совпадения раскладывается
            на направление, проходимость, бюджет, географию, язык и твои приоритеты.
            Никаких скрытых оценок и обещаний поступления.
          </p>
        </Card>
      </section>

      <footer className="mt-10 border-t border-line pt-6">
        <DemoNote>
          Прототип для LOCUS Startup Hackathon 2026, кейс 02. Данные о программах —
          демонстрационные, у каждой карточки есть ссылка на официальный сайт вуза.
        </DemoNote>
        <p className="mt-3 text-[13px] text-ink-muted">
          <Link to="/survey" className="font-semibold text-brand-600 underline underline-offset-2">
            Начать анкету
          </Link>
        </p>
      </footer>
    </div>
  )
}
