import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge, Button, Card, DemoNote, Empty } from '../components/ui'
import { CHANCE_META, chanceLabel, money, tuitionLabel } from '../components/ProgramCard'
import { useApp } from '../store/app'
import { COUNTRY_FLAG, COUNTRY_LABEL, LANGUAGE_LABEL, PRIORITY_LABEL } from '../data/taxonomy'
import { useL } from '../i18n/LangContext'
import { L } from '../i18n/lang'
import { countOf } from '../lib/text'
import type { Recommendation } from '../types'

interface Row {
  label: string
  labelKk: string
  render: (r: Recommendation) => React.ReactNode
  /** Кто выигрывает по этой строке; undefined — сравнение не имеет смысла. */
  best?: (list: Recommendation[]) => string | undefined
}

const ROWS: Row[] = [
  {
    label: 'Совпадение с профилем', labelKk: 'Профильмен сәйкестік',
    render: (r) => <span className="text-[19px] font-extrabold tabular-nums text-brand-600">{r.score}%</span>,
    best: (l) => [...l].sort((a, b) => b.score - a.score)[0].program.id,
  },
  {
    label: 'Ориентировочные шансы', labelKk: 'Болжамды мүмкіндік',
    render: (r) => <Badge tone={CHANCE_META[r.chance.level].tone}>{chanceLabel(r.chance.level)}</Badge>,
  },
  {
    label: 'Страна и город', labelKk: 'Ел және қала',
    render: (r) => `${COUNTRY_FLAG[r.program.country]} ${COUNTRY_LABEL[r.program.country]}, ${r.program.city}`,
  },
  {
    label: 'Стоимость обучения', labelKk: 'Оқу құны',
    render: (r) => tuitionLabel(r),
    best: (l) => [...l].sort((a, b) => a.program.tuitionUsd[0] - b.program.tuitionUsd[0])[0].program.id,
  },
  {
    label: 'Год с проживанием', labelKk: 'Тұрғын үймен бір жыл',
    render: (r) => `≈ ${money(r.yearlyCostUsd)}`,
    best: (l) => [...l].sort((a, b) => a.yearlyCostUsd - b.yearlyCostUsd)[0].program.id,
  },
  {
    label: 'Грант или стипендия', labelKk: 'Грант немесе шәкіртақы',
    render: (r) =>
      r.program.grant.available
        ? r.program.grant.note
        : L('Не предусмотрено для международных студентов', 'Шетелдік студенттерге қарастырылмаған'),
  },
  {
    label: 'Язык обучения', labelKk: 'Оқу тілі',
    render: (r) => r.program.languages.map((l) => LANGUAGE_LABEL[l]).join(', '),
  },
  {
    label: 'Длительность', labelKk: 'Ұзақтығы',
    render: (r) => `${r.program.durationYears} ${L('года', 'жыл')}`,
  },
  {
    label: 'Что нужно для поступления', labelKk: 'Түсу үшін не қажет',
    render: (r) => {
      const req = r.program.requirements
      const parts = [
        req.ent !== undefined ? `${L('ЕНТ от', 'ҰБТ')} ${req.ent}` : null,
        req.ielts !== undefined ? `IELTS ${req.ielts}` : null,
        req.toefl !== undefined ? `TOEFL ${req.toefl}` : null,
        req.sat !== undefined ? `SAT ${req.sat}` : null,
        req.ib !== undefined ? `IB ${req.ib}` : null,
        req.gpa !== undefined ? `${L('средний балл', 'орташа бал')} ${req.gpa.toFixed(1)}` : null,
        req.portfolio ? L('портфолио', 'портфолио') : null,
        req.entranceExam ?? null,
      ].filter(Boolean)
      return parts.length ? parts.join(', ') : L('уточняется на сайте вуза', 'ЖОО сайтында нақтыланады')
    },
  },
  {
    label: 'Ближайший период подачи', labelKk: 'Ең жақын өтінім кезеңі',
    render: (r) => `${r.program.deadlines[0].label}: ${r.program.deadlines[0].window}`,
  },
  {
    label: 'Насколько смотрят на портфолио', labelKk: 'Портфолиоға қаншалық қарайды',
    render: (r) => '●'.repeat(r.program.holistic) + '○'.repeat(5 - r.program.holistic),
    best: (l) => [...l].sort((a, b) => b.program.holistic - a.program.holistic)[0].program.id,
  },
  {
    label: 'Трудоустройство', labelKk: 'Жұмысқа орналасу',
    render: (r) => '★'.repeat(r.program.employability) + '☆'.repeat(5 - r.program.employability),
    best: (l) => [...l].sort((a, b) => b.program.employability - a.program.employability)[0].program.id,
  },
  {
    label: 'Репутация вуза', labelKk: 'ЖОО беделі',
    render: (r) => '★'.repeat(r.program.prestige) + '☆'.repeat(5 - r.program.prestige),
    best: (l) => [...l].sort((a, b) => b.program.prestige - a.program.prestige)[0].program.id,
  },
  {
    label: 'Главное «но»', labelKk: 'Басты «бірақ»',
    render: (r) =>
      r.watchouts.length
        ? r.watchouts[0].text
        : L('Явных препятствий по твоему профилю нет', 'Профилің бойынша айқын кедергі жоқ'),
  },
]

/** Короткий вывод: какой вариант ближе к приоритетам пользователя и почему. */
function verdict(list: Recommendation[], priorities: string[]): { winner: Recommendation; text: string } | null {
  if (list.length < 2) return null
  const winner = [...list].sort((a, b) => b.score - a.score)[0]
  const cheapest = [...list].sort((a, b) => a.yearlyCostUsd - b.yearlyCostUsd)[0]
  const safest = [...list].sort(
    (a, b) => ({ high: 0, medium: 1, unknown: 2, low: 3 })[a.chance.level] - ({ high: 0, medium: 1, unknown: 2, low: 3 })[b.chance.level],
  )[0]

  const bits: string[] = [
    L(
      `По совокупности критериев ближе всего ${winner.program.universityShort} — ${winner.score}% совпадения.`,
      `Өлшемдер жиынтығы бойынша ең жақыны — ${winner.program.universityShort}, ${winner.score}% сәйкестік.`,
    ),
  ]
  if (cheapest.program.id !== winner.program.id) {
    bits.push(
      L(
        `Дешевле выходит ${cheapest.program.universityShort}: около ${money(cheapest.yearlyCostUsd)} за год против ${money(winner.yearlyCostUsd)}.`,
        `Арзанырағы — ${cheapest.program.universityShort}: жылына шамамен ${money(cheapest.yearlyCostUsd)}, ал ${money(winner.yearlyCostUsd)} емес.`,
      ),
    )
  }
  if (safest.program.id !== winner.program.id && safest.chance.level !== winner.chance.level) {
    bits.push(
      L(
        `Надёжнее по проходимости ${safest.program.universityShort}.`,
        `Өту мүмкіндігі бойынша сенімдірегі — ${safest.program.universityShort}.`,
      ),
    )
  }
  if (priorities.length) {
    bits.push(
      L(
        `Как важное отмечено: ${priorities.join(', ').toLowerCase()} — смотри на эти строки в первую очередь.`,
        `Маңызды деп белгіленді: ${priorities.join(', ').toLowerCase()} — ең алдымен осы жолдарға қара.`,
      ),
    )
  }
  return { winner, text: bits.join(' ') }
}

export function Compare() {
  const { recommendations, compare, toggleCompare, completed, profile } = useApp()
  const Lc = useL()
  const navigate = useNavigate()

  const list = useMemo(
    () => compare.map((id) => recommendations.find((r) => r.program.id === id)).filter(Boolean) as Recommendation[],
    [compare, recommendations],
  )
  const conclusion = useMemo(
    () => verdict(list, profile.priorities.map((p) => PRIORITY_LABEL[p])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [list, profile.priorities, Lc],
  )

  if (!completed) {
    return (
      <Empty
        title={Lc('Сравнение появится после анкеты', 'Салыстыру сауалнамадан кейін пайда болады')}
        description={Lc(
          'Сначала нужен профиль, чтобы было что с чем сравнивать.',
          'Салыстыратын нәрсе болу үшін алдымен профиль керек.',
        )}
        action={
          <Button onClick={() => navigate('/survey')}>{Lc('Заполнить анкету', 'Сауалнаманы толтыру')}</Button>
        }
      />
    )
  }

  if (list.length < 2) {
    const suggestions = recommendations.slice(0, 4)
    return (
      <div className="animate-fade-up space-y-6">
        <header>
          <p className="label mb-2">{Lc('Шаг 4 · Сравнение', '4-қадам · Салыстыру')}</p>
          <h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.02em] sm:text-4xl">
            {Lc('Выбери минимум два варианта', 'Кемінде екі нұсқа таңда')}
          </h1>
          <p className="mt-2 max-w-2xl text-[16px] leading-relaxed text-ink-soft">
            {list.length === 1
              ? Lc(
                  'Один вариант уже отмечен. Добавь второй, и мы разложим их по стоимости, требованиям и шансам.',
                  'Бір нұсқа белгіленген. Екіншісін қос, сонда оларды құны, талаптары және мүмкіндігі бойынша жіктейміз.',
                )
              : Lc(
                  'Отметь варианты здесь или кнопкой «Сравнить» на карточках в подборе.',
                  'Нұсқаларды осында немесе таңдаудағы карточкалардың «Салыстыру» түймесімен белгіле.',
                )}
          </p>
        </header>

        <Card className="divide-y divide-line">
          {suggestions.map((r) => {
            const active = compare.includes(r.program.id)
            return (
              <button
                key={r.program.id}
                type="button"
                onClick={() => toggleCompare(r.program.id)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-paper"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-bold">{r.program.program}</span>
                  <span className="block truncate text-[13px] text-ink-muted">
                    {r.program.university} · {r.score}% {Lc('совпадения', 'сәйкестік')}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-lg border px-3 py-1.5 text-[13px] font-bold ${
                    active ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-line text-ink-soft'
                  }`}
                >
                  {active ? Lc('Выбрано ✓', 'Таңдалды ✓') : Lc('Добавить', 'Қосу')}
                </span>
              </button>
            )
          })}
        </Card>

        <Button variant="secondary" full size="lg" onClick={() => navigate('/matches')}>
          {Lc('Вернуться к подбору', 'Таңдауға оралу')}
        </Button>
      </div>
    )
  }

  return (
    <div className="animate-fade-up space-y-6">
      <header>
        <p className="label mb-2">{Lc('Шаг 4 · Сравнение', '4-қадам · Салыстыру')}</p>
        <h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.02em] sm:text-4xl">
          {Lc(`${countOf(list.length, 'вариант', 'варианта', 'вариантов')} рядом`, `${list.length} нұсқа қатар`)}
        </h1>
        <p className="mt-2 max-w-2xl text-[16px] leading-relaxed text-ink-soft">
          {Lc(
            'Зелёной точкой отмечено, где вариант выигрывает по строке.',
            'Жасыл нүкте нұсқаның сол жол бойынша ұтатынын білдіреді.',
          )}
        </p>
      </header>

      {conclusion && (
        <Card className="bg-deep p-6 text-deep-ink">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-deep-muted">
            {Lc('Короткий вывод', 'Қысқаша қорытынды')}
          </p>
          <p className="mt-2 text-[16px] leading-relaxed">{conclusion.text}</p>
        </Card>
      )}

      <div className="no-scrollbar -mx-4 overflow-x-auto px-4">
        <table className="w-full min-w-[640px] border-separate border-spacing-0">
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 w-40 bg-paper px-3 pb-3 text-left align-bottom">
                <span className="label">{Lc('Параметр', 'Өлшем')}</span>
              </th>
              {list.map((r) => (
                <th key={r.program.id} scope="col" className="px-3 pb-3 text-left align-bottom">
                  <Link to={`/program/${r.program.id}`} className="block text-[15px] font-extrabold leading-tight hover:text-brand-700">
                    {r.program.universityShort}
                  </Link>
                  <span className="mt-1 block text-[12px] font-medium leading-snug text-ink-muted">{r.program.program}</span>
                  <button
                    type="button"
                    onClick={() => toggleCompare(r.program.id)}
                    className="mt-2 text-[12px] font-bold text-coral-600 hover:underline"
                  >
                    {Lc('Убрать', 'Алып тастау')}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => {
              const bestId = row.best?.(list)
              return (
                <tr key={row.label} className={i % 2 === 0 ? 'bg-surface' : ''}>
                  <th
                    scope="row"
                    className={`sticky left-0 z-10 border-t border-line px-3 py-3 text-left align-top text-[13px] font-semibold text-ink-muted ${
                      i % 2 === 0 ? 'bg-surface' : 'bg-paper'
                    }`}
                  >
                    {Lc(row.label, row.labelKk)}
                  </th>
                  {list.map((r) => (
                    <td key={r.program.id} className="border-t border-line px-3 py-3 align-top text-[14px] leading-relaxed text-ink-soft">
                      <span className="flex items-start gap-1.5">
                        {bestId === r.program.id && (
                          <span aria-label={Lc('лучший по этой строке', 'осы жол бойынша үздік')} className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-mint-500" />
                        )}
                        <span className="min-w-0">{row.render(r)}</span>
                      </span>
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="label mb-1.5">{Lc('Что дальше', 'Әрі қарай не')}</p>
          <p className="text-[17px] font-bold leading-snug">
            {Lc('Собрать план подготовки', 'Дайындық жоспарын құру')}
          </p>
          <p className="mt-1 text-[14px] text-ink-soft">
            {Lc(
              'План строится под требования программ из твоего топа, включая эти.',
              'Жоспар топ бағдарламаларыңның талаптарына, оның ішінде осыларға да сай құрылады.',
            )}
          </p>
        </div>
        <Button size="lg" onClick={() => navigate('/roadmap')} className="shrink-0">
          {Lc('К плану', 'Жоспарға')} <span aria-hidden>→</span>
        </Button>
      </Card>

      <DemoNote />
    </div>
  )
}
