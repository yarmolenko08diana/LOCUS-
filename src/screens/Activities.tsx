import { Link } from 'react-router-dom'
import { Badge, Card, Empty, SectionTitle } from '../components/ui'
import { useApp } from '../store/app'
import { useL } from '../i18n/LangContext'
import { ACHIEVEMENT_KIND_EMOJI, ACHIEVEMENT_KIND_LABEL } from '../data/taxonomy'

export function Activities() {
  const { activities, achievements, completed } = useApp()
  const L = useL()

  if (!completed) {
    return (
      <Empty
        title={L('Сначала заполни анкету', 'Алдымен сауалнаманы толтыр')}
        description={L(
          'Активности подбираются под направление и под то, чего в твоём профиле пока нет.',
          'Белсенділіктер бағытыңа және профиліңде әзірге жоқ нәрсеге қарай таңдалады.',
        )}
        action={
          <Link to="/survey" className="font-semibold text-brand-700 underline">
            {L('Перейти к анкете', 'Сауалнамаға өту')}
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-5 animate-fade-up">
      <SectionTitle
        eyebrow={L('Что усилит заявку', 'Өтінімді не күшейтеді')}
        title={L('Активности под твой профиль', 'Профиліңе сай белсенділіктер')}
        description={L(
          'Эссе, волонтёрство, исследования, CV, хакатоны и конкурсы. Список строится от пробелов: то, что у тебя уже есть, опускается ниже.',
          'Эссе, волонтёрлық, зерттеу, CV, хакатондар мен байқаулар. Тізім олқылықтардан құралады: бұрыннан барың төмен түседі.',
        )}
      />

      <Card className="p-5">
        <p className="label mb-2">{L('Сейчас в профиле', 'Қазір профильде')}</p>
        {achievements.count === 0 ? (
          <p className="text-[15px] leading-relaxed text-ink-soft">
            {L(
              'Достижений пока нет. Это не приговор: часть вузов смотрит только на баллы. Но там, где заявку читают целиком, пустой профиль заметно снижает шансы.',
              'Әзірге жетістік жоқ. Бұл — үкім емес: кейбір жоғары оқу орындары тек балға қарайды. Бірақ өтінімді толық оқитын жерде бос профиль мүмкіндікті айтарлықтай азайтады.',
            )}
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(achievements.byKind).map(([kind, n]) => (
                <Badge key={kind} tone="brand">
                  <span aria-hidden>{ACHIEVEMENT_KIND_EMOJI[kind as keyof typeof ACHIEVEMENT_KIND_EMOJI]}</span>
                  {ACHIEVEMENT_KIND_LABEL[kind as keyof typeof ACHIEVEMENT_KIND_LABEL]} · {n}
                </Badge>
              ))}
            </div>
            {achievements.highlights.length > 0 && (
              <ul className="mt-3 space-y-1">
                {achievements.highlights.map((h, i) => (
                  <li key={i} className="text-sm leading-relaxed text-ink-soft">
                    {h}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
        <Link
          to="/survey"
          className="mt-3 -m-2 inline-block p-2 text-sm font-semibold text-brand-700 underline underline-offset-2"
        >
          {L('Добавить достижение в анкете', 'Сауалнамада жетістік қосу')}
        </Link>
      </Card>

      <ul className="space-y-3">
        {activities.map((s) => (
          <Card as="li" key={s.idea.id} className="p-5">
            <div className="flex items-start gap-3">
              <span aria-hidden className="mt-0.5 shrink-0 text-xl">
                {ACHIEVEMENT_KIND_EMOJI[s.idea.kind]}
              </span>
              <div className="min-w-0">
                <h2 className="text-[17px] font-bold leading-tight">{s.idea.title}</h2>
                <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">{s.idea.why}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge tone="brand">{s.hint}</Badge>
                  <Badge>{s.idea.effort}</Badge>
                </div>
                {s.idea.source && (
                  <a
                    href={s.idea.source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 -m-2 inline-block p-2 text-sm font-semibold text-brand-700 underline underline-offset-2"
                  >
                    {s.idea.source.label}
                  </a>
                )}
              </div>
            </div>
          </Card>
        ))}
      </ul>
    </div>
  )
}
