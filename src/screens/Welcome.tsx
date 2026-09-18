import { Link, useNavigate } from 'react-router-dom'
import { Badge, Button, Card, DemoNote } from '../components/ui'
import { AppSoonBadge } from '../components/Controls'
import { STEPS } from '../components/Journey'
import { useApp } from '../store/app'
import { useL } from '../i18n/LangContext'
import { PROGRAMS } from '../data/programs'
import { SCHOLARSHIPS } from '../data/scholarships'
import { COUNTRIES_RAW } from '../data/taxonomy'
import { DEMO_CASES } from '../data/demoCases'
import { WEIGHTS } from '../engine/match'

const RESULT = [
  {
    icon: '🎯',
    title: 'Список программ, а не список вузов',
    titleKk: 'ЖОО тізімі емес, бағдарламалар тізімі',
    text: 'Минимум три варианта с процентом совпадения и разбором, почему подходит именно тебе.',
    textKk: 'Кемінде үш нұсқа: сәйкестік пайызы және дәл саған неге келетінінің талдауы.',
  },
  {
    icon: '💬',
    title: 'Объяснение вместо рейтинга',
    titleKk: 'Рейтингтің орнына түсіндірме',
    text: 'Каждая рекомендация написана словами: что совпало, что не совпало и на что смотреть.',
    textKk: 'Әр ұсыныс сөзбен жазылған: не сәйкес келді, не келмеді және неге назар аудару керек.',
  },
  {
    icon: '🗺️',
    title: 'План до самой подачи',
    titleKk: 'Өтінім беруге дейінгі жоспар',
    text: 'Экзамены, документы, стипендии, дедлайны и активности — с одним выделенным следующим шагом.',
    textKk: 'Емтихандар, құжаттар, шәкіртақылар, мерзімдер және белсенділік — бір ерекшеленген келесі қадаммен.',
  },
]

/** Цвет подписи случая: та же шкала, что у оценки шансов. */
const CASE_TONE = { high: 'mint', medium: 'brand', low: 'coral' } as const

export function Welcome() {
  const { completed, loadDemo } = useApp()
  const L = useL()
  const navigate = useNavigate()

  return (
    <div className="animate-fade-up">
      <section className="pt-6 sm:pt-12">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <p className="label">{L('Персональный маршрут поступления', 'Оқуға түсудің жеке маршруты')}</p>
          <AppSoonBadge className="lg:hidden" />
        </div>
        <h1 className="max-w-2xl text-[32px] font-extrabold leading-[1.1] tracking-[-0.025em] sm:text-5xl">
          {L('Поступление — это не выбор вуза.', 'Оқуға түсу — ЖОО таңдау емес.')}
          <br />
          <span className="text-brand-600">
            {L('Это последовательность шагов.', 'Бұл — қадамдар тізбегі.')}
          </span>
        </h1>
        <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-ink-soft">
          {L(
            'Qadam за семь минут превращает твой профиль и цель в маршрут: куда поступать, почему этот вариант подходит и что сделать прямо сейчас.',
            'Qadam жеті минутта профилің мен мақсатыңды маршрутқа айналдырады: қайда түсу керек, бұл нұсқа неге қолайлы және дәл қазір не істеу керек.',
          )}
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" onClick={() => navigate('/survey')} className="sm:w-auto">
            {completed ? L('Продолжить маршрут', 'Маршрутты жалғастыру') : L('Начать анкету', 'Сауалнаманы бастау')}
            <span aria-hidden>→</span>
          </Button>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-muted">
          {L('Три готовых примера', 'Үш дайын мысал')}
        </h2>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-soft">
          {L(
            'Профили отличаются баллами, языком, бюджетом и достижениями. Открой любой, чтобы увидеть, как из-за этого меняются рекомендации, оценка шансов и план.',
            'Профильдер баллмен, тілмен, бюджетпен және жетістіктермен ерекшеленеді. Кез келгенін ашып, осыдан ұсыныстар, мүмкіндік бағасы мен жоспар қалай өзгеретінін көр.',
          )}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {DEMO_CASES.map((c) => (
            <Card key={c.id} className="flex flex-col p-5">
              <Badge tone={CASE_TONE[c.id]} className="self-start">{L(c.title, c.titleKk)}</Badge>
              <p className="mt-3 text-[14px] font-bold leading-snug">{L(c.summary, c.summaryKk)}</p>
              <p className="mt-2 flex-1 text-[13px] leading-relaxed text-ink-muted">{L(c.driver, c.driverKk)}</p>
              <Button
                variant="secondary"
                className="mt-4 w-full"
                onClick={() => { loadDemo(c.id); navigate('/diagnosis') }}
              >
                {L('Открыть пример', 'Мысалды ашу')}
              </Button>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-muted">
          {L('Что ты получишь', 'Не аласың')}
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {RESULT.map((r) => (
            <Card key={r.title} className="p-5">
              <span aria-hidden className="text-2xl">{r.icon}</span>
              <h3 className="mt-3 text-[16px] font-bold leading-snug">{L(r.title, r.titleKk)}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">{L(r.text, r.textKk)}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-muted">
          {L('Путь из пяти экранов', 'Бес экраннан тұратын жол')}
        </h2>
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
                <p className="text-[15px] font-bold leading-tight">{L(s.label, s.labelKk)}</p>
                <p className="text-[13px] text-ink-muted">{L(s.what, s.whatKk)}</p>
              </div>
            </div>
          ))}
        </Card>
      </section>

      <section className="mt-10">
        <Card className="bg-deep p-6 text-deep-ink sm:p-8">
          <div className="flex flex-wrap items-end gap-x-10 gap-y-5">
            <div>
              <p className="text-3xl font-extrabold tabular-nums">{PROGRAMS.length}</p>
              <p className="mt-1 text-sm text-deep-muted">{L('программ в демо-базе', 'демо-базадағы бағдарлама')}</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold tabular-nums">{COUNTRIES_RAW.length}</p>
              <p className="mt-1 text-sm text-deep-muted">{L('стран в подборе', 'таңдаудағы ел')}</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold tabular-nums">{SCHOLARSHIPS.length}</p>
              <p className="mt-1 text-sm text-deep-muted">{L('стипендий и грантов', 'шәкіртақы мен грант')}</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold tabular-nums">{Object.keys(WEIGHTS).length}</p>
              <p className="mt-1 text-sm text-deep-muted">{L('критериев подбора с весами', 'салмағы бар таңдау өлшемі')}</p>
            </div>
          </div>
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-deep-soft">
            {L(
              'Подбор строится прозрачным движком: каждый процент совпадения раскладывается на направление, проходимость, бюджет, географию, язык, достижения и твои приоритеты. Никаких скрытых оценок и обещаний поступления.',
              'Таңдау ашық қозғалтқышпен құрылады: сәйкестіктің әр пайызы бағытқа, өту мүмкіндігіне, бюджетке, географияға, тілге, жетістіктерге және басымдықтарыңа жіктеледі. Жасырын баға мен түсу уәдесі жоқ.',
            )}
          </p>
        </Card>
      </section>

      <footer className="mt-10 border-t border-line pt-6">
        <DemoNote>
          {L(
            'Прототип для LOCUS Startup Hackathon 2026, кейс 02. Данные о программах — демонстрационные, у каждой карточки есть ссылка на официальный сайт вуза.',
            'LOCUS Startup Hackathon 2026, 02-кейс прототипі. Бағдарлама деректері — демонстрациялық, әр карточкада ЖОО ресми сайтына сілтеме бар.',
          )}
        </DemoNote>
        <p className="mt-3 text-[13px] text-ink-muted">
          <Link
            to="/survey"
            className="-m-2 inline-block p-2 font-semibold text-brand-600 underline underline-offset-2"
          >
            {L('Начать анкету', 'Сауалнаманы бастау')}
          </Link>
        </p>
      </footer>
    </div>
  )
}
