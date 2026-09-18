import { afterEach, describe, expect, it } from 'vitest'
import type { Achievement, Profile } from '../../types'
import { recommend } from '../match'
import { reviewEssays, essayDocs, type CriterionState } from '../essay'
import { achievementValue } from '../achievements'
import { DEMO_CASES, demoCase } from '../../data/demoCases'
import { COUNTRY_NOTES } from '../../data/countryNotes'
import { PROGRAMS } from '../../data/programs'
import { setEngineLang } from '../../i18n/lang'

afterEach(() => setEngineLang('ru'))

const profile: Profile = demoCase('medium').profile
const recs = recommend(profile)

describe('разбор эссе и study plan', () => {
  it('без единой отметки считает готовность нулевой и ничего не обещает', () => {
    for (const r of reviewEssays(profile, recs, {})) {
      expect(r.readiness).toBe(0)
      expect(r.todo.length).toBe(r.doc.criteria.length)
      expect(r.verdict).not.toMatch(/гарант|точно поступ/i)
    }
  })

  it('поднимает готовность, когда требования закрываются', () => {
    const [first] = essayDocs()
    const answers: Record<string, CriterionState> = {}
    const before = reviewEssays(profile, recs, answers)[0].readiness
    first.criteria.forEach((c) => { answers[c.id] = 'yes' })
    const after = reviewEssays(profile, recs, answers)[0]
    expect(after.readiness).toBeGreaterThan(before)
    expect(after.readiness).toBe(100)
    expect(after.todo.length).toBe(0)
  })

  it('считает частичный ответ ровно наполовину', () => {
    const [first] = essayDocs()
    const all: Record<string, CriterionState> = {}
    first.criteria.forEach((c) => { all[c.id] = 'partly' })
    expect(reviewEssays(profile, recs, all)[0].readiness).toBe(50)
  })

  it('ставит незакрытые требования по убыванию важности', () => {
    const todo = reviewEssays(profile, recs, {})[0].todo
    const weights = todo.map((c) => c.weight)
    expect([...weights].sort((a, b) => b - a)).toEqual(weights)
  })

  it('поднимает важность эссе там, где заявку читают целиком', () => {
    const strong = reviewEssays(demoCase('high').profile, recommend(demoCase('high').profile), {})
    const local = reviewEssays(demoCase('low').profile, recommend(demoCase('low').profile), {})
    const m = (list: ReturnType<typeof reviewEssays>) => list.find((r) => r.doc.id === 'motivation')!
    const rank = { high: 2, medium: 1, low: 0 }
    expect(rank[m(strong).importance]).toBeGreaterThan(rank[m(local).importance])
  })

  it('переводит требования на казахский, не меняя их состав', () => {
    const ru = reviewEssays(profile, recs, {})
    setEngineLang('kk')
    const kk = reviewEssays(profile, recs, {})
    expect(kk.map((r) => r.doc.id)).toEqual(ru.map((r) => r.doc.id))
    expect(kk[0].importanceNote).not.toBe(ru[0].importanceNote)
  })
})

describe('вид достижения', () => {
  const at = (patch: Partial<Achievement>): Achievement => ({
    id: 'a', kind: 'research', level: 'national', award: 'gold',
    title: 'Проект', year: new Date().getFullYear(), ...patch,
  })

  it('различает школьную работу и научную статью того же масштаба', () => {
    const year = new Date().getFullYear()
    const school = achievementValue(at({ form: 'schoolWork' }), year)
    const article = achievementValue(at({ form: 'article' }), year)
    expect(article).toBeGreaterThan(school)
  })

  it('не меняет вес, когда вид не указан', () => {
    const year = new Date().getFullYear()
    expect(achievementValue(at({}), year)).toBe(achievementValue(at({ form: undefined }), year))
  })
})

describe('готовые примеры', () => {
  it('дают разный уровень шансов в верхней тройке', () => {
    const levelOf = (id: 'high' | 'medium' | 'low') => {
      const top = recommend(demoCase(id).profile).slice(0, 3)
      const order = { high: 3, medium: 2, unknown: 1, low: 0 }
      return top.reduce((sum, r) => sum + order[r.chance.level], 0) / top.length
    }
    expect(levelOf('high')).toBeGreaterThan(levelOf('low'))
  })

  it('различаются составом рекомендаций, а не только процентами', () => {
    const ids = DEMO_CASES.map((c) => recommend(c.profile).slice(0, 3).map((r) => r.program.id).join())
    expect(new Set(ids).size).toBe(DEMO_CASES.length)
  })
})

describe('справка по странам', () => {
  it('есть у каждой страны в базе и ведёт на https-источник', () => {
    for (const country of new Set(PROGRAMS.map((p) => p.country))) {
      const note = COUNTRY_NOTES[country]
      expect(note, country).toBeDefined()
      expect(note!.source.url).toMatch(/^https:\/\//)
      expect(note!.facts.length).toBeGreaterThan(0)
    }
  })
})
