import { describe, expect, it } from 'vitest'
import type { Profile } from '../../types'
import { PROGRAMS } from '../../data/programs'
import { recommend, scoreProgram, yearlyCost } from '../match'
import { buildRoadmap, nextAction, allTasks } from '../roadmap'
import { diagnose } from '../diagnosis'

const base: Profile = {
  name: 'Тест',
  stage: 'grade11',
  fields: ['it'],
  schoolSystem: 'kz',
  gpa: 4.6,
  strongSubjects: ['Математика', 'Информатика'],
  languages: ['kk', 'ru', 'en'],
  english: 'b2',
  exams: { ent: 112, planned: ['ent', 'ielts'] },
  achievements: [],
  countries: ['KZ'],
  relocation: false,
  budget: 'upto6k',
  intakeYear: 2027,
  priorities: ['cost', 'employability'],
}

const p = (patch: Partial<Profile>): Profile => ({ ...base, ...patch })

describe('движок подбора', () => {
  it('держит итоговый балл в диапазоне 0–100 для любой программы', () => {
    for (const program of PROGRAMS) {
      const score = scoreProgram(base, program).score
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    }
  })

  it('сортирует результаты по убыванию совпадения', () => {
    const scores = recommend(base).map((r) => r.score)
    expect([...scores].sort((a, b) => b - a)).toEqual(scores)
  })

  it('ставит программы по выбранному направлению выше нерелевантных', () => {
    const recs = recommend(p({ fields: ['medicine'] }))
    const best = recs[0]
    expect(best.program.fields).toContain('medicine')
  })

  it('не поднимает нерелевантную программу наверх за счёт бюджета и географии', () => {
    // Аграрная программа дешёвая, в нужной стране и с низким порогом ЕНТ,
    // но не совпадает с интересом к IT — она не должна попасть в топ.
    const recs = recommend(base)
    const agro = recs.findIndex((r) => r.program.id === 'kz-kaznau-agro')
    expect(agro).toBeGreaterThan(4)
  })

  it('исключает зарубежные варианты, когда переезд не рассматривается', () => {
    const recs = recommend(p({ relocation: false, countries: ['KZ'] }))
    expect(recs.length).toBeGreaterThan(0)
    expect(recs.every((r) => r.program.country === 'KZ')).toBe(true)
  })

  it('возвращает зарубежные варианты, как только переезд разрешён', () => {
    const recs = recommend(p({ relocation: true, countries: ['KZ'] }))
    expect(recs.some((r) => r.program.country !== 'KZ')).toBe(true)
  })

  it('меняет выдачу при смене бюджета на «только грант»', () => {
    const before = recommend(base).slice(0, 3).map((r) => r.program.id)
    const after = recommend(p({ budget: 'grant-only' })).slice(0, 3).map((r) => r.program.id)
    expect(after).not.toEqual(before)
  })

  it('каждая рекомендация несёт хотя бы одно объяснение', () => {
    for (const rec of recommend(base).slice(0, 10)) {
      expect(rec.reasons.length).toBeGreaterThan(0)
      expect(rec.reasons[0].text.length).toBeGreaterThan(10)
    }
  })

  it('оценивает шансы ниже, когда баллов не хватает', () => {
    const strong = scoreProgram(p({ exams: { ent: 130, planned: ['ent'] }, gpa: 5 }), PROGRAMS.find((x) => x.id === 'kz-aitu-se')!)
    const weak = scoreProgram(p({ exams: { ent: 40, planned: ['ent'] }, gpa: 3.2 }), PROGRAMS.find((x) => x.id === 'kz-aitu-se')!)
    const order = { high: 0, medium: 1, unknown: 2, low: 3 }
    expect(order[strong.chance.level]).toBeLessThan(order[weak.chance.level])
  })

  it('не обещает поступление и всегда помечает оценку как ориентировочную', () => {
    const promises = /гарантиру|ты (точно |обязательно )?поступ|вероятность \\d/i
    for (const rec of recommend(base)) {
      expect(rec.chance.explanation).not.toMatch(promises)
      expect(rec.chance.explanation).toMatch(/ориентир|демо|оценить нельзя/i)
    }
  })

  it('считает годовую стоимость как обучение плюс десять месяцев проживания', () => {
    const program = PROGRAMS.find((x) => x.id === 'kz-sdu-cs')!
    expect(yearlyCost(program)).toBe(program.tuitionUsd[0] + program.livingUsd * 10)
  })
})

describe('демо-данные', () => {
  it('у каждой программы есть источник и хотя бы один период подачи', () => {
    for (const program of PROGRAMS) {
      expect(program.source.url).toMatch(/^https:\/\//)
      expect(program.deadlines.length).toBeGreaterThan(0)
    }
  })

  it('не содержит дубликатов id', () => {
    const ids = PROGRAMS.map((x) => x.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('roadmap', () => {
  it('всегда предлагает следующий шаг, пока есть невыполненные задачи', () => {
    const phases = buildRoadmap(base, recommend(base))
    expect(nextAction(phases, [])).not.toBeNull()
  })

  it('возвращает null, когда все шаги отмечены', () => {
    const phases = buildRoadmap(base, recommend(base))
    const done = allTasks(phases).map((t) => t.id)
    expect(nextAction(phases, done)).toBeNull()
  })

  it('добавляет визовые шаги только при зарубежных вариантах в топе', () => {
    const local = allTasks(buildRoadmap(p({ relocation: false, countries: ['KZ'] }), recommend(p({ relocation: false, countries: ['KZ'] }))))
    const abroadProfile = p({ countries: ['GB', 'US'], budget: 'above15k', relocation: true })
    const abroad = allTasks(buildRoadmap(abroadProfile, recommend(abroadProfile)))
    expect(local.some((t) => t.id === 'visa')).toBe(false)
    expect(abroad.some((t) => t.id === 'visa')).toBe(true)
  })

  it('перестраивает план при смене направления', () => {
    const it = allTasks(buildRoadmap(base, recommend(base))).map((t) => t.id)
    const design = p({ fields: ['design'] })
    const art = allTasks(buildRoadmap(design, recommend(design))).map((t) => t.id)
    expect(it).not.toEqual(art)
  })
})

describe('диагностика', () => {
  it('отмечает ограничение по бюджету, когда платить нечем', () => {
    const d = diagnose(p({ budget: 'grant-only' }), recommend(p({ budget: 'grant-only' })))
    expect(d.constraints.join(' ')).toMatch(/грант/i)
  })

  it('оценивает полноту профиля ниже, когда данных мало', () => {
    const thin = p({ strongSubjects: [], priorities: [], exams: { planned: [] }, english: 'none' })
    expect(diagnose(thin, recommend(thin)).readiness)
      .toBeLessThan(diagnose(base, recommend(base)).readiness)
  })
})
