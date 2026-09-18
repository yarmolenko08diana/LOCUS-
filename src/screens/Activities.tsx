import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, Empty, Meter, SectionTitle } from '../components/ui'
import { useApp } from '../store/app'
import { useL } from '../i18n/LangContext'
import { ACHIEVEMENT_KIND_EMOJI, ACHIEVEMENT_KIND_LABEL } from '../data/taxonomy'
import type { CriterionState, EssayReview } from '../engine/essay'
import type { ActivitySuggestion } from '../engine/activities'
import type { AchievementKind } from '../types'

/**
 * Активности сгруппированы по тому, для чего они нужны, а не свалены в один
 * список: документы заявки готовятся за вечер, академическая часть — за
 * месяцы, и смешивать их в одном столбце значит прятать срочное за долгим.
 */
const GROUPS: { id: string; title: string; titleKk: string; note: string; noteKk: string; kinds: AchievementKind[] }[] = [
  {
    id: 'docs',
    title: 'Документы заявки',
    titleKk: 'Өтінім құжаттары',
    note: 'Делается за вечер или выходные, но именно это читают первым',
    noteKk: 'Бір кеште немесе демалыста жасалады, бірақ дәл осыны бірінші оқиды',
    kinds: ['project', 'course'],
  },
  {
    id: 'academic',
    title: 'Академическая часть',
    titleKk: 'Академиялық бөлім',
    note: 'Требует месяцев, зато весит больше всего там, где заявку читают целиком',
    noteKk: 'Айларды талап етеді, бірақ өтінімді тұтас оқитын жерде ең көп салмақ түседі',
    kinds: ['olympiad', 'research', 'hackathon', 'contest'],
  },
  {
    id: 'experience',
    title: 'Опыт и люди',
    titleKk: 'Тәжірибе және адамдар',
    note: 'Даёт материал для эссе и рекомендательных писем',
    noteKk: 'Эссе мен ұсыныс хаттарына материал береді',
    kinds: ['volunteer', 'leadership', 'internship', 'sport', 'art'],
  },
]

const STATES: { id: CriterionState; label: string; labelKk: string }[] = [
  { id: 'yes', label: 'Готово', labelKk: 'Дайын' },
  { id: 'partly', label: 'Частично', labelKk: 'Ішінара' },
  { id: 'no', label: 'Нет', labelKk: 'Жоқ' },
]

const IMPORTANCE_TONE = { high: 'coral', medium: 'sun', low: 'neutral' } as const

function ActivityRow({ s, index }: { s: ActivitySuggestion; index: number }) {
  return (
    <li className="flex gap-3 border-t border-line py-4 first:border-t-0 first:pt-0">
      <span
        aria-hidden
        className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-paper text-[13px] font-bold text-ink-muted"
      >
        {index}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-[15.5px] font-bold leading-snug">
          <span aria-hidden className="mr-1.5">{ACHIEVEMENT_KIND_EMOJI[s.idea.kind]}</span>
          {s.idea.title}
        </h3>
        <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">{s.idea.why}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-muted">
          <span className="font-semibold text-brand-600">{s.hint}</span>
          <span>{s.idea.effort}</span>
          {s.idea.source && (
            <a
              href={s.idea.source.url}
              target="_blank"
              rel="noreferrer noopener"
              className="font-semibold underline underline-offset-2 hover:text-brand-700"
            >
              {s.idea.source.label} ↗
            </a>
          )}
        </div>
      </div>
    </li>
  )
}

function EssayCard({ review }: { review: EssayReview }) {
  const L = useL()
  const { essay, setEssayAnswer } = useApp()
  const [open, setOpen] = useState(false)
  const done = review.doc.criteria.length - review.todo.length

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[17px] font-bold">{L(review.doc.title, review.doc.titleKk)}</h3>
          <p className="mt-1 text-[13.5px] leading-relaxed text-ink-muted">{L(review.doc.when, review.doc.whenKk)}</p>
        </div>
        <Badge tone={IMPORTANCE_TONE[review.importance]}>
          {review.importance === 'high'
            ? L('Важно для твоей подборки', 'Тізіміңе маңызды')
            : review.importance === 'medium'
              ? L('Пригодится', 'Керек болады')
              : L('Запасной документ', 'Қосалқы құжат')}
        </Badge>
      </div>

      <p className="mt-2.5 text-[14px] leading-relaxed text-ink-soft">{review.importanceNote}</p>

      <div className="mt-4">
        <Meter
          value={review.readiness}
          tone={review.readiness >= 85 ? 'mint' : review.readiness >= 45 ? 'brand' : 'coral'}
          label={L('Закрыто требований', 'Жабылған талаптар')}
          sublabel={`${done} / ${review.doc.criteria.length}`}
        />
      </div>
      <p className="mt-2.5 text-[14px] font-semibold leading-relaxed">{review.verdict}</p>

      <Button variant="secondary" className="mt-4" full onClick={() => setOpen((v) => !v)}>
        {open ? L('Свернуть требования', 'Талаптарды жию') : L('Разобрать по требованиям', 'Талаптар бойынша талдау')}
      </Button>

      {open && (
        <ul className="mt-4 space-y-4">
          {review.doc.criteria.map((c) => {
            const state = essay[c.id] ?? 'no'
            return (
              <li key={c.id} className="border-t border-line pt-4 first:border-t-0 first:pt-0">
                <p className="text-[14.5px] font-bold leading-snug">{L(c.title, c.titleKk)}</p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-ink-soft">{L(c.why, c.whyKk)}</p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {STATES.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setEssayAnswer(c.id, st.id)}
                      aria-pressed={state === st.id}
                      className={`h-9 rounded-full border px-3.5 text-[13px] font-semibold transition-colors ${
                        state === st.id
                          ? 'border-brand-500 bg-brand-50 text-brand-900'
                          : 'border-line bg-surface text-ink-soft hover:border-brand-300'
                      }`}
                    >
                      {L(st.label, st.labelKk)}
                    </button>
                  ))}
                </div>
                {state !== 'yes' && (
                  <p className="mt-2.5 rounded-xl bg-paper px-3.5 py-2.5 text-[13.5px] leading-relaxed text-ink-soft">
                    <span className="font-bold text-ink">{L('Что сделать: ', 'Не істеу керек: ')}</span>
                    {L(c.fix, c.fixKk)}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

export function Activities() {
  const { activities, achievements, essays, completed } = useApp()
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

  const grouped = GROUPS.map((g) => ({
    group: g,
    items: activities.filter((a) => g.kinds.includes(a.idea.kind)),
  })).filter((g) => g.items.length > 0)

  return (
    <div className="animate-fade-up space-y-8">
      <SectionTitle
        eyebrow={L('Что усилит заявку', 'Өтінімді не күшейтеді')}
        title={L('Активности под твой профиль', 'Профиліңе сай белсенділіктер')}
        description={L(
          'Список строится от пробелов: то, чего в анкете нет, поднимается наверх, а то, чего у тебя уже три штуки, опускается.',
          'Тізім олқылықтардан құралады: сауалнамада жоғы жоғары көтеріледі, үшеуден барың төмен түседі.',
        )}
      />

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="label mb-2">{L('Сейчас в профиле', 'Қазір профильде')}</p>
            {achievements.count === 0 ? (
              <p className="max-w-2xl text-[15px] leading-relaxed text-ink-soft">
                {L(
                  'Достижений пока нет. Это не приговор: часть вузов смотрит только на баллы. Но там, где заявку читают целиком, пустой профиль заметно снижает шансы.',
                  'Әзірге жетістік жоқ. Бұл — үкім емес: кейбір ЖОО тек балға қарайды. Бірақ өтінімді тұтас оқитын жерде бос профиль мүмкіндікті айтарлықтай азайтады.',
                )}
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(achievements.byKind).map(([kind, n]) => (
                  <Badge key={kind} tone="brand">
                    <span aria-hidden>{ACHIEVEMENT_KIND_EMOJI[kind as AchievementKind]}</span>
                    {ACHIEVEMENT_KIND_LABEL[kind as AchievementKind]} · {n}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="w-full shrink-0 sm:w-56">
            <Meter
              value={Math.round(achievements.strength * 100)}
              tone={achievements.strength >= 0.6 ? 'mint' : achievements.strength >= 0.3 ? 'brand' : 'coral'}
              label={L('Сила профиля', 'Профиль күші')}
              sublabel={`${Math.round(achievements.strength * 100)}%`}
            />
            <Link
              to="/survey"
              className="mt-2 inline-block text-[13px] font-semibold text-brand-700 underline underline-offset-2"
            >
              {L('Добавить достижение', 'Жетістік қосу')}
            </Link>
          </div>
        </div>
        {achievements.highlights.length > 0 && (
          <ul className="mt-3 space-y-1 border-t border-line pt-3">
            {achievements.highlights.map((h, i) => (
              <li key={i} className="text-[13.5px] leading-relaxed text-ink-soft">{h}</li>
            ))}
          </ul>
        )}
      </Card>

      <section>
        <h2 className="text-lg font-bold tracking-[-0.01em]">{L('Тексты заявки', 'Өтінім мәтіндері')}</h2>
        <p className="mt-1.5 max-w-2xl text-[14.5px] leading-relaxed text-ink-soft">
          {L(
            'Эссе и study plan — единственная часть заявки, где нет проходного балла. Здесь не оценка текста, а разбор по требованиям: что комиссия ищет и что у тебя уже закрыто.',
            'Эссе мен study plan — өтінімнің өту балы жоқ жалғыз бөлігі. Мұнда мәтінге баға емес, талаптар бойынша талдау: комиссия нені іздейді және сенде не жабылған.',
          )}
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {essays.map((r) => (
            <EssayCard key={r.doc.id} review={r} />
          ))}
        </div>
      </section>

      {grouped.map(({ group, items }) => (
        <section key={group.id}>
          <h2 className="text-lg font-bold tracking-[-0.01em]">{L(group.title, group.titleKk)}</h2>
          <p className="mt-1 text-[14px] text-ink-muted">{L(group.note, group.noteKk)}</p>
          <Card className="mt-3 p-5">
            <ul>
              {items.map((s, i) => (
                <ActivityRow key={s.idea.id} s={s} index={i + 1} />
              ))}
            </ul>
          </Card>
        </section>
      ))}
    </div>
  )
}
