import { afterEach, describe, expect, it } from 'vitest'
import type { CalendarEntry, Profile } from '../../types'
import { SCHOLARSHIPS } from '../../data/scholarships'
import { ACHIEVEMENT_FORMS_RAW, ACHIEVEMENT_KINDS_RAW, achievementForms, achievementLevels } from '../../data/taxonomy'
import { matchScholarships } from '../scholarships'
import { cscaPlan } from '../csca'
import { PROGRAMS } from '../../data/programs'
import { greet, nudge } from '../tone'
import { displayName } from '../../store/account'
import { deadlineAlerts, urgentCount } from '../alerts'
import { EMPTY_PROFILE } from '../../store/app'
import { buildRoadmap, allTasks } from '../roadmap'
import { recommend } from '../match'
import { demoCase } from '../../data/demoCases'
import { setEngineLang } from '../../i18n/lang'

afterEach(() => setEngineLang('ru'))

const base: Profile = demoCase('medium').profile
const p = (patch: Partial<Profile>): Profile => ({ ...base, ...patch })

describe('подбор стипендий', () => {
  it('не предлагает стипендию за творческое портфолио профилю без творческих направлений', () => {
    const it0 = matchScholarships(p({ fields: ['it'], countries: ['IT', 'TR', 'HK'] }))
    expect(it0.map((m) => m.scholarship.id)).not.toContain('global-creative-portfolio')
  })

  it('оставляет её тем, у кого дизайн или медиа в анкете', () => {
    const design = matchScholarships(p({ fields: ['design'], countries: ['IT', 'TR', 'HK'] }))
    expect(design.map((m) => m.scholarship.id)).toContain('global-creative-portfolio')
  })

  it('не оставляет ни одной стипендии с чужим направлением в выдаче', () => {
    for (const m of matchScholarships(p({ fields: ['it'] }))) {
      if (m.scholarship.fields.length > 0) {
        expect(m.scholarship.fields.some((f) => f === 'it')).toBe(true)
      }
    }
  })

  it('не предлагает школьнику стипендий, рассчитанных на выпускников бакалавриата', () => {
    expect(SCHOLARSHIPS.find((s) => s.id === 'kz-bolashak')!.stages).not.toContain('grade11')
    expect(SCHOLARSHIPS.some((s) => s.id === 'de-daad')).toBe(false)
  })

  it('честно предупреждает о конкурсе там, где мест единицы', () => {
    for (const id of ['kr-gks', 'jp-mext', 'kz-bolashak', 'de-deutschlandstipendium']) {
      const s = SCHOLARSHIPS.find((x) => x.id === id)
      expect(s, id).toBeDefined()
      expect(s!.competition, id).toBeTruthy()
    }
  })
})

describe('CSCA', () => {
  it('всегда включает математику', () => {
    expect(cscaPlan(base).subjects.map((s) => s.id)).toContain('math')
  })

  it('добавляет профессиональный китайский только тем, кто учится на китайском', () => {
    const en = cscaPlan(p({ languages: ['kk', 'ru', 'en'], countries: ['CN'] }))
    const zh = cscaPlan(p({ languages: ['kk', 'ru', 'zh'], countries: ['CN'] }))
    expect(en.track).toBe('en')
    expect(en.subjects.map((s) => s.id)).not.toContain('chinese')
    expect(zh.track).toBe('zh')
    expect(zh.subjects.map((s) => s.id)).toContain('chinese')
  })

  it('различает гуманитарный и научный вариант профессионального китайского', () => {
    const hum = cscaPlan(p({ languages: ['zh'], fields: ['law'], countries: ['CN'] }))
    const sci = cscaPlan(p({ languages: ['zh'], fields: ['engineering'], countries: ['CN'] }))
    const title = (x: ReturnType<typeof cscaPlan>) => x.subjects.find((s) => s.id === 'chinese')!.title
    expect(title(hum)).not.toBe(title(sci))
  })

  it('ставит физику технарям и химию медикам', () => {
    expect(cscaPlan(p({ fields: ['engineering'], countries: ['CN'] })).subjects.map((s) => s.id)).toContain('physics')
    expect(cscaPlan(p({ fields: ['medicine'], countries: ['CN'] })).subjects.map((s) => s.id)).toContain('chemistry')
    expect(cscaPlan(p({ fields: ['law'], countries: ['CN'] })).subjects.map((s) => s.id)).not.toContain('physics')
  })

  it('считается уместным только для тех, кто выбрал Китай', () => {
    expect(cscaPlan(p({ countries: ['CN'] })).relevant).toBe(true)
    expect(cscaPlan(p({ countries: ['KZ'] })).relevant).toBe(false)
  })

  it('попадает в план отдельным шагом, когда Китай есть в топе', () => {
    const cn = p({ countries: ['CN'], fields: ['it'], relocation: true })
    const ids = allTasks(buildRoadmap(cn, recommend(cn))).map((t) => t.id)
    expect(ids).toContain('csca-plan')
    const kz = p({ countries: ['KZ'], relocation: false })
    expect(allTasks(buildRoadmap(kz, recommend(kz))).map((t) => t.id)).not.toContain('csca-plan')
  })
})

describe('форма достижения', () => {
  it('даёт свой пример названия каждому типу', () => {
    const examples = ACHIEVEMENT_KINDS_RAW.map((k) => k.example)
    expect(new Set(examples).size).toBe(examples.length)
    for (const e of examples) expect(e.length).toBeGreaterThan(10)
  })

  it('разделяет хакатоны по формату, а конкурсы по типу состязания', () => {
    const hack = achievementForms('hackathon').map((f) => f.id)
    expect(hack).toContain('hackathonClassic')
    expect(hack).toContain('hackathonOnline')
    expect(hack).toContain('hackathonCorporate')
    expect(hack).toContain('hackathonThematic')
    const contest = achievementForms('contest').map((f) => f.id)
    expect(contest).toContain('competitiveProgramming')
    expect(contest).toContain('researchContest')
    expect(contest).toContain('caseChampionship')
    expect(contest).toContain('startupPitch')
  })

  it('называет масштаб словами того типа, который выбран', () => {
    const generic = achievementLevels().map((l) => l.label)
    const hack = achievementLevels('hackathon').map((l) => l.label)
    expect(hack).not.toEqual(generic)
    expect(hack.join(' ')).toMatch(/участник/i)
  })

  it('оставляет каждому виду валидный вес', () => {
    for (const f of ACHIEVEMENT_FORMS_RAW) {
      expect(f.weight, f.id).toBeGreaterThan(0.5)
      expect(f.weight, f.id).toBeLessThanOrEqual(1.25)
    }
  })
})

describe('проходные баллы CSCA', () => {
  it('даёт ориентир каждому китайскому вузу в базе', () => {
    const cn = PROGRAMS.filter((x) => x.country === 'CN')
    expect(cn.length).toBeGreaterThan(0)
    for (const prog of cn) {
      expect(prog.requirements.csca, prog.id).toBeDefined()
      expect(prog.requirements.csca!, prog.id).toBeGreaterThanOrEqual(40)
      expect(prog.requirements.csca!, prog.id).toBeLessThanOrEqual(100)
    }
  })

  it('называет балл вуза в шаге плана, когда Китай выбран', () => {
    const profile = p({ countries: ['CN'], fields: ['it'], relocation: true })
    const tasks = allTasks(buildRoadmap(profile, recommend(profile)))
    const task = tasks.find((t) => t.id === 'csca-plan')
    expect(task).toBeDefined()
    expect(task!.why).toMatch(/из 100/)
    expect(task!.why).toMatch(/демонстрационная/)
  })
})

describe('единый голос и имя', () => {
  it('обращается на языке наставника, без выбора стиля', () => {
    expect(greet('Жасмина')).toContain('Жасмина')
    expect(greet('Жасмина')).toMatch(/разберём/i)
    expect(nudge()).toBe('Логичный следующий шаг')
  })

  it('берёт имя из аккаунта, а не из анкеты', () => {
    const account = { email: 'a@b.kz', firstName: 'Жасмина', lastName: 'Молдагали', createdAt: '2026-09-18T00:00:00.000Z' }
    expect(displayName(account, 'Әсем')).toBe('Жасмина')
    expect(displayName(null, 'Әсем')).toBe('Әсем')
  })
})

describe('напоминания о дедлайнах', () => {
  const entry = (id: string, month: number, year: number, endMonth?: number): CalendarEntry => ({
    id, title: id, subtitle: '', kind: 'program', window: 'демо', month, year, endMonth,
  })
  // Середина марта 2026: месяц 3.
  const now = new Date('2026-03-15T00:00:00Z')

  it('считает идущий период срочным, а дальний — нет', () => {
    const alerts = deadlineAlerts([entry('идёт', 2, 2026, 5), entry('осенью', 10, 2026)], [], now)
    const byId = Object.fromEntries(alerts.map((a) => [a.entry.id, a]))
    expect(byId['идёт'].level).toBe('now')
    expect(byId['осенью']).toBeUndefined()
  })

  it('красным горят только период сейчас и ближайший месяц', () => {
    const alerts = deadlineAlerts(
      [entry('сейчас', 3, 2026), entry('через месяц', 4, 2026), entry('через три', 6, 2026)],
      [], now,
    )
    expect(urgentCount(alerts)).toBe(2)
  })

  it('поднимает отмеченные звёздочкой выше прочих на том же уровне', () => {
    const alerts = deadlineAlerts([entry('обычный', 6, 2026), entry('важный', 7, 2026)], ['важный'], now)
    expect(alerts[0].entry.id).toBe('важный')
    expect(alerts[0].starred).toBe(true)
  })

  it('сортирует от срочного к дальнему', () => {
    const alerts = deadlineAlerts([entry('через два', 5, 2026), entry('сейчас', 3, 2026)], [], now)
    expect(alerts.map((a) => a.entry.id)).toEqual(['сейчас', 'через два'])
  })
})

describe('повторное заполнение анкеты', () => {
  it('не оставляет прошлые ответы в пустом профиле', () => {
    expect(EMPTY_PROFILE.fields).toEqual([])
    expect(EMPTY_PROFILE.countries).toEqual([])
    expect(EMPTY_PROFILE.achievements).toEqual([])
    expect(EMPTY_PROFILE.exams.planned).toEqual([])
    expect(EMPTY_PROFILE.name).toBe('')
  })
})
