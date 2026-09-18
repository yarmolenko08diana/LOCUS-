import type { ActivityIdea, Profile } from '../types'
import { ACTIVITIES } from '../data/activities'
import { summarizeAchievements, wantedKinds } from './achievements'

/** Идея активности вместе с объяснением, почему она предлагается именно сейчас. */
export interface ActivitySuggestion {
  idea: ActivityIdea
  /** Почему это в списке: пробел в профиле, направление или этап. */
  hint: string
  /** Чем выше, тем раньше показывается. */
  weight: number
}

/**
 * Подбор активностей идёт от пробелов, а не от каталога: если у человека уже
 * есть три хакатона, четвёртый ничего не добавит, а исследования или
 * волонтёрства в заявке по-прежнему нет.
 */
export function suggestActivities(profile: Profile, limit = 6): ActivitySuggestion[] {
  const ach = summarizeAchievements(profile)
  const wanted = wantedKinds(profile.fields)

  const scored = ACTIVITIES.filter((a) => a.stages.includes(profile.stage)).map((idea) => {
    const fieldHit = idea.fields.length === 0 || idea.fields.some((f) => profile.fields.includes(f))
    const already = ach.byKind[idea.kind] ?? 0
    const isWanted = wanted.includes(idea.kind)

    let weight = 0
    let hint = 'Усиливает заявку в целом'

    if (fieldHit && idea.fields.length > 0) {
      weight += 30
      hint = 'Подходит твоему направлению'
    } else if (idea.fields.length === 0) {
      weight += 12
    } else {
      weight -= 25
    }

    if (isWanted && already === 0) {
      weight += 34
      hint = 'По твоему направлению этого в анкете пока нет'
    } else if (already === 0) {
      weight += 10
    } else if (already >= 2) {
      weight -= 18
      hint = 'У тебя это уже есть — добавит немного'
    }

    // Чем меньше времени до подачи, тем важнее быстрые вещи: эссе, CV, письма.
    const soonKinds = ['project', 'course']
    if (profile.stage === 'grade11' || profile.stage === 'graduate') {
      weight += soonKinds.includes(idea.kind) ? 16 : -6
    }

    return { idea, hint, weight }
  })

  return scored.sort((a, b) => b.weight - a.weight).slice(0, limit)
}
