import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge, Button, Card, DemoNote, Meter, SectionTitle } from '../components/ui'
import { useApp } from '../store/app'
import { displayName } from '../store/account'
import {
  BUDGET_LABEL, COUNTRY_FLAG, COUNTRY_LABEL, EXAM_LABEL, englishLevels,
  FIELD_LABEL, SCHOOL_SYSTEM_LABEL, STAGE_LABEL, SUBJECT_LABEL,
} from '../data/taxonomy'
import type { Diagnosis as DiagnosisData, Profile } from '../types'
import { effectiveIelts } from '../engine/match'
import { effectiveGpa, gpaSourceLabel } from '../engine/academics'
import { llmAvailable, rephraseDiagnosis } from '../engine/ai'
import { useL } from '../i18n/LangContext'
import { countOf } from '../lib/text'

/**
 * Резюме профиля. По умолчанию — текст движка; если в окружении настроен
 * прокси к языковой модели, текст мягко заменяется на переформулированный.
 */
function Summary({ profile, diagnosis }: { profile: Profile; diagnosis: DiagnosisData }) {
  const L = useL()
  // Текст движка — то, что рендерится сразу. Ответ модели, если он придёт,
  // кладётся сюда и заменяет его; на исходный текст состояние не влияет.
  const [rephrased, setRephrased] = useState<{ source: string; text: string } | null>(null)

  useEffect(() => {
    if (!llmAvailable()) return
    let alive = true
    void rephraseDiagnosis(profile, diagnosis).then((r) => {
      if (alive && r.source === 'llm') setRephrased({ source: diagnosis.summary, text: r.text })
    })
    return () => { alive = false }
  }, [profile, diagnosis])

  const fromLlm = rephrased?.source === diagnosis.summary
  const text = fromLlm ? rephrased!.text : diagnosis.summary

  return (
    <>
      <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-ink-soft">{text}</p>
      {fromLlm && (
        <p className="mt-1.5 text-[12px] font-semibold text-ink-muted">
          {L(
            'Формулировка переписана языковой моделью; факты взяты из твоей анкеты.',
            'Тұжырым тілдік модельмен қайта жазылған; деректер сенің сауалнамаңнан алынған.',
          )}
        </p>
      )}
    </>
  )
}

export function Diagnosis() {
  const { profile, diagnosis, recommendations, completed, achievements, account } = useApp()
  // Имя из аккаунта важнее имени из анкеты: человек вводил его последним.
  const who = displayName(account, profile.name)
  const L = useL()
  const navigate = useNavigate()

  if (!completed) {
    return (
      <Card className="p-8 text-center">
        <h1 className="text-xl font-bold">{L('Сначала анкета', 'Алдымен сауалнама')}</h1>
        <p className="mt-2 text-[15px] text-ink-soft">
          {L('Диагностика строится из твоих ответов.', 'Диагностика сенің жауаптарыңнан құралады.')}
        </p>
        <Button className="mt-5" onClick={() => navigate('/survey')}>
          {L('Заполнить анкету', 'Сауалнаманы толтыру')}
        </Button>
      </Card>
    )
  }

  const english = englishLevels().find((e) => e.id === profile.english)!
  const gpa = effectiveGpa(profile)
  const gpaNote = gpaSourceLabel(profile)
  const top = recommendations[0]

  return (
    <div className="animate-fade-up space-y-8">
      <header>
        <p className="label mb-2">{L('Шаг 2 · Диагностика', '2-қадам · Диагностика')}</p>
        <h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.02em] sm:text-4xl">
          {who
            ? L(`${who}, вот как выглядит твой профиль`, `${who}, профилің осылай көрінеді`)
            : L('Вот как выглядит твой профиль', 'Профилің осылай көрінеді')}
        </h1>
        <Summary profile={profile} diagnosis={diagnosis} />
      </header>

      <Card className="bg-deep p-6 text-deep-ink sm:p-7">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-deep-muted">
          {L('Образовательная цель', 'Білім беру мақсаты')}
        </p>
        <p className="mt-2 text-[19px] font-bold leading-snug sm:text-[22px]">{diagnosis.goal}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full bg-deep-ink/15 px-3 py-1.5 text-[13px] font-semibold">{STAGE_LABEL[profile.stage]}</span>
          <span className="rounded-full bg-deep-ink/15 px-3 py-1.5 text-[13px] font-semibold">
            {SCHOOL_SYSTEM_LABEL[profile.schoolSystem]}
          </span>
          <span className="rounded-full bg-deep-ink/15 px-3 py-1.5 text-[13px] font-semibold">
            {L('Средний балл', 'Орташа бал')} {gpa.toFixed(1)}
          </span>
          <span className="rounded-full bg-deep-ink/15 px-3 py-1.5 text-[13px] font-semibold">
            {L('Английский', 'Ағылшын тілі')} {english.label}
          </span>
          <span className="rounded-full bg-deep-ink/15 px-3 py-1.5 text-[13px] font-semibold">
            {BUDGET_LABEL[profile.budget]}
          </span>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <span aria-hidden className="grid h-7 w-7 place-items-center rounded-lg bg-mint-50 text-mint-600">↑</span>
            <h2 className="text-[17px] font-bold">{L('Что играет за тебя', 'Саған не жұмыс істейді')}</h2>
          </div>
          <ul className="mt-3 space-y-3">
            {diagnosis.strengths.map((s) => (
              <li key={s} className="flex gap-2.5 text-[14px] leading-relaxed text-ink-soft">
                <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-mint-500" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <span aria-hidden className="grid h-7 w-7 place-items-center rounded-lg bg-sun-50 text-sun-600">!</span>
            <h2 className="text-[17px] font-bold">{L('Что ограничивает выбор', 'Таңдауды не шектейді')}</h2>
          </div>
          <ul className="mt-3 space-y-3">
            {diagnosis.constraints.map((s) => (
              <li key={s} className="flex gap-2.5 text-[14px] leading-relaxed text-ink-soft">
                <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-sun-500" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="p-5">
        <SectionTitle
          eyebrow={L('Данные, на которых построен подбор', 'Таңдау негізделген деректер')}
          title={L('Твой профиль', 'Сенің профилің')}
          action={
            <Link
              to="/survey"
              className="-m-2 inline-block p-2 text-[13px] font-bold text-brand-600 underline underline-offset-2"
            >
              {L('Изменить', 'Өзгерту')}
            </Link>
          }
        />
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <div>
            <dt className="label mb-1.5">{L('Направления', 'Бағыттар')}</dt>
            <dd className="flex flex-wrap gap-1.5">
              {profile.fields.map((f, i) => (
                <Badge key={f} tone={i === 0 ? 'brand' : 'neutral'}>
                  {FIELD_LABEL[f]}{i === 0 ? L(' · главное', ' · басты') : ''}
                </Badge>
              ))}
            </dd>
          </div>
          <div>
            <dt className="label mb-1.5">{L('Страны', 'Елдер')}</dt>
            <dd className="flex flex-wrap gap-1.5">
              {profile.countries.map((c) => (
                <Badge key={c}>{COUNTRY_FLAG[c]} {COUNTRY_LABEL[c]}</Badge>
              ))}
              {profile.relocation && (
                <Badge tone="mint">{L('готовность к переезду', 'көшуге дайын')}</Badge>
              )}
            </dd>
          </div>
          <div>
            <dt className="label mb-1.5">{L('Экзамены', 'Емтихандар')}</dt>
            <dd className="text-[14px] leading-relaxed text-ink-soft">
              {[
                profile.exams.ent !== undefined ? `${L('ЕНТ', 'ҰБТ')} ${profile.exams.ent}` : null,
                profile.exams.ielts !== undefined ? `IELTS ${profile.exams.ielts}` : null,
                profile.exams.toefl !== undefined ? `TOEFL ${profile.exams.toefl}` : null,
                profile.exams.sat !== undefined ? `SAT ${profile.exams.sat}` : null,
                profile.exams.ib !== undefined ? `IB ${profile.exams.ib}` : null,
                profile.exams.nis !== undefined ? `${L('НИШ', 'НЗМ')} ${profile.exams.nis}` : null,
              ].filter(Boolean).join(' · ') || L('Баллов пока нет', 'Әзірге бал жоқ')}
              {profile.exams.planned.length > 0 && (
                <span className="block text-ink-muted">
                  {L('Планируется', 'Жоспарланған')}: {profile.exams.planned.map((e) => EXAM_LABEL[e]).join(', ')}
                </span>
              )}
              <span className="block text-ink-muted">
                {L('Оценка уровня английского ≈ IELTS', 'Ағылшын деңгейінің бағасы ≈ IELTS')}{' '}
                {effectiveIelts(profile).toFixed(1)}
              </span>
              {gpaNote && <span className="block text-ink-muted">{gpaNote}</span>}
            </dd>
          </div>
          <div>
            <dt className="label mb-1.5">{L('Сильные предметы', 'Күшті пәндер')}</dt>
            <dd className="text-[14px] leading-relaxed text-ink-soft">
              {profile.strongSubjects.length
                ? profile.strongSubjects.map((s) => SUBJECT_LABEL[s]).join(', ')
                : L('не отмечены', 'белгіленбеген')}
            </dd>
          </div>
          <div>
            <dt className="label mb-1.5">{L('Достижения', 'Жетістіктер')}</dt>
            <dd className="text-[14px] leading-relaxed text-ink-soft">
              {achievements.count > 0
                ? L(
                    `${achievements.count} в анкете, сила профиля ${Math.round(achievements.strength * 100)}%`,
                    `сауалнамада ${achievements.count}, профиль күші ${Math.round(achievements.strength * 100)}%`,
                  )
                : L('пока не добавлены', 'әзірге қосылмаған')}
              {achievements.highlights[0] && (
                <span className="block text-ink-muted">{achievements.highlights[0]}</span>
              )}
            </dd>
          </div>
        </dl>

        <div className="mt-6 border-t border-line pt-4">
          <Meter
            value={diagnosis.readiness}
            tone={diagnosis.readiness >= 85 ? 'mint' : diagnosis.readiness >= 60 ? 'brand' : 'sun'}
            label={L('Полнота профиля', 'Профильдің толықтығы')}
            sublabel={`${diagnosis.readiness}%`}
          />
          <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">{diagnosis.readinessNote}</p>
        </div>
      </Card>

      {top && (
        <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="label mb-1.5">{L('Что дальше', 'Әрі қарай не')}</p>
            <p className="text-[17px] font-bold leading-snug">
              {L(
                `Мы подобрали ${countOf(
                  recommendations.filter((r) => r.score >= 45).length,
                  'подходящую программу', 'подходящие программы', 'подходящих программ',
                )}`,
                `${recommendations.filter((r) => r.score >= 45).length} қолайлы бағдарлама таңдалды`,
              )}
            </p>
            <p className="mt-1 text-[14px] text-ink-soft">
              {L(
                `Лучшее совпадение — ${top.program.universityShort}, ${top.score}%. Дальше объясним, почему.`,
                `Ең жоғары сәйкестік — ${top.program.universityShort}, ${top.score}%. Әрі қарай неге екенін түсіндіреміз.`,
              )}
            </p>
          </div>
          <Button size="lg" onClick={() => navigate('/matches')} className="shrink-0">
            {L('К рекомендациям', 'Ұсыныстарға')} <span aria-hidden>→</span>
          </Button>
        </Card>
      )}

      <DemoNote />
    </div>
  )
}
