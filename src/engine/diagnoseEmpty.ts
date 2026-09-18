import type { Profile } from '../types'
import { recommend } from './match'
import { BUDGET_LABEL, COUNTRY_LABEL, FIELD_LABEL } from '../data/taxonomy'
import { listOf, plural, softLower } from '../lib/text'

export interface Relaxation {
  /** Что предлагаем ослабить, человеческим языком. */
  label: string
  /** Сколько вариантов появится, если ослабить именно это. */
  gain: number
  /** Изменение профиля, которое применяется по нажатию. */
  patch: Partial<Profile>
}

export interface EmptyExplanation {
  cause: string
  relaxations: Relaxation[]
}

const MIN_SCORE = 40

function count(profile: Profile): number {
  return recommend(profile).filter((r) => r.score >= MIN_SCORE).length
}

/**
 * Честная обработка пустой выдачи: вместо «ничего не найдено» показываем,
 * какой именно ответ отсекает все варианты и сколько появится, если его ослабить.
 * Каждое ограничение снимается по очереди, остальные остаются на месте.
 */
export function explainEmpty(profile: Profile): EmptyExplanation {
  const candidates: Relaxation[] = []

  if (!profile.relocation) {
    candidates.push({
      label: 'Разрешить переезд в другую страну',
      gain: count({ ...profile, relocation: true }),
      patch: { relocation: true },
    })
  }

  if (profile.budget !== 'above15k') {
    const wider: Profile['budget'] =
      profile.budget === 'grant-only' ? 'upto6k' : profile.budget === 'upto2k' ? 'upto6k' : 'upto15k'
    candidates.push({
      label: `Поднять бюджет до «${softLower(BUDGET_LABEL[wider])}»`,
      gain: count({ ...profile, budget: wider }),
      patch: { budget: wider },
    })
  }

  if (profile.countries.length <= 3) {
    candidates.push({
      label: 'Добавить Казахстан и Турцию в список стран',
      gain: count({
        ...profile,
        countries: Array.from(new Set([...profile.countries, 'KZ' as const, 'TR' as const])),
      }),
      patch: { countries: Array.from(new Set([...profile.countries, 'KZ' as const, 'TR' as const])) },
    })
  }

  const useful = candidates.filter((c) => c.gain > 0).sort((a, b) => b.gain - a.gain)

  const bits: string[] = []
  if (profile.fields.length) {
    const word = plural(profile.fields.length, 'направление', 'направления', 'направления')
    bits.push(`${word} ${listOf(profile.fields.map((f) => softLower(FIELD_LABEL[f])), 2)}`)
  }
  if (profile.countries.length) {
    const word = plural(profile.countries.length, 'страна', 'страны', 'страны')
    bits.push(`${word} ${listOf(profile.countries.map((c) => COUNTRY_LABEL[c]), 2)}`)
  }
  bits.push(`бюджет «${softLower(BUDGET_LABEL[profile.budget])}»`)
  if (!profile.relocation) bits.push('без переезда')

  const cause =
    useful.length > 0
      ? `В демо-базе нет программ, где сходятся сразу ${listOf(bits, 4)}. Чаще всего дело в одном ответе — вот что даст больше всего вариантов.`
      : `В демо-базе нет программ под сочетание: ${listOf(bits, 4)}. База прототипа ограничена 32 программами, так что это ограничение данных, а не твоего профиля.`

  return { cause, relaxations: useful.slice(0, 3) }
}
