import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge, Button, Card, DemoNote, Empty, Meter } from '../components/ui'
import { CHANCE_META, chanceLabel, money, tuitionLabel } from '../components/ProgramCard'
import { useApp } from '../store/app'
import { useL } from '../i18n/LangContext'
import { COUNTRY_FLAG, COUNTRY_LABEL, LANGUAGE_LABEL } from '../data/taxonomy'
import { countryNote } from '../data/countryNotes'
import { WEIGHTS, WEIGHT_LABEL, scoreLabel } from '../engine/match'
import type { ReasonTone, ScoreBreakdown } from '../types'

const FACTOR_MARK: Record<ReasonTone, { sign: string; className: string }> = {
  good: { sign: '✓', className: 'bg-mint-50 text-mint-600' },
  neutral: { sign: '•', className: 'bg-brand-50 text-brand-600' },
  watch: { sign: '!', className: 'bg-coral-50 text-coral-600' },
}

/** Насколько вуз смотрит на портфолио целиком: 1 — только баллы, 5 — вся заявка. */
function holisticLabel(level: number, L: (ru: string, kk: string) => string): string {
  if (level >= 4) return L('Смотрят на всю заявку: достижения, эссе, активности', 'Бүкіл өтінімді қарайды: жетістіктер, эссе, белсенділік')
  if (level === 3) return L('Баллы решают, но достижения заметно помогают', 'Балл шешеді, бірақ жетістіктер айтарлықтай көмектеседі')
  return L('Решают в основном баллы и экзамены', 'Негізінен балл мен емтихан шешеді')
}

export function ProgramDetail() {
  const { id } = useParams<{ id: string }>()
  const { recommendations, compare, toggleCompare, saved, toggleSaved, completed } = useApp()
  const L = useL()
  const navigate = useNavigate()
  const rec = recommendations.find((r) => r.program.id === id)

  if (!completed || !rec) {
    return (
      <Empty
        title={L('Программа не найдена', 'Бағдарлама табылмады')}
        description={L(
          'Возможно, ссылка устарела или профиль ещё не заполнен.',
          'Сілтеме ескірген болуы мүмкін немесе профиль әлі толтырылмаған.',
        )}
        action={<Button onClick={() => navigate('/matches')}>{L('К рекомендациям', 'Ұсыныстарға')}</Button>}
      />
    )
  }

  const { program: p, chance } = rec
  const chanceMeta = CHANCE_META[chance.level]
  const keys = Object.keys(rec.breakdown) as (keyof ScoreBreakdown)[]
  const note = countryNote(p.country)

  return (
    <div className="animate-fade-up space-y-6">
      <Link to="/matches" className="inline-flex items-center gap-1.5 text-[14px] font-bold text-ink-muted hover:text-brand-700">
        <span aria-hidden>←</span> {L('К рекомендациям', 'Ұсыныстарға')}
      </Link>

      <header>
        <p className="text-[13px] font-semibold text-ink-muted">
          {COUNTRY_FLAG[p.country]} {COUNTRY_LABEL[p.country]}, {p.city}
        </p>
        <h1 className="mt-2 text-[28px] font-extrabold leading-tight tracking-[-0.02em] sm:text-4xl">{p.program}</h1>
        <p className="mt-1.5 text-[17px] font-bold text-ink-soft">{p.university}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone="brand">{rec.score}% · {scoreLabel(rec.score)}</Badge>
          <Badge tone={chanceMeta.tone}>{chanceLabel(chance.level)}</Badge>
          {p.grant.available && <Badge tone="mint">{L('Есть грант', 'Грант бар')}</Badge>}
          <Badge>{p.durationYears} {L('года', 'жыл')}</Badge>
          <Badge>{p.languages.map((l) => LANGUAGE_LABEL[l]).join(', ')}</Badge>
        </div>
      </header>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => toggleCompare(p.id)} variant={compare.includes(p.id) ? 'secondary' : 'primary'}>
          {compare.includes(p.id) ? L('В сравнении ✓', 'Салыстыруда ✓') : L('Добавить к сравнению', 'Салыстыруға қосу')}
        </Button>
        <Button variant="secondary" onClick={() => toggleSaved(p.id)}>
          {saved.includes(p.id) ? L('★ В избранном', '★ Таңдаулыда') : L('☆ Сохранить', '☆ Сақтау')}
        </Button>
        <a
          href={p.source.url}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex h-11 items-center rounded-xl border border-line bg-surface px-4 text-[15px] font-semibold text-ink-soft transition-colors hover:border-brand-300 hover:text-brand-700"
        >
          {L('Официальный сайт', 'Ресми сайт')} ↗
        </a>
      </div>

      <Card className="p-5">
        <h2 className="text-[19px] font-extrabold">{L('Почему подходит именно тебе', 'Дәл саған неге келеді')}</h2>
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
            <h3 className="mt-6 text-[15px] font-bold">{L('На что обратить внимание', 'Неге назар аудару керек')}</h3>
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
        <h2 className="text-[19px] font-extrabold">
          {L(`Из чего сложились ${rec.score}%`, `${rec.score}% неден құралды`)}
        </h2>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">
          {L(
            'Подбор не скрывает логику: каждый критерий имеет фиксированный вес, а полоска показывает, сколько из этого веса набрала программа по твоему профилю.',
            'Таңдау логикасы жасырын емес: әр өлшемнің тұрақты салмағы бар, ал жолақ бағдарламаның сенің профиліңе қарай сол салмақтан қаншасын жинағанын көрсетеді.',
          )}
        </p>
        <div className="mt-5 space-y-4">
          {keys.map((k) => (
            <div key={k}>
              <Meter
                value={(rec.breakdown[k] / WEIGHTS[k]) * 100}
                tone={rec.breakdown[k] / WEIGHTS[k] >= 0.7 ? 'mint' : rec.breakdown[k] / WEIGHTS[k] >= 0.4 ? 'brand' : 'coral'}
                label={WEIGHT_LABEL[k]}
                sublabel={L(`${rec.breakdown[k].toFixed(1)} из ${WEIGHTS[k]}`, `${WEIGHTS[k]}-тен ${rec.breakdown[k].toFixed(1)}`)}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-[19px] font-extrabold">{L('Ориентировочные шансы', 'Болжамды мүмкіндік')}</h2>
        <div className="mt-3 flex items-center gap-3">
          <Badge tone={chanceMeta.tone} className="text-[14px]">{chanceLabel(chance.level)}</Badge>
        </div>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{chance.explanation}</p>

        {chance.factors.length > 0 && (
          <>
            <h3 className="mt-5 text-[15px] font-bold">{L('Как сложилась эта оценка', 'Бұл баға қалай шықты')}</h3>
            <ul className="mt-3 space-y-2.5">
              {chance.factors.map((f) => {
                const mark = FACTOR_MARK[f.tone]
                return (
                  <li key={f.label} className="flex gap-3 rounded-xl bg-paper px-3.5 py-3">
                    <span
                      aria-hidden
                      className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[12px] font-bold ${mark.className}`}
                    >
                      {mark.sign}
                    </span>
                    <p className="text-[14px] leading-relaxed text-ink-soft">
                      <span className="font-bold text-ink">{f.label}: </span>{f.verdict}
                    </p>
                  </li>
                )
              })}
            </ul>
            <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
              {holisticLabel(p.holistic, L)} · {L('вес портфолио', 'портфолио салмағы')} {p.holistic}/5
            </p>
          </>
        )}

        {chance.gaps.length > 0 && (
          <>
            <h3 className="mt-5 text-[15px] font-bold">{L('Что закрыть до подачи', 'Өтінімге дейін не жабу керек')}</h3>
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
          {L(
            'Это ориентир на демонстрационных данных, а не прогноз и не гарантия поступления. Реальный конкурс зависит от количества заявок в конкретном году.',
            'Бұл — демонстрациялық деректерге негізделген бағдар, болжам да, түсу кепілдігі де емес. Нақты бәсеке сол жылғы өтінім санына байланысты.',
          )}
        </DemoNote>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-[17px] font-bold">{L('Деньги', 'Қаржы')}</h2>
          <dl className="mt-3 space-y-3">
            <div className="flex justify-between gap-4">
              <dt className="text-[14px] text-ink-muted">{L('Обучение', 'Оқу')}</dt>
              <dd className="text-right text-[14px] font-bold">{tuitionLabel(rec)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[14px] text-ink-muted">{L('Проживание', 'Тұру')}</dt>
              <dd className="text-right text-[14px] font-bold">≈ {money(p.livingUsd)} {L('в месяц', 'айына')}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-line pt-3">
              <dt className="text-[14px] font-semibold">{L('Год целиком', 'Толық жыл')}</dt>
              <dd className="text-right text-[16px] font-extrabold tabular-nums text-brand-600">≈ {money(rec.yearlyCostUsd)}</dd>
            </div>
          </dl>
          <p className="mt-3 rounded-xl bg-paper px-3.5 py-3 text-[13px] leading-relaxed text-ink-soft">
            {p.grant.available
              ? p.grant.note
              : L(
                  'Грантов для международных студентов на этой программе в демо-наборе нет.',
                  'Демо-жинақта бұл бағдарламада шетелдік студенттерге арналған грант жоқ.',
                )}
          </p>
        </Card>

        <Card className="p-5">
          <h2 className="text-[17px] font-bold">{L('Требования', 'Талаптар')}</h2>
          <ul className="mt-3 space-y-2.5">
            {[
              p.requirements.ent !== undefined ? L(`ЕНТ от ${p.requirements.ent} баллов`, `ҰБТ ${p.requirements.ent} балдан`) : null,
              p.requirements.ielts !== undefined ? L(`IELTS от ${p.requirements.ielts}`, `IELTS ${p.requirements.ielts}-тен`) : null,
              p.requirements.toefl !== undefined ? L(`TOEFL iBT от ${p.requirements.toefl}`, `TOEFL iBT ${p.requirements.toefl}-тен`) : null,
              p.requirements.sat !== undefined ? L(`SAT от ${p.requirements.sat}`, `SAT ${p.requirements.sat}-тен`) : null,
              p.requirements.ib !== undefined ? L(`Диплом IB от ${p.requirements.ib}`, `IB дипломы ${p.requirements.ib}-тен`) : null,
              p.requirements.gpa !== undefined
                ? L(`Средний балл от ${p.requirements.gpa.toFixed(1)}`, `Орташа балл ${p.requirements.gpa.toFixed(1)}-тен`)
                : null,
              p.requirements.portfolio ? L('Портфолио работ', 'Жұмыстар портфолиосы') : null,
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
          <h3 className="mt-5 text-[15px] font-bold">{L('Периоды подачи', 'Өтінім беру кезеңдері')}</h3>
          <ul className="mt-2.5 space-y-2">
            {p.deadlines.map((d) => (
              <li key={d.label} className="flex justify-between gap-3 text-[14px]">
                <span className="text-ink-muted">{d.label}</span>
                <span className="text-right font-bold">{d.window}</span>
              </li>
            ))}
          </ul>
          <DemoNote className="mt-3">
            {L('Периоды ориентировочные. Точные даты — на странице приёма:', 'Кезеңдер болжамды. Нақты күндер — қабылдау бетінде:')}{' '}
            <a href={p.source.url} target="_blank" rel="noreferrer noopener" className="font-semibold underline underline-offset-2">
              {p.source.label} ↗
            </a>
          </DemoNote>
        </Card>
      </div>

      {note && (
        <Card className="p-5">
          <h2 className="text-[17px] font-bold">
            {L('Зачем эта страна', 'Бұл ел не үшін')}: {COUNTRY_FLAG[p.country]} {COUNTRY_LABEL[p.country]}
          </h2>
          <p className="mt-1.5 text-[14px] font-bold text-brand-600">{L(note.angle, note.angleKk)}</p>
          <ul className="mt-3 space-y-2.5">
            {note.facts.map((f) => (
              <li key={f.ru} className="flex gap-2.5 text-[14px] leading-relaxed text-ink-soft">
                <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-mint-400" />
                <span>{L(f.ru, f.kk)}</span>
              </li>
            ))}
          </ul>
          <DemoNote className="mt-3">
            {L('Условия по стране меняются. Сверяйте на официальном портале:', 'Ел бойынша шарттар өзгереді. Ресми порталда тексеріңіз:')}{' '}
            <a href={note.source.url} target="_blank" rel="noreferrer noopener" className="font-semibold underline underline-offset-2">
              {note.source.label} ↗
            </a>
          </DemoNote>
        </Card>
      )}

      <Card className="p-5">
        <h2 className="text-[17px] font-bold">{L('Что даёт программа', 'Бағдарлама не береді')}</h2>
        <ul className="mt-3 grid gap-2.5 sm:grid-cols-3">
          {p.highlights.map((h) => (
            <li key={h} className="rounded-xl bg-paper px-3.5 py-3 text-[14px] leading-relaxed text-ink-soft">{h}</li>
          ))}
        </ul>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" size="lg" onClick={() => navigate('/compare')}>{L('К сравнению', 'Салыстыруға')}</Button>
        <Button size="lg" onClick={() => navigate('/roadmap')}>{L('К плану', 'Жоспарға')} <span aria-hidden>→</span></Button>
      </div>
    </div>
  )
}
