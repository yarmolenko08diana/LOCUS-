import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge, Button, Card, DemoNote, Meter, SectionTitle } from '../components/ui'
import { useApp } from '../store/app'
import {
  BUDGET_LABEL, COUNTRY_FLAG, COUNTRY_LABEL, ENGLISH_LEVELS,
  FIELD_LABEL, STAGE_LABEL,
} from '../data/taxonomy'
import type { Diagnosis as DiagnosisData, Profile } from '../types'
import { effectiveIelts } from '../engine/match'
import { llmAvailable, rephraseDiagnosis } from '../engine/ai'
import { countOf } from '../lib/text'
import { EXAM_LABEL } from '../data/taxonomy'

/**
 * Резюме профиля. По умолчанию — текст движка; если в окружении настроен
 * прокси к языковой модели, текст мягко заменяется на переформулированный.
 */
function Summary({ profile, diagnosis }: { profile: Profile; diagnosis: DiagnosisData }) {
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
          Формулировка переписана языковой моделью; факты взяты из твоей анкеты.
        </p>
      )}
    </>
  )
}

export function Diagnosis() {
  const { profile, diagnosis, recommendations, completed } = useApp()
  const navigate = useNavigate()

  if (!completed) {
    return (
      <Card className="p-8 text-center">
        <h1 className="text-xl font-bold">Сначала анкета</h1>
        <p className="mt-2 text-[15px] text-ink-soft">Диагностика строится из твоих ответов.</p>
        <Button className="mt-5" onClick={() => navigate('/survey')}>Заполнить анкету</Button>
      </Card>
    )
  }

  const english = ENGLISH_LEVELS.find((e) => e.id === profile.english)!
  const top = recommendations[0]

  return (
    <div className="animate-fade-up space-y-8">
      <header>
        <p className="label mb-2">Шаг 2 · Диагностика</p>
        <h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.02em] sm:text-4xl">
          {profile.name ? `${profile.name}, вот как выглядит твой профиль` : 'Вот как выглядит твой профиль'}
        </h1>
        <Summary profile={profile} diagnosis={diagnosis} />
      </header>

      <Card className="bg-brand-900 p-6 text-white sm:p-7">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-brand-300">Образовательная цель</p>
        <p className="mt-2 text-[19px] font-bold leading-snug sm:text-[22px]">{diagnosis.goal}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-semibold">{STAGE_LABEL[profile.stage]}</span>
          <span className="rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-semibold">
            Средний балл {profile.gpa.toFixed(1)}
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-semibold">
            Английский {english.label}
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-semibold">
            {BUDGET_LABEL[profile.budget]}
          </span>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <span aria-hidden className="grid h-7 w-7 place-items-center rounded-lg bg-mint-50 text-mint-600">↑</span>
            <h2 className="text-[17px] font-bold">Что играет за тебя</h2>
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
            <h2 className="text-[17px] font-bold">Что ограничивает выбор</h2>
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
          eyebrow="Данные, на которых построен подбор"
          title="Твой профиль"
          action={
            <Link to="/survey" className="text-[13px] font-bold text-brand-600 underline underline-offset-2">
              Изменить
            </Link>
          }
        />
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <div>
            <dt className="label mb-1.5">Направления</dt>
            <dd className="flex flex-wrap gap-1.5">
              {profile.fields.map((f, i) => (
                <Badge key={f} tone={i === 0 ? 'brand' : 'neutral'}>
                  {FIELD_LABEL[f]}{i === 0 ? ' · главное' : ''}
                </Badge>
              ))}
            </dd>
          </div>
          <div>
            <dt className="label mb-1.5">Страны</dt>
            <dd className="flex flex-wrap gap-1.5">
              {profile.countries.map((c) => (
                <Badge key={c}>{COUNTRY_FLAG[c]} {COUNTRY_LABEL[c]}</Badge>
              ))}
              {profile.relocation && <Badge tone="mint">готовность к переезду</Badge>}
            </dd>
          </div>
          <div>
            <dt className="label mb-1.5">Экзамены</dt>
            <dd className="text-[14px] leading-relaxed text-ink-soft">
              {[
                profile.exams.ent !== undefined ? `ЕНТ ${profile.exams.ent}` : null,
                profile.exams.ielts !== undefined ? `IELTS ${profile.exams.ielts}` : null,
                profile.exams.sat !== undefined ? `SAT ${profile.exams.sat}` : null,
              ].filter(Boolean).join(' · ') || 'Баллов пока нет'}
              {profile.exams.planned.length > 0 && (
                <span className="block text-ink-muted">
                  Планируется: {profile.exams.planned.map((e) => EXAM_LABEL[e]).join(', ')}
                </span>
              )}
              <span className="block text-ink-muted">
                Оценка уровня английского ≈ IELTS {effectiveIelts(profile).toFixed(1)}
              </span>
            </dd>
          </div>
          <div>
            <dt className="label mb-1.5">Сильные предметы</dt>
            <dd className="text-[14px] leading-relaxed text-ink-soft">
              {profile.strongSubjects.length ? profile.strongSubjects.join(', ') : 'не отмечены'}
            </dd>
          </div>
        </dl>

        <div className="mt-6 border-t border-line pt-4">
          <Meter
            value={diagnosis.readiness}
            tone={diagnosis.readiness >= 85 ? 'mint' : diagnosis.readiness >= 60 ? 'brand' : 'sun'}
            label="Полнота профиля"
            sublabel={`${diagnosis.readiness}%`}
          />
          <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">{diagnosis.readinessNote}</p>
        </div>
      </Card>

      {top && (
        <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="label mb-1.5">Что дальше</p>
            <p className="text-[17px] font-bold leading-snug">
              Мы подобрали {countOf(
                recommendations.filter((r) => r.score >= 45).length,
                'подходящую программу', 'подходящие программы', 'подходящих программ',
              )}
            </p>
            <p className="mt-1 text-[14px] text-ink-soft">
              Лучшее совпадение — {top.program.universityShort}, {top.score}%. Дальше объясним, почему.
            </p>
          </div>
          <Button size="lg" onClick={() => navigate('/matches')} className="shrink-0">
            К рекомендациям <span aria-hidden>→</span>
          </Button>
        </Card>
      )}

      <DemoNote />
    </div>
  )
}
