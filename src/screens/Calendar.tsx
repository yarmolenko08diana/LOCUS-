import { Link } from 'react-router-dom'
import { Badge, Card, DemoNote, Empty, SectionTitle } from '../components/ui'
import { useApp } from '../store/app'
import { useL } from '../i18n/LangContext'
import { MONTH_LABEL, whenLabel } from '../engine/calendar'
import type { CalendarEntry } from '../types'

const KIND_META: Record<CalendarEntry['kind'], { emoji: string; tone: 'brand' | 'mint' | 'sun' | 'neutral' }> = {
  program: { emoji: '🎓', tone: 'brand' },
  scholarship: { emoji: '💰', tone: 'mint' },
  exam: { emoji: '📝', tone: 'sun' },
  task: { emoji: '📌', tone: 'neutral' },
}

export function Calendar() {
  const { calendar, reminders, toggleReminder, completed } = useApp()
  const L = useL()

  if (!completed || calendar.length === 0) {
    return (
      <Empty
        title={L('Календарь появится после анкеты', 'Күнтізбе сауалнамадан кейін пайда болады')}
        description={L(
          'В календарь попадают периоды подачи программ из твоего подбора, стипендий и экзаменов, которые ты запланировал.',
          'Күнтізбеге таңдауыңдағы бағдарламалардың, шәкіртақылардың және жоспарлаған емтихандарыңның өтінім кезеңдері түседі.',
        )}
        action={
          <Link to="/survey" className="font-semibold text-brand-700 underline">
            {L('Перейти к анкете', 'Сауалнамаға өту')}
          </Link>
        }
      />
    )
  }

  // Группировка по месяцу: так видно, где сгущаются дедлайны.
  const groups: { key: string; month: number; year: number; items: CalendarEntry[] }[] = []
  calendar.forEach((entry) => {
    const key = `${entry.year}-${entry.month}`
    const last = groups[groups.length - 1]
    if (last && last.key === key) last.items.push(entry)
    else groups.push({ key, month: entry.month, year: entry.year, items: [entry] })
  })

  return (
    <div className="space-y-5 animate-fade-up">
      <SectionTitle
        eyebrow={L('Когда что делать', 'Не істеу керек және қашан')}
        title={L('Календарь дедлайнов', 'Мерзімдер күнтізбесі')}
        description={L(
          'Периоды подачи по твоим программам и стипендиям, выстроенные по времени. Отметь звёздочкой то, о чём нужно напомнить — отметки сохраняются в браузере.',
          'Бағдарламаларың мен шәкіртақыларың бойынша өтінім кезеңдері уақыт бойынша тізілген. Еске салу керегін жұлдызшамен белгіле — белгілер браузерде сақталады.',
        )}
      />

      {reminders.length > 0 && (
        <Card className="border-brand-200 bg-brand-50 p-4">
          <p className="text-[15px] leading-relaxed text-brand-900">
            <span className="font-bold">{L('Напоминания', 'Еске салулар')}: </span>
            {L(
              `отмечено ${reminders.length}. Прототип работает без сервера, поэтому отметки живут в этом браузере и подсвечивают события в списке — писем и пуш-уведомлений здесь нет.`,
              `${reminders.length} белгіленген. Прототип серверсіз жұмыс істейді, сондықтан белгілер осы браузерде сақталады және тізімде оқиғаларды ерекшелейді — хат пен push-хабарлама жоқ.`,
            )}
          </p>
        </Card>
      )}

      <ol className="space-y-5">
        {groups.map((g) => (
          <li key={g.key}>
            <div className="mb-2.5 flex items-baseline gap-2">
              <h2 className="text-base font-bold capitalize">{MONTH_LABEL[g.month - 1]}</h2>
              <span className="text-sm tabular-nums text-ink-muted">{g.year}</span>
            </div>
            <ul className="space-y-2.5">
              {g.items.map((entry) => {
                const meta = KIND_META[entry.kind]
                const on = reminders.includes(entry.id)
                return (
                  <Card
                    as="li"
                    key={entry.id}
                    className={`flex items-start gap-3 p-4 ${on ? 'border-brand-300' : ''}`}
                  >
                    <span aria-hidden className="mt-0.5 shrink-0 text-lg">{meta.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-tight">{entry.title}</p>
                      <p className="mt-0.5 text-sm text-ink-muted">{entry.subtitle}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge tone={meta.tone}>{entry.window}</Badge>
                        <span className="text-xs text-ink-muted">{whenLabel(entry)}</span>
                      </div>
                      {entry.source && (
                        <a
                          href={entry.source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 -m-2 inline-block p-2 text-sm font-semibold text-brand-700 underline underline-offset-2"
                        >
                          {L('Сверить дату', 'Күнін тексеру')}
                        </a>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleReminder(entry.id)}
                      aria-pressed={on}
                      aria-label={
                        on
                          ? L(`Убрать напоминание: ${entry.title}`, `Еске салуды алып тастау: ${entry.title}`)
                          : L(`Напомнить: ${entry.title}`, `Еске салу: ${entry.title}`)
                      }
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border text-lg transition-colors ${
                        on
                          ? 'border-brand-500 bg-brand-600 text-white'
                          : 'border-line bg-surface text-ink-muted hover:border-brand-300 hover:text-brand-700'
                      }`}
                    >
                      <span aria-hidden>★</span>
                    </button>
                  </Card>
                )
              })}
            </ul>
          </li>
        ))}
      </ol>

      <DemoNote>
        {L(
          'Это ориентировочные периоды подачи, а не подтверждённые даты. Каждая карточка ведёт на официальную страницу, где дату нужно сверить.',
          'Бұл — расталған күндер емес, болжамды өтінім кезеңдері. Әр карточка күнін тексеру қажет ресми бетке апарады.',
        )}
      </DemoNote>
    </div>
  )
}
