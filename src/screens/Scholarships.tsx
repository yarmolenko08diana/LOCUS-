import { Badge, Card, DemoNote, Empty, Meter, SectionTitle } from '../components/ui'
import { useApp } from '../store/app'
import { useL } from '../i18n/LangContext'
import { COUNTRY_FLAG, COUNTRY_LABEL } from '../data/taxonomy'
import { countOf } from '../lib/text'
import { Link } from 'react-router-dom'

export function Scholarships() {
  const { scholarships, completed } = useApp()
  const L = useL()

  if (!completed) {
    return (
      <Empty
        title={L('Сначала заполни анкету', 'Алдымен сауалнаманы толтыр')}
        description={L(
          'Стипендии подбираются под страны, направление и баллы. Без анкеты список был бы просто каталогом.',
          'Шәкіртақылар елге, бағытқа және балдарға қарай таңдалады. Сауалнамасыз бұл жай ғана каталог болар еді.',
        )}
        action={
          <Link to="/survey" className="font-semibold text-brand-700 underline">
            {L('Перейти к анкете', 'Сауалнамаға өту')}
          </Link>
        }
      />
    )
  }

  const eligible = scholarships.filter((m) => m.eligible)

  return (
    <div className="space-y-5 animate-fade-up">
      <SectionTitle
        eyebrow={L('Деньги на учёбу', 'Оқуға арналған қаржы')}
        title={L('Стипендии под твой профиль', 'Профиліңе сай шәкіртақылар')}
        description={L(
          `Подходит ${countOf(scholarships.length, 'стипендия', 'стипендии', 'стипендий')}, из них ${eligible.length} без незакрытых требований. У каждой указано, чего не хватает именно тебе.`,
          `${scholarships.length} шәкіртақы қолайлы, оның ${eligible.length} талабы толық жабылған. Әрқайсысында саған нақты не жетпейтіні көрсетілген.`,
        )}
      />

      <ul className="space-y-4">
        {scholarships.map((m) => (
          <Card as="li" key={m.scholarship.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-bold leading-tight">{m.scholarship.name}</h2>
                <p className="mt-1 text-[15px] leading-relaxed text-ink-soft">{m.scholarship.coverage}</p>
              </div>
              <Badge tone={m.eligible ? 'mint' : 'sun'}>
                {m.eligible ? L('Подходишь', 'Сәйкес келесің') : L('Есть пробелы', 'Олқылықтар бар')}
              </Badge>
            </div>

            <div className="mt-4">
              <Meter
                value={m.score}
                tone={m.eligible ? 'mint' : 'sun'}
                label={L('Соответствие анкете', 'Сауалнамаға сәйкестік')}
                sublabel={`${m.score}%`}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {m.scholarship.countries.slice(0, 6).map((c) => (
                <Badge key={c}>
                  <span aria-hidden>{COUNTRY_FLAG[c]}</span> {COUNTRY_LABEL[c]}
                </Badge>
              ))}
            </div>

            {m.reasons.length > 0 && (
              <ul className="mt-4 space-y-2">
                {m.reasons.map((r, i) => (
                  <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed">
                    <span aria-hidden className="mt-[3px] shrink-0 text-mint-600">✓</span>
                    <span>
                      <span className="font-semibold">{r.tag}. </span>
                      <span className="text-ink-soft">{r.text}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {m.gaps.length > 0 && (
              <div className="mt-4 rounded-xl border border-sun-100 bg-sun-50 p-3.5">
                <p className="label mb-1.5 text-sun-700">{L('Чего не хватает', 'Не жетпейді')}</p>
                <ul className="space-y-1">
                  {m.gaps.map((g, i) => (
                    <li key={i} className="text-sm leading-relaxed text-ink-soft">
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3.5">
              <p className="text-sm text-ink-soft">
                <span className="font-semibold">{L('Подача', 'Өтінім беру')}: </span>
                {m.scholarship.window}
              </p>
              <a
                href={m.scholarship.source.url}
                target="_blank"
                rel="noreferrer"
                className="-m-2 p-2 text-sm font-semibold text-brand-700 underline underline-offset-2"
              >
                {m.scholarship.source.label}
              </a>
            </div>
            {m.scholarship.requirements.note && (
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{m.scholarship.requirements.note}</p>
            )}
          </Card>
        ))}
      </ul>

      <DemoNote>
        {L(
          'Условия и периоды подачи приведены как демо-данные. Точные сроки и требования смотрите на официальном сайте стипендии.',
          'Шарттар мен өтінім кезеңдері демо-дерек ретінде берілген. Нақты мерзімдер мен талаптарды шәкіртақының ресми сайтынан қараңыз.',
        )}
      </DemoNote>
    </div>
  )
}
