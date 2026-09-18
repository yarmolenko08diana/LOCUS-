import type { Achievement, AchievementKind, FieldId, Profile } from '../types'
import {
  ACHIEVEMENT_AWARD_LABEL, ACHIEVEMENT_AWARD_WEIGHT, ACHIEVEMENT_KIND_LABEL,
  ACHIEVEMENT_LEVEL_LABEL, ACHIEVEMENT_LEVEL_WEIGHT, FIELD_ACHIEVEMENTS,
} from '../data/taxonomy'
import { plural } from '../lib/text'
import { L } from '../i18n/lang'

/** Свод по достижениям: что уже есть, насколько это сильно и чего не хватает. */
export interface AchievementSummary {
  count: number
  /** Общая сила внеучебного профиля, 0–1. */
  strength: number
  /** Доля достижений, которые работают на выбранное направление, 0–1. */
  relevance: number
  byKind: Partial<Record<AchievementKind, number>>
  /** Самое весомое достижение. */
  top: Achievement | null
  /** Короткие формулировки для карточек и диагностики. */
  highlights: string[]
  /** Виды активностей, которых не хватает под выбранное направление. */
  missing: AchievementKind[]
  /** Суммарные часы волонтёрства и стажировок. */
  hours: number
}

/** Вес одного достижения: масштаб × результат, со скидкой за давность. */
export function achievementValue(a: Achievement, currentYear: number): number {
  const base = ACHIEVEMENT_LEVEL_WEIGHT[a.level] * ACHIEVEMENT_AWARD_WEIGHT[a.award]
  const age = currentYear - a.year
  const freshness = age <= 1 ? 1 : age <= 3 ? 0.85 : 0.65
  return base * freshness
}

/** Человекочитаемое описание достижения: «Республиканская олимпиада, 1 место». */
export function achievementLabel(a: Achievement): string {
  return L(
    `${ACHIEVEMENT_LEVEL_LABEL[a.level]} уровень · ${ACHIEVEMENT_KIND_LABEL[a.kind]} · ${ACHIEVEMENT_AWARD_LABEL[a.award]}`,
    `${ACHIEVEMENT_LEVEL_LABEL[a.level]} деңгей · ${ACHIEVEMENT_KIND_LABEL[a.kind]} · ${ACHIEVEMENT_AWARD_LABEL[a.award]}`,
  )
}

/**
 * Вклад достижений убывает: второе и третье считаются с понижающим коэффициентом.
 * Иначе десять школьных грамот перевесили бы одну международную победу.
 */
const DECAY = [1, 0.8, 0.65, 0.5, 0.4, 0.3]

/** Сумма весов, при которой профиль считается полностью сильным. */
const FULL_STRENGTH = 2.2

export function summarizeAchievements(
  profile: Profile,
  currentYear = new Date().getFullYear(),
): AchievementSummary {
  const list = profile.achievements
  const byKind: Partial<Record<AchievementKind, number>> = {}
  list.forEach((a) => {
    byKind[a.kind] = (byKind[a.kind] ?? 0) + 1
  })

  const scored = list
    .map((a) => ({ a, value: achievementValue(a, currentYear) }))
    .sort((x, y) => y.value - x.value)

  const raw = scored.reduce((sum, item, i) => sum + item.value * (DECAY[i] ?? 0.2), 0)
  const strength = Math.min(1, raw / FULL_STRENGTH)

  const wanted = wantedKinds(profile.fields)
  const relevant = list.filter((a) => wanted.includes(a.kind)).length
  const relevance = list.length === 0 ? 0 : relevant / list.length

  const hours = list.reduce((sum, a) => sum + (a.hours ?? 0), 0)

  return {
    count: list.length,
    strength,
    relevance,
    byKind,
    top: scored[0]?.a ?? null,
    highlights: buildHighlights(scored.map((s) => s.a), hours),
    missing: wanted.filter((k) => !byKind[k]),
    hours,
  }
}

/** Какие виды активностей усиливают заявку по выбранным направлениям. */
export function wantedKinds(fields: FieldId[]): AchievementKind[] {
  if (fields.length === 0) return ['olympiad', 'volunteer', 'project', 'leadership']
  const seen = new Set<AchievementKind>()
  fields.forEach((f) => FIELD_ACHIEVEMENTS[f].forEach((k) => seen.add(k)))
  return [...seen]
}

function buildHighlights(list: Achievement[], hours: number): string[] {
  const out: string[] = []
  const best = list[0]
  if (best) {
    out.push(`${achievementLabel(best)}: ${best.title}`)
  }
  const international = list.filter((a) => a.level === 'international' || a.level === 'national')
  if (international.length > 1) {
    out.push(
      L(
        `${international.length} ${plural(international.length, 'достижение', 'достижения', 'достижений')} республиканского или международного уровня`,
        `республикалық немесе халықаралық деңгейдегі ${international.length} жетістік`,
      ),
    )
  }
  if (hours >= 50) {
    out.push(L(
      `${hours} ${plural(hours, 'час', 'часа', 'часов')} волонтёрства и практики`,
      `${hours} сағат волонтёрлік пен тәжірибе`,
    ))
  }
  return out.slice(0, 3)
}

/**
 * Насколько приёмная комиссия конкретной программы вообще смотрит на достижения.
 * holistic = 1 — решают только баллы, holistic = 5 — заявку читают целиком.
 */
export function holisticFactor(holistic: number): number {
  return Math.max(0, Math.min(1, (holistic - 1) / 4))
}
