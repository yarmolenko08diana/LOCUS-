import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge, Button, Card, DemoNote, Empty, Meter } from '../components/ui'
import { CHANCE_META, money, tuitionLabel } from '../components/ProgramCard'
import { useApp } from '../store/app'
import { COUNTRY_FLAG, COUNTRY_LABEL, LANGUAGE_LABEL } from '../data/taxonomy'
import { WEIGHTS, WEIGHT_LABEL, scoreLabel } from '../engine/match'
import type { ScoreBreakdown } from '../types'

export function ProgramDetail() {
  const { id } = useParams<{ id: string }>()
  const { recommendations, compare, toggleCompare, saved, toggleSaved, completed } = useApp()
  const navigate = useNavigate()
  const rec = recommendations.find((r) => r.program.id === id)

  if (!completed || !rec) {
    return (
      <Empty
        title="Программа не найдена"
        description="Возможно, ссылка устарела или профиль ещё не заполнен."
        action={<Button onClick={() => navigate('/matches')}>К рекомендациям</Button>}
      />
    )
  }

  const { program: p, chance } = rec
  const chanceMeta = CHANCE_META[chance.level]
  const keys = Object.keys(rec.breakdown) as (keyof ScoreBreakdown)[]

  return (
    <div className="animate-fade-up space-y-6">
      <Link to="/matches" className="inline-flex items-center gap-1.5 text-[14px] font-bold text-ink-muted hover:text-brand-700">
        <span aria-hidden>←</span> К рекомендациям
      </Link>

      <header>
        <p className="text-[13px] font-semibold text-ink-muted">
          {COUNTRY_FLAG[p.country]} {COUNTRY_LABEL[p.country]}, {p.city}
        </p>
        <h1 className="mt-2 text-[28px] font-extrabold leading-tight tracking-[-0.02em] sm:text-4xl">{p.program}</h1>
        <p className="mt-1.5 text-[17px] font-bold text-ink-soft">{p.university}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone="brand">{rec.score}% · {scoreLabel(rec.score)}</Badge>
          <Badge tone={chanceMeta.tone}>{chanceMeta.label}</Badge>
          {p.grant.available && <Badge tone="mint">Есть грант</Badge>}
          <Badge>{p.durationYears} года</Badge>
          <Badge>{p.languages.map((l) => LANGUAGE_LABEL[l]).join(', ')}</Badge>
        </div>
      </header>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => toggleCompare(p.id)} variant={compare.includes(p.id) ? 'secondary' : 'primary'}>
          {compare.includes(p.id) ? 'В сравнении ✓' : 'Добавить к сравнению'}
        </Button>
        <Button variant="secondary" onClick={() => toggleSaved(p.id)}>
          {saved.includes(p.id) ? '★ В избранном' : '☆ Сохранить'}
        </Button>
        <a
          href={p.source.url}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex h-11 items-center rounded-xl border border-line bg-surface px-4 text-[15px] font-semibold text-ink-soft transition-colors hover:border-brand-300 hover:text-brand-700"
        >
          Официальный сайт ↗
        </a>
      </div>

      <Card className="p-5">
        <h2 className="text-[19px] font-extrabold">Почему подходит именно тебе</h2>
        <ul className="mt-4 space-y-3.5">
          {rec.reasons.map((r, i) => (
            <li key={i} className="flex gap-3">
              <span
                aria-hidden
                className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[12px] font-bold ${
                  r.tone === 'good' ? 'bg-mint-50 text-mint-600' : 'bg-sun-50 text-sun-600'
                }`}
              >
                {r.tone === 'good' ? '✓' : '~'}
              </span>
              <p className="text-[15px] leading-relaxed text-ink-soft">
                <span className="font-bold text-ink">{r.tag}. </span>{r.text}
              </p>
            </li>
          ))}
        </ul>

        {rec.watchouts.length > 0 && (
          <>
            <h3 className="mt-6 text-[15px] font-bold">На что обратить внимание</h3>
            <ul className="mt-3 space-y-2.5">
              {rec.watchouts.map((w, i) => (
                <li key={i} className="flex gap-3 rounded-xl bg-sun-50 px-3.5 py-3">
                  <span aria-hidden className="text-sun-600">!</span>
                  <p className="text-[14px] leading-relaxed text-sun-700">{w.text}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="text-[19px] font-extrabold">Из чего сложились {rec.score}%</h2>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">
          Подбор не скрывает логику: каждый критерий имеет фиксированный вес, а полоска
          показывает, сколько из этого веса набрала программа по твоему профилю.
        </p>
        <div className="mt-5 space-y-4">
          {keys.map((k) => (
            <div key={k}>
              <Meter
                value={(rec.breakdown[k] / WEIGHTS[k]) * 100}
                tone={rec.breakdown[k] / WEIGHTS[k] >= 0.7 ? 'mint' : rec.breakdown[k] / WEIGHTS[k] >= 0.4 ? 'brand' : 'coral'}
                label={WEIGHT_LABEL[k]}
                sublabel={`${rec.breakdown[k].toFixed(1)} из ${WEIGHTS[k]}`}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-[19px] font-extrabold">Ориентировочные шансы</h2>
        <div className="mt-3 flex items-center gap-3">
          <Badge tone={chanceMeta.tone} className="text-[14px]">{chanceMeta.label}</Badge>
        </div>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{chance.explanation}</p>
        {chance.gaps.length > 0 && (
          <>
            <h3 className="mt-5 text-[15px] font-bold">Что закрыть до подачи</h3>
            <ul className="mt-2.5 space-y-2">
              {chance.gaps.map((g) => (
                <li key={g} className="flex gap-2.5 text-[14px] leading-relaxed text-ink-soft">
                  <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-coral-500" />
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </>
        )}
        <DemoNote className="mt-4">
          Это ориентир на демонстрационных данных, а не прогноз и не гарантия поступления.
          Реальный конкурс зависит от количества заявок в конкретном году.
        </DemoNote>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-[17px] font-bold">Деньги</h2>
          <dl className="mt-3 space-y-3">
            <div className="flex justify-between gap-4">
              <dt className="text-[14px] text-ink-muted">Обучение</dt>
              <dd className="text-right text-[14px] font-bold">{tuitionLabel(rec)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[14px] text-ink-muted">Проживание</dt>
              <dd className="text-right text-[14px] font-bold">≈ {money(p.livingUsd)} в месяц</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-line pt-3">
              <dt className="text-[14px] font-semibold">Год целиком</dt>
              <dd className="text-right text-[16px] font-extrabold tabular-nums text-brand-600">≈ {money(rec.yearlyCostUsd)}</dd>
            </div>
          </dl>
          <p className="mt-3 rounded-xl bg-paper px-3.5 py-3 text-[13px] leading-relaxed text-ink-soft">
            {p.grant.available ? p.grant.note : 'Грантов для международных студентов на этой программе в демо-наборе нет.'}
          </p>
        </Card>

        <Card className="p-5">
          <h2 className="text-[17px] font-bold">Требования</h2>
          <ul className="mt-3 space-y-2.5">
            {[
              p.requirements.ent !== undefined ? `ЕНТ от ${p.requirements.ent} баллов` : null,
              p.requirements.ielts !== undefined ? `IELTS от ${p.requirements.ielts}` : null,
              p.requirements.sat !== undefined ? `SAT от ${p.requirements.sat}` : null,
              p.requirements.gpa !== undefined ? `Средний балл от ${p.requirements.gpa.toFixed(1)}` : null,
              p.requirements.portfolio ? 'Портфолио работ' : null,
              p.requirements.entranceExam ?? null,
            ]
              .filter(Boolean)
              .map((t) => (
                <li key={t as string} className="flex gap-2.5 text-[14px] leading-relaxed text-ink-soft">
                  <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                  <span>{t}</span>
                </li>
              ))}
          </ul>
          <h3 className="mt-5 text-[15px] font-bold">Периоды подачи</h3>
          <ul className="mt-2.5 space-y-2">
            {p.deadlines.map((d) => (
              <li key={d.label} className="flex justify-between gap-3 text-[14px]">
                <span className="text-ink-muted">{d.label}</span>
                <span className="text-right font-bold">{d.window}</span>
              </li>
            ))}
          </ul>
          <DemoNote className="mt-3">
            Периоды ориентировочные. Точные даты — на странице приёма:{' '}
            <a href={p.source.url} target="_blank" rel="noreferrer noopener" className="font-semibold underline underline-offset-2">
              {p.source.label} ↗
            </a>
          </DemoNote>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-[17px] font-bold">Что даёт программа</h2>
        <ul className="mt-3 grid gap-2.5 sm:grid-cols-3">
          {p.highlights.map((h) => (
            <li key={h} className="rounded-xl bg-paper px-3.5 py-3 text-[14px] leading-relaxed text-ink-soft">{h}</li>
          ))}
        </ul>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" size="lg" onClick={() => navigate('/compare')}>К сравнению</Button>
        <Button size="lg" onClick={() => navigate('/roadmap')}>К плану <span aria-hidden>→</span></Button>
      </div>
    </div>
  )
}
