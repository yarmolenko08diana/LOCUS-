import { afterEach, describe, expect, it } from 'vitest'
import type { Achievement, Profile } from '../../types'
import { PROGRAMS } from '../../data/programs'
import { SCHOLARSHIPS } from '../../data/scholarships'
import { recommend } from '../match'
import { buildRoadmap, allTasks } from '../roadmap'
import { matchScholarships } from '../scholarships'
import { buildCalendar, whenLabel } from '../calendar'
import { suggestActivities } from '../activities'
import { effectiveGpa } from '../academics'
import { summarizeAchievements } from '../achievements'
import { setEngineLang } from '../../i18n/lang'

const base: Profile = {
  name: 'Тест',
  stage: 'grade11',
  fields: ['it'],
  schoolSystem: 'kz',
  gpa: 4.4,
  strongSubjects: ['Математика', 'Информатика'],
  languages: ['kk', 'ru', 'en'],
  english: 'b2',
  exams: { ent: 112, planned: ['ent', 'ielts'] },
  achievements: [],
  countries: ['KZ', 'HU', 'SG', 'JP'],
  relocation: true,
  budget: 'upto6k',
  intakeYear: 2027,
  priorities: ['cost', 'employability'],
  tone: 'friendly',
}

const p = (patch: Partial<Profile>): Profile => ({ ...base, ...patch })

const ach = (patch: Partial<Achievement> = {}): Achievement => ({
  id: 'a1',
  kind: 'olympiad',
  level: 'national',
  award: 'gold',
  title: 'Республиканская олимпиада по информатике',
  year: 2025,
  ...patch,
})

afterEach(() => setEngineLang('ru'))

describe('данные о программах', () => {
  it('покрывает все страны, добавленные в подбор', () => {
    const covered = new Set(PROGRAMS.map((x) => x.country))
    for (const code of ['HU', 'JP', 'SG', 'HK', 'GE'] as const) {
      expect(covered.has(code)).toBe(true)
    }
  })

  it('у каждой программы есть источник по https и период подачи', () => {
    for (const program of PROGRAMS) {
      expect(program.source.url).toMatch(/^https:\/\//)
      expect(program.deadlines.length).toBeGreaterThan(0)
      expect(program.holistic).toBeGreaterThanOrEqual(1)
      expect(program.holistic).toBeLessThanOrEqual(5)
    }
  })

  it('у каждой стипендии есть источник по https', () => {
    for (const s of SCHOLARSHIPS) {
      expect(s.source.url).toMatch(/^https:\/\//)
    }
  })
})

describe('достижения меняют результат', () => {
  it('поднимают программы, где заявку читают целиком', () => {
    const without = recommend(base)
    const withAch = recommend(p({ achievements: [ach(), ach({ id: 'a2', kind: 'hackathon', level: 'international', award: 'finalist' })] }))

    // Окно шире пятёрки: база выросла до нескольких сотен программ, и у профиля
    // с жёстким бюджетом первые места занимают дешёвые программы своей страны.
    // Достижения должны поднимать вузы, которые читают заявку целиком, — это и
    // проверяем по верхней десятке.
    const holisticBefore = without.slice(0, 10).filter((r) => r.program.holistic >= 4).length
    const holisticAfter = withAch.slice(0, 10).filter((r) => r.program.holistic >= 4).length
    expect(holisticAfter).toBeGreaterThan(holisticBefore)
  })

  it('заметно меняют состав топ-3, а не только проценты', () => {
    const before = recommend(base).slice(0, 3).map((r) => r.program.id)
    const after = recommend(p({ achievements: [ach(), ach({ id: 'a2', kind: 'research', level: 'international', award: 'silver' })] }))
      .slice(0, 3)
      .map((r) => r.program.id)
    expect(after).not.toEqual(before)
  })

  it('повышают вклад критерия «Достижения» в разбор балла', () => {
    const target = PROGRAMS.find((x) => x.holistic >= 4 && x.fields.includes('it'))!
    const without = recommend(base).find((r) => r.program.id === target.id)!
    const withAch = recommend(p({ achievements: [ach()] })).find((r) => r.program.id === target.id)!
    expect(withAch.breakdown.profile).toBeGreaterThan(without.breakdown.profile)
    expect(withAch.score).toBeGreaterThan(without.score)
  })

  it('убирают из плана шаг «внести достижения» и подставляют следующий', () => {
    const empty = allTasks(buildRoadmap(base, recommend(base))).map((t) => t.id)
    const filled = p({ achievements: [ach()] })
    const after = allTasks(buildRoadmap(filled, recommend(filled))).map((t) => t.id)
    expect(after).not.toEqual(empty)
    expect(after).not.toContain('achievements-empty')
  })

  it('не влияют на программы, где решают только баллы', () => {
    const exams = PROGRAMS.find((x) => x.holistic === 1)!
    const without = recommend(base).find((r) => r.program.id === exams.id)!
    const withAch = recommend(p({ achievements: [ach()] })).find((r) => r.program.id === exams.id)!
    expect(withAch.breakdown.profile).toBeCloseTo(without.breakdown.profile, 5)
  })

  it('объясняют оценку шансов по пунктам', () => {
    const rec = recommend(p({ achievements: [ach()] }))[0]
    expect(rec.chance.factors.length).toBeGreaterThan(0)
    for (const f of rec.chance.factors) {
      expect(f.label.length).toBeGreaterThan(0)
      expect(f.verdict.length).toBeGreaterThan(0)
    }
  })

  it('свежие достижения весят больше старых', () => {
    const fresh = summarizeAchievements(p({ achievements: [ach({ year: 2026 })] })).strength
    const old = summarizeAchievements(p({ achievements: [ach({ year: 2020 })] })).strength
    expect(fresh).toBeGreaterThan(old)
  })
})

describe('школьные системы', () => {
  it('пересчитывает балл НИШ в пятибалльную шкалу', () => {
    const nis = p({ schoolSystem: 'nis', exams: { ent: 112, nis: 88, planned: ['ent'] } })
    expect(effectiveGpa(nis)).toBeGreaterThan(4.4)
    expect(effectiveGpa(nis)).toBeLessThanOrEqual(5)
  })

  it('пересчитывает диплом IB вместо школьного среднего балла', () => {
    // 24 балла IB ≈ 3.0, 45 ≈ 5.0: диплом заменяет gpa из анкеты.
    const strong = p({ schoolSystem: 'ib', exams: { ib: 42, planned: [] } })
    const weak = p({ schoolSystem: 'ib', exams: { ib: 28, planned: [] } })
    expect(effectiveGpa(strong)).toBeGreaterThan(base.gpa)
    expect(effectiveGpa(weak)).toBeLessThan(base.gpa)
  })

  it('засчитывает TOEFL там, где вуз просит IELTS', () => {
    const withToefl = p({ english: 'b1', exams: { toefl: 102, planned: [] } })
    const without = p({ english: 'b1', exams: { planned: [] } })
    const target = PROGRAMS.find((x) => x.requirements.ielts !== undefined && x.fields.includes('it'))!
    const a = recommend(withToefl).find((r) => r.program.id === target.id)!
    const b = recommend(without).find((r) => r.program.id === target.id)!
    expect(a.breakdown.admission).toBeGreaterThan(b.breakdown.admission)
  })
})

describe('стипендии, календарь и активности', () => {
  it('подбирает стипендии под страны профиля и сортирует по соответствию', () => {
    const matches = matchScholarships(base)
    expect(matches.length).toBeGreaterThan(0)
    const scores = matches.map((m) => m.score)
    expect([...scores].sort((a, b) => b - a)).toEqual(scores)
  })

  it('называет незакрытые требования, когда стипендия не подходит целиком', () => {
    const matches = matchScholarships(p({ exams: { planned: [] }, gpa: 3.2 }))
    const blocked = matches.filter((m) => !m.eligible)
    expect(blocked.length).toBeGreaterThan(0)
    expect(blocked[0].gaps[0].length).toBeGreaterThan(0)
  })

  it('строит календарь по возрастанию даты и не дублирует записи', () => {
    const recs = recommend(base)
    const entries = buildCalendar(base, recs, matchScholarships(base), new Date('2026-09-18'))
    expect(entries.length).toBeGreaterThan(0)
    const keys = entries.map((e) => e.year * 100 + e.month)
    expect([...keys].sort((a, b) => a - b)).toEqual(keys)
    expect(new Set(entries.map((e) => e.id)).size).toBe(entries.length)
  })

  it('переносит уже прошедший период на следующий год подачи', () => {
    const now = new Date('2026-11-01')
    const entries = buildCalendar(base, recommend(base), matchScholarships(base), now)
    for (const e of entries) {
      expect(e.year).toBeGreaterThanOrEqual(now.getFullYear())
      expect(whenLabel(e, now).length).toBeGreaterThan(0)
    }
  })

  it('опускает активность, которой у человека уже достаточно', () => {
    const withHackathons = p({
      achievements: [
        ach({ id: 'h1', kind: 'hackathon', level: 'city', award: 'finalist' }),
        ach({ id: 'h2', kind: 'hackathon', level: 'region', award: 'gold' }),
      ],
    })
    const rank = (profile: Profile) =>
      suggestActivities(profile, 30).findIndex((s) => s.idea.kind === 'hackathon')

    expect(rank(base)).toBeGreaterThanOrEqual(0)
    expect(rank(withHackathons)).toBeGreaterThan(rank(base))
  })

  it('объясняет, почему активность предложена именно сейчас', () => {
    for (const s of suggestActivities(base, 6)) {
      expect(s.hint.length).toBeGreaterThan(0)
      // Ссылка у идеи необязательна, но если она есть — только https.
      if (s.idea.source) expect(s.idea.source.url).toMatch(/^https:\/\//)
    }
  })
})

describe('казахский язык', () => {
  it('переводит объяснения подбора, не меняя сам подбор', () => {
    setEngineLang('ru')
    const ru = recommend(base)
    setEngineLang('kk')
    const kk = recommend(base)

    expect(kk.map((r) => r.program.id)).toEqual(ru.map((r) => r.program.id))
    expect(kk.map((r) => r.score)).toEqual(ru.map((r) => r.score))
    expect(kk[0].reasons[0].text).not.toBe(ru[0].reasons[0].text)
    expect(kk[0].chance.explanation).not.toBe(ru[0].chance.explanation)
  })

  it('переводит названия фаз плана', () => {
    setEngineLang('kk')
    const phases = buildRoadmap(base, recommend(base))
    expect(phases[0].title).toBe('Қазір')
  })
})
