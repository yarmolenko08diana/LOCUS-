import { Link } from 'react-router-dom'
import { Empty, SectionTitle } from '../components/ui'
import { ProgramCard } from '../components/ProgramCard'
import { useApp } from '../store/app'
import { useL } from '../i18n/LangContext'
import { countOf } from '../lib/text'

export function Saved() {
  const { recommendations, saved, compare, toggleSaved, toggleCompare } = useApp()
  const L = useL()
  const items = recommendations.filter((r) => saved.includes(r.program.id))

  if (items.length === 0) {
    return (
      <Empty
        title={L('Здесь пока пусто', 'Мұнда әзірге бос')}
        description={L(
          'Отмечай понравившиеся программы звёздочкой на экране подбора — они соберутся здесь, чтобы не искать их заново.',
          'Ұнаған бағдарламаларды таңдау экранында жұлдызшамен белгіле — олар қайта іздемеу үшін осында жиналады.',
        )}
        action={
          <Link to="/matches" className="font-semibold text-brand-700 underline">
            {L('К рекомендациям', 'Ұсыныстарға')}
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-5 animate-fade-up">
      <SectionTitle
        eyebrow={L('Сохранённое', 'Сақталған')}
        title={L('Избранные программы', 'Таңдаулы бағдарламалар')}
        description={L(
          `${countOf(items.length, 'программа', 'программы', 'программ')} в избранном. Список хранится в этом браузере.`,
          `Таңдаулыда ${items.length} бағдарлама. Тізім осы браузерде сақталады.`,
        )}
      />
      <ul className="space-y-4">
        {items.map((rec) => (
          <li key={rec.program.id}>
            <ProgramCard
              rec={rec}
              inCompare={compare.includes(rec.program.id)}
              onCompare={() => toggleCompare(rec.program.id)}
              saved
              onSave={() => toggleSaved(rec.program.id)}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
