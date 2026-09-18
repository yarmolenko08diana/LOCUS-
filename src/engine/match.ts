import type {
  Chance, FieldId, Profile, Program, Reason, ReasonTone, Recommendation, ScoreBreakdown,
} from '../types'
import {
  BUDGET_MAX, COUNTRY_LABEL, ENGLISH_TO_IELTS, ENGLISH_RANK,
  FIELD_LABEL, LANGUAGE_LABEL,
} from '../data/taxonomy'
import { PROGRAMS } from '../data/programs'
import { listOf, softLower } from '../lib/text'
import { L } from '../i18n/lang'
import { effectiveGpa, gpaSourceLabel, toeflToIelts } from './academics'
import { holisticFactor, summarizeAchievements, type AchievementSummary } from './achievements'

/**
 * Веса критериев подбора. Сумма — 100, поэтому итоговый score читается как процент
 * совпадения и его можно показать пользователю без дополнительной нормализации.
 */
export const WEIGHTS = {
  field: 26,
  admission: 20,
  budget: 17,
  geo: 13,
  language: 9,
  priority: 6,
  profile: 9,
} as const

const WEIGHT_LABEL_RAW: Record<keyof ScoreBreakdown, [string, string]> = {
  field: ['Направление', 'Бағыт'],
  admission: ['Проходимость', 'Өту мүмкіндігі'],
  budget: ['Бюджет', 'Бюджет'],
  geo: ['География', 'География'],
  language: ['Язык', 'Тіл'],
  priority: ['Приоритеты', 'Басымдықтар'],
  profile: ['Достижения', 'Жетістіктер'],
}

/**
 * Подписи критериев читаются в момент отрисовки, а не при загрузке модуля,
 * иначе язык зафиксировался бы на том, что стоял до выбора пользователя.
 */
export const WEIGHT_LABEL = new Proxy({} as Record<keyof ScoreBreakdown, string>, {
  get: (_t, key: string) => {
    const pair = WEIGHT_LABEL_RAW[key as keyof ScoreBreakdown]
    return pair ? L(pair[0], pair[1]) : key
  },
  has: (_t, key: string) => key in WEIGHT_LABEL_RAW,
  ownKeys: () => Object.keys(WEIGHT_LABEL_RAW),
  getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
})

/** Направления, которые считаются смежными: частичное совпадение лучше нуля. */
const RELATED_FIELDS: Record<FieldId, FieldId[]> = {
  it: ['engineering', 'science'],
  engineering: ['it', 'science'],
  medicine: ['science'],
  business: ['economics', 'media'],
  economics: ['business', 'it'],
  design: ['media'],
  law: ['social'],
  social: ['law', 'media', 'education'],
  science: ['it', 'engineering', 'medicine'],
  media: ['design', 'social'],
  education: ['social'],
  agro: ['science'],
}

const NEAR_COUNTRIES = new Set(['KZ', 'RU', 'CN', 'TR'])

const clamp01 = (n: number) => Math.max(0, Math.min(1, n))

/**
 * Лучший доступный уровень английского: сданный IELTS, пересчитанный TOEFL
 * или самооценка уровня — берётся максимум из того, что есть.
 */
export function effectiveIelts(profile: Profile): number {
  const fromToefl = profile.exams.toefl !== undefined ? toeflToIelts(profile.exams.toefl) : 0
  return Math.max(profile.exams.ielts ?? 0, fromToefl, ENGLISH_TO_IELTS[profile.english])
}

/** Стоимость года: нижняя граница обучения плюс проживание. */
export function yearlyCost(program: Program): number {
  return program.tuitionUsd[0] + program.livingUsd * 10
}

function fieldScore(profile: Profile, program: Program): number {
  if (profile.fields.length === 0) return 0.5
  const primary = profile.fields[0]
  if (program.fields.includes(primary)) {
    // Профильность: программа, для которой это направление основное, ближе к цели,
    // чем та, где оно одно из нескольких.
    return program.fields[0] === primary ? 1 : 0.88
  }
  if (profile.fields.some((f) => program.fields.includes(f))) return 0.74
  const related = profile.fields.some((f) =>
    RELATED_FIELDS[f].some((r) => program.fields.includes(r)),
  )
  return related ? 0.32 : 0
}

/**
 * Насколько текущий показатель дотягивает до требования.
 * Проход впритык даёт 0.85, запас по баллам — до 1.0: так варианты, где пользователь
 * проходит уверенно, отделяются от тех, где он на границе.
 */
function thresholdScore(actual: number, required: number, tolerance: number): number {
  if (actual >= required) {
    const margin = (actual - required) / Math.max(tolerance * 2, 1e-6)
    return 0.85 + 0.15 * clamp01(margin)
  }
  const gap = required - actual
  if (gap <= tolerance) return 0.58
  if (gap <= tolerance * 2) return 0.28
  return 0.07
}

interface AdmissionResult {
  score: number
  gaps: string[]
  factors: { label: string; verdict: string; tone: ReasonTone }[]
}

function admissionScore(
  profile: Profile,
  program: Program,
  ach: AchievementSummary,
): AdmissionResult {
  const parts: number[] = []
  const gaps: string[] = []
  const factors: { label: string; verdict: string; tone: ReasonTone }[] = []
  const req = program.requirements
  const add = (label: string, verdict: string, tone: ReasonTone) =>
    factors.push({ label, verdict, tone })

  if (req.ent !== undefined) {
    if (profile.exams.ent !== undefined) {
      parts.push(thresholdScore(profile.exams.ent, req.ent, 10))
      if (profile.exams.ent < req.ent) {
        gaps.push(L(
          `ЕНТ: сейчас ${profile.exams.ent}, ориентир ${req.ent} баллов`,
          `ҰБТ: қазір ${profile.exams.ent}, бағдар — ${req.ent} балл`,
        ))
        add(L('ЕНТ', 'ҰБТ'), L(`${profile.exams.ent} из ориентира ${req.ent}`, `${req.ent} бағдарынан ${profile.exams.ent}`), 'watch')
      } else {
        add(L('ЕНТ', 'ҰБТ'), L(`${profile.exams.ent} при ориентире ${req.ent}`, `бағдар ${req.ent} кезінде ${profile.exams.ent}`), 'good')
      }
    } else if (profile.exams.planned.includes('ent')) {
      parts.push(0.6)
      gaps.push(L(
        `ЕНТ ещё не сдан, ориентир ${req.ent} баллов`,
        `ҰБТ әлі тапсырылмаған, бағдар — ${req.ent} балл`,
      ))
      add(L('ЕНТ', 'ҰБТ'), L(`в планах, ориентир ${req.ent}`, `жоспарда, бағдар ${req.ent}`), 'neutral')
    } else {
      parts.push(0.15)
      gaps.push(L(
        'ЕНТ не в планах, а без него на грант не подать',
        'ҰБТ жоспарда жоқ, ал онсыз грантқа өтінім берілмейді',
      ))
      add(L('ЕНТ', 'ҰБТ'), L('не в планах', 'жоспарда жоқ'), 'watch')
    }
  }

  if (req.ielts !== undefined) {
    const ielts = effectiveIelts(profile)
    parts.push(thresholdScore(ielts, req.ielts, 0.5))
    if (ielts < req.ielts) {
      gaps.push(L(
        `Английский: ориентир IELTS ${req.ielts}, оценка твоего уровня — ${ielts.toFixed(1)}`,
        `Ағылшын тілі: бағдар IELTS ${req.ielts}, сенің деңгейің шамамен ${ielts.toFixed(1)}`,
      ))
      add(L('Английский', 'Ағылшын тілі'), L(`${ielts.toFixed(1)} из ориентира IELTS ${req.ielts}`, `IELTS ${req.ielts} бағдарынан ${ielts.toFixed(1)}`), 'watch')
    } else {
      add(L('Английский', 'Ағылшын тілі'), L(`${ielts.toFixed(1)} при ориентире IELTS ${req.ielts}`, `бағдар IELTS ${req.ielts} кезінде ${ielts.toFixed(1)}`), 'good')
    }
  }

  if (req.sat !== undefined) {
    if (profile.exams.sat !== undefined) {
      parts.push(thresholdScore(profile.exams.sat, req.sat, 80))
      if (profile.exams.sat < req.sat) {
        gaps.push(L(`SAT: сейчас ${profile.exams.sat}, ориентир ${req.sat}`, `SAT: қазір ${profile.exams.sat}, бағдар ${req.sat}`))
      }
    } else if (profile.exams.planned.includes('sat')) {
      parts.push(0.55)
      gaps.push(L(`SAT ещё не сдан, ориентир ${req.sat}`, `SAT әлі тапсырылмаған, бағдар ${req.sat}`))
    } else {
      parts.push(0.2)
      gaps.push(L(`Нужен SAT около ${req.sat}, его нет в планах`, `Шамамен ${req.sat} SAT керек, ол жоспарда жоқ`))
    }
    add(
      'SAT',
      profile.exams.sat !== undefined
        ? L(`${profile.exams.sat} при ориентире ${req.sat}`, `бағдар ${req.sat} кезінде ${profile.exams.sat}`)
        : profile.exams.planned.includes('sat')
          ? L(`в планах, ориентир ${req.sat}`, `жоспарда, бағдар ${req.sat}`)
          : L('не в планах', 'жоспарда жоқ'),
      profile.exams.sat !== undefined && profile.exams.sat >= req.sat ? 'good'
        : profile.exams.planned.includes('sat') ? 'neutral' : 'watch',
    )
  }

  // Диплом IB вузы, которые его принимают, читают напрямую — тогда средний балл
  // школы уже не нужен, сравнение идёт по баллам диплома.
  const usesIb = req.ib !== undefined && profile.exams.ib !== undefined
  if (usesIb) {
    parts.push(thresholdScore(profile.exams.ib!, req.ib!, 2))
    if (profile.exams.ib! < req.ib!) {
      gaps.push(L(
        `Диплом IB: сейчас ${profile.exams.ib}, ориентир ${req.ib} баллов`,
        `IB дипломы: қазір ${profile.exams.ib}, бағдар — ${req.ib} балл`,
      ))
      add('IB', L(`${profile.exams.ib} из ориентира ${req.ib}`, `${req.ib} бағдарынан ${profile.exams.ib}`), 'watch')
    } else {
      add('IB', L(`${profile.exams.ib} при ориентире ${req.ib}`, `бағдар ${req.ib} кезінде ${profile.exams.ib}`), 'good')
    }
  } else if (req.gpa !== undefined) {
    const gpa = effectiveGpa(profile)
    parts.push(thresholdScore(gpa, req.gpa, 0.3))
    const note = gpaSourceLabel(profile)
    const shown = note
      ? L(`${gpa.toFixed(1)} по 5-балльной шкале (${note})`, `5 балдық шкала бойынша ${gpa.toFixed(1)} (${note})`)
      : gpa.toFixed(1)
    if (gpa < req.gpa) {
      gaps.push(L(
        `Средний балл: твой ${gpa.toFixed(1)}, ориентир ${req.gpa.toFixed(1)}`,
        `Орташа балл: сенікі ${gpa.toFixed(1)}, бағдар ${req.gpa.toFixed(1)}`,
      ))
      add(L('Успеваемость', 'Үлгерім'), L(`${shown} из ориентира ${req.gpa.toFixed(1)}`, `${req.gpa.toFixed(1)} бағдарынан ${shown}`), 'watch')
    } else {
      add(L('Успеваемость', 'Үлгерім'), L(`${shown} при ориентире ${req.gpa.toFixed(1)}`, `бағдар ${req.gpa.toFixed(1)} кезінде ${shown}`), 'good')
    }
  }

  if (req.portfolio) {
    // Творческие и проектные достижения — это и есть портфолио.
    const hasWorks = (ach.byKind.project ?? 0) + (ach.byKind.art ?? 0) + (ach.byKind.hackathon ?? 0) > 0
    const ready = profile.exams.planned.includes('portfolio') || hasWorks
    parts.push(ready ? 0.9 : 0.4)
    if (!ready) {
      gaps.push(L(
        'Нужно портфолио работ, его пока нет в планах',
        'Жұмыстар портфолиосы керек, ол әзірге жоспарда жоқ',
      ))
    }
    add(
      L('Портфолио', 'Портфолио'),
      ready ? L('есть работы или оно в планах', 'жұмыстар бар немесе жоспарда') : L('пока нет', 'әзірге жоқ'),
      ready ? 'good' : 'watch',
    )
  }

  if (req.entranceExam) {
    const ready = profile.exams.planned.includes('localExam')
    parts.push(ready ? 0.85 : 0.5)
    if (!ready) gaps.push(L(`Дополнительное испытание: ${req.entranceExam}`, `Қосымша сынақ: ${req.entranceExam}`))
    add(
      L('Испытание вуза', 'ЖОО сынағы'),
      ready ? L(`в планах: ${req.entranceExam}`, `жоспарда: ${req.entranceExam}`) : req.entranceExam,
      ready ? 'good' : 'neutral',
    )
  }

  if (parts.length === 0) {
    return {
      score: 0.6,
      gaps: [L('Требования уточняются на сайте вуза', 'Талаптар ЖОО сайтында нақтыланады')],
      factors: [{
        label: L('Требования', 'Талаптар'),
        verdict: L('не описаны в демо-наборе', 'демо-жинақта сипатталмаған'),
        tone: 'neutral',
      }],
    }
  }

  const base = parts.reduce((a, b) => a + b, 0) / parts.length

  /**
   * Достижения не заменяют баллы, но там, где заявку читают целиком, они реально
   * добавляют шансов. Поэтому надбавка пропорциональна и силе профиля, и тому,
   * насколько эта программа вообще смотрит на портфолио.
   */
  const boost = 0.14 * ach.strength * holisticFactor(program.holistic)
  if (ach.count > 0 && program.holistic >= 3) {
    add(
      L('Достижения', 'Жетістіктер'),
      ach.strength >= 0.5
        ? L('сильный профиль, здесь его читают внимательно', 'күшті профиль, мұнда оны мұқият оқиды')
        : L('есть, но профиль можно усилить', 'бар, бірақ профильді күшейтуге болады'),
      ach.strength >= 0.5 ? 'good' : 'neutral',
    )
  } else if (ach.count === 0 && program.holistic >= 4) {
    add(
      L('Достижения', 'Жетістіктер'),
      L('здесь смотрят на активности, а в анкете их нет', 'мұнда белсенділікке қарайды, ал сауалнамада ол жоқ'),
      'watch',
    )
    gaps.push(L(
      'Здесь читают всю заявку: без достижений и активностей шансы ниже',
      'Мұнда өтінім түгел оқылады: жетістік пен белсенділіксіз мүмкіндік төмен',
    ))
  }

  return { score: Math.min(1, base + boost), gaps, factors }
}

/**
 * Насколько внеучебный профиль помогает именно этой программе.
 * Там, где решают только баллы, вклад нейтральный для всех; там, где заявку
 * рассматривают целиком, разница между пустой и сильной анкетой максимальная.
 */
function profileStrengthScore(program: Program, ach: AchievementSummary): number {
  const factor = holisticFactor(program.holistic)
  const relevanceBonus = ach.count > 0 ? 0.15 * ach.relevance : 0
  const value = Math.min(1, ach.strength + relevanceBonus)
  return factor * value + (1 - factor) * 0.5
}

function budgetScore(profile: Profile, program: Program): number {
  // Подстраховка: неизвестный бюджет не должен превращать балл в NaN и ломать
  // сортировку всей выдачи — в таком случае считаем бюджет самым широким.
  const max = BUDGET_MAX[profile.budget] ?? BUDGET_MAX.above15k
  const tuition = program.tuitionUsd[0]
  if (profile.budget === 'grant-only') {
    if (tuition === 0) return 1
    return program.grant.available ? 0.58 : 0.04
  }
  // Запас по бюджету тоже ценность: программа за треть бюджета комфортнее,
  // чем та, что съедает его целиком.
  if (tuition <= max) return 0.82 + 0.18 * clamp01(1 - tuition / max)
  if (program.grant.available && tuition <= max * 2.5) return 0.52
  if (program.grant.available) return 0.24
  return clamp01(0.35 - (tuition - max) / (max * 6))
}

function geoScore(profile: Profile, program: Program): number {
  if (profile.countries.includes(program.country)) return 1
  if (!profile.relocation) return program.country === 'KZ' ? 0.9 : 0.04
  // База выросла до нескольких сотен программ, и без этого названные страны
  // тонули в общем потоке: человек выбирал Британию, а видел только Казахстан.
  // Страна, которую человек назвал сам, должна заметно опережать остальные,
  // но Казахстан остаётся видимым как запасной вариант рядом с домом.
  if (profile.countries.length > 0) {
    if (program.country === 'KZ') return 0.34
    return NEAR_COUNTRIES.has(program.country) ? 0.2 : 0.12
  }
  return NEAR_COUNTRIES.has(program.country) ? 0.42 : 0.3
}

function languageScore(profile: Profile, program: Program): number {
  const shared = program.languages.filter((l) => profile.languages.includes(l))
  if (shared.length === 0) return 0.1
  if (shared.includes('en')) {
    const rank = ENGLISH_RANK[profile.english]
    if (rank >= 3) return 1
    if (rank === 2) return 0.62
    return 0.25
  }
  return 1
}

function priorityScore(profile: Profile, program: Program): number {
  if (profile.priorities.length === 0) return 0.6
  const cost = yearlyCost(program)
  const values = profile.priorities.map((p) => {
    switch (p) {
      case 'cost':
        return clamp01(1 - cost / 30000)
      case 'prestige':
        return program.prestige / 5
      case 'employability':
        return program.employability / 5
      case 'closeToHome':
        if (program.country === 'KZ') return 1
        return NEAR_COUNTRIES.has(program.country) ? 0.5 : 0.15
      case 'community':
        return clamp01((program.prestige + program.employability) / 10 + 0.1)
    }
  })
  return values.reduce((a, b) => a + b, 0) / values.length
}

function money(n: number): string {
  return '$' + n.toLocaleString('ru-RU')
}

/** Короткие подписи-теги причин. */
const TAG = {
  field: () => L('Направление', 'Бағыт'),
  budget: () => L('Бюджет', 'Бюджет'),
  language: () => L('Язык', 'Тіл'),
  geo: () => L('География', 'География'),
  career: () => L('Карьера', 'Мансап'),
  prestige: () => L('Репутация', 'Бедел'),
  cost: () => L('Стоимость', 'Құны'),
  achievements: () => L('Достижения', 'Жетістіктер'),
}

function buildReasons(
  profile: Profile,
  program: Program,
  b: ScoreBreakdown,
  ach: AchievementSummary,
): { reasons: Reason[]; watchouts: Reason[] } {
  const reasons: Reason[] = []
  const watchouts: Reason[] = []

  // Направление
  const matched = program.fields.filter((f) => profile.fields.includes(f))
  if (matched.length > 0) {
    const isPrimary = program.fields.includes(profile.fields[0])
    reasons.push({
      tone: 'good',
      tag: TAG.field(),
      text: isPrimary
        ? L(
            `Это твой главный интерес — ${softLower(FIELD_LABEL[profile.fields[0]])}. Программа «${program.program}» напрямую про него.`,
            `Бұл сенің басты қызығушылығың — ${softLower(FIELD_LABEL[profile.fields[0]])}. «${program.program}» бағдарламасы дәл сол туралы.`,
          )
        : L(
            `Совпадает с твоим интересом: ${listOf(matched.map((f) => softLower(FIELD_LABEL[f])))}.`,
            `Қызығушылығыңмен сәйкес келеді: ${listOf(matched.map((f) => softLower(FIELD_LABEL[f])))}.`,
          ),
    })
  } else {
    watchouts.push({
      tone: 'watch',
      tag: TAG.field(),
      text: L(
        'Прямого совпадения с выбранными интересами нет, вариант показан как смежный.',
        'Таңдалған қызығушылықтармен тікелей сәйкестік жоқ, нұсқа сабақтас ретінде көрсетілген.',
      ),
    })
  }

  // Бюджет
  const tuition = program.tuitionUsd[0]
  const total = yearlyCost(program)
  if (tuition === 0) {
    reasons.push({
      tone: 'good',
      tag: TAG.budget(),
      text: L(
        `Обучение бесплатное для поступивших: ${softLower(program.grant.note)}. Остаются расходы на жизнь — около ${money(program.livingUsd)} в месяц.`,
        `Түскендер үшін оқу тегін: ${softLower(program.grant.note)}. Тұрмыс шығыны қалады — айына шамамен ${money(program.livingUsd)}.`,
      ),
    })
  } else if (b.budget >= WEIGHTS.budget * 0.8) {
    reasons.push({
      tone: 'good',
      tag: TAG.budget(),
      text: L(
        `Обучение от ${money(tuition)} в год укладывается в твой бюджет. С учётом проживания выходит примерно ${money(total)} за год.`,
        `Жылына ${money(tuition)} бастап оқу сенің бюджетіңе сыяды. Тұрумен бірге жылына шамамен ${money(total)} шығады.`,
      ),
    })
  } else if (program.grant.available) {
    reasons.push({
      tone: 'neutral',
      tag: TAG.budget(),
      text: L(
        `Полная стоимость выше твоего бюджета (${money(tuition)} в год), но вариант остаётся реальным через грант: ${softLower(program.grant.note)}.`,
        `Толық құны бюджетіңнен жоғары (жылына ${money(tuition)}), бірақ грант арқылы нұсқа нақты қалады: ${softLower(program.grant.note)}.`,
      ),
    })
    watchouts.push({
      tone: 'watch',
      tag: TAG.budget(),
      text: L(
        'Без гранта эта программа не вписывается в указанный бюджет.',
        'Грантсыз бұл бағдарлама көрсетілген бюджетке сыймайды.',
      ),
    })
  } else {
    watchouts.push({
      tone: 'watch',
      tag: TAG.budget(),
      text: L(
        `Стоимость от ${money(tuition)} в год заметно выше твоего бюджета, а гранта для международных студентов здесь нет.`,
        `Жылына ${money(tuition)} бастап құны бюджетіңнен едәуір жоғары, ал мұнда шетелдік студенттерге грант жоқ.`,
      ),
    })
  }

  // Язык
  const shared = program.languages.filter((l) => profile.languages.includes(l))
  if (shared.length > 0) {
    if (shared.includes('en') && ENGLISH_RANK[profile.english] < 3) {
      watchouts.push({
        tone: 'watch',
        tag: TAG.language(),
        text: L(
          'Обучение на английском, а в профиле уровень ниже B2. До подачи стоит подтянуть язык.',
          'Оқу ағылшын тілінде, ал профильдегі деңгей B2-ден төмен. Өтінім бергенге дейін тілді күшейткен жөн.',
        ),
      })
    } else {
      reasons.push({
        tone: 'good',
        tag: TAG.language(),
        text: L(
          `Обучение на языке, которым ты владеешь: ${shared.map((l) => softLower(LANGUAGE_LABEL[l])).join(' или ')}.`,
          `Оқу сен білетін тілде: ${shared.map((l) => softLower(LANGUAGE_LABEL[l])).join(' немесе ')}.`,
        ),
      })
    }
  } else {
    watchouts.push({
      tone: 'watch',
      tag: TAG.language(),
      text: L(
        `Программа читается на ${program.languages.map((l) => softLower(LANGUAGE_LABEL[l])).join('/')}, этого языка нет в твоём профиле.`,
        `Бағдарлама ${program.languages.map((l) => softLower(LANGUAGE_LABEL[l])).join('/')} тілінде оқылады, бұл тіл профиліңде жоқ.`,
      ),
    })
  }

  // География
  if (profile.countries.includes(program.country)) {
    reasons.push({
      tone: 'good',
      tag: TAG.geo(),
      text: L(
        `${COUNTRY_LABEL[program.country]} — одна из выбранных тобой стран, город: ${program.city}.`,
        `${COUNTRY_LABEL[program.country]} — сен таңдаған елдердің бірі, қала: ${program.city}.`,
      ),
    })
  } else if (profile.relocation) {
    reasons.push({
      tone: 'neutral',
      tag: TAG.geo(),
      text: L(
        `${COUNTRY_LABEL[program.country]} не был в твоём списке, но в анкете отмечена готовность к переезду, поэтому вариант остался в подборе.`,
        `${COUNTRY_LABEL[program.country]} тізіміңде болмады, бірақ сауалнамада көшуге дайын екенің белгіленген, сондықтан нұсқа таңдауда қалды.`,
      ),
    })
  }

  // Приоритеты
  if (profile.priorities.includes('employability') && program.employability >= 4) {
    reasons.push({
      tone: 'good',
      tag: TAG.career(),
      text: L(
        'В приоритетах отмечена работа после выпуска — у программы сильные связи с работодателями.',
        'Басымдықта бітіргеннен кейінгі жұмыс белгіленген — бағдарламаның жұмыс берушілермен байланысы күшті.',
      ),
    })
  }
  if (profile.priorities.includes('prestige') && program.prestige >= 4) {
    reasons.push({
      tone: 'good',
      tag: TAG.prestige(),
      text: L(
        'Для тебя важно имя вуза — это один из самых сильных вариантов в подборе.',
        'Саған ЖОО атағы маңызды — бұл таңдаудағы ең күшті нұсқалардың бірі.',
      ),
    })
  }
  if (profile.priorities.includes('cost') && total <= 6000) {
    reasons.push({
      tone: 'good',
      tag: TAG.cost(),
      text: L(
        `Низкая стоимость отмечена как приоритет: полный год здесь обходится примерно в ${money(total)}.`,
        `Төмен құн басымдық ретінде белгіленген: мұнда толық жыл шамамен ${money(total)} тұрады.`,
      ),
    })
  }

  // Достижения
  if (program.holistic >= 4) {
    if (ach.strength >= 0.45) {
      reasons.push({
        tone: 'good',
        tag: TAG.achievements(),
        text: L(
          `Здесь заявку читают целиком, а не только по баллам. Твои достижения — ${ach.highlights[0] ?? 'указанные в анкете'} — работают именно на такой приём.`,
          `Мұнда өтінім тек балл бойынша емес, түгел оқылады. Жетістіктерің — ${ach.highlights[0] ?? 'сауалнамада көрсетілгені'} — дәл осындай қабылдауға жұмыс істейді.`,
        ),
      })
    } else if (ach.count === 0) {
      watchouts.push({
        tone: 'watch',
        tag: TAG.achievements(),
        text: L(
          'Этот вуз смотрит на олимпиады, проекты и активности, а в анкете их пока нет.',
          'Бұл ЖОО олимпиада, жоба және белсенділікке қарайды, ал сауалнамада олар әзірге жоқ.',
        ),
      })
    }
  } else if (program.holistic <= 2 && ach.strength >= 0.5) {
    watchouts.push({
      tone: 'neutral',
      tag: TAG.achievements(),
      text: L(
        'Здесь решают баллы экзаменов: сильное портфолио почти не влияет на приём.',
        'Мұнда емтихан баллы шешеді: күшті портфолио қабылдауға дерлік әсер етпейді.',
      ),
    })
  }

  return { reasons: reasons.slice(0, 5), watchouts: watchouts.slice(0, 3) }
}

function buildChance(adm: AdmissionResult, program: Program): Chance {
  const { score: admission, gaps, factors } = adm
  const hasData = Object.keys(program.requirements).length > 0
  if (!hasData) {
    return {
      level: 'unknown',
      explanation: L(
        'Требования этой программы не описаны в демо-наборе, оценить шансы нельзя.',
        'Бұл бағдарламаның талаптары демо-жинақта сипатталмаған, мүмкіндікті бағалау мүмкін емес.',
      ),
      gaps,
      factors,
    }
  }
  if (admission >= 0.85) {
    return {
      level: 'high',
      explanation:
        gaps.length === 0
          ? L(
              'По демо-требованиям ты проходишь по всем указанным критериям. Это ориентир, а не гарантия: конкурс зависит от числа заявок в конкретном году.',
              'Демо-талаптар бойынша сен барлық көрсетілген өлшемнен өтесің. Бұл — бағдар, кепілдік емес: бәсеке сол жылғы өтінім санына байланысты.',
            )
          : L(
              'Ты закрываешь почти все указанные требования. Это ориентир на демо-данных, а не гарантия поступления.',
              'Сен көрсетілген талаптардың барлығына дерлік сай келесің. Бұл — демо-деректерге негізделген бағдар, түсу кепілдігі емес.',
            ),
      gaps,
      factors,
    }
  }
  if (admission >= 0.55) {
    return {
      level: 'medium',
      explanation: L(
        'Часть требований пока не закрыта, но разрыв реально сократить до подачи. Оценка ориентировочная, на демо-данных.',
        'Талаптардың бір бөлігі әзірге жабылмаған, бірақ айырманы өтінімге дейін азайтуға болады. Баға болжамды, демо-деректерге негізделген.',
      ),
      gaps,
      factors,
    }
  }
  return {
    level: 'low',
    explanation: L(
      'По демо-требованиям разрыв большой. Вариант стоит держать как запасной или заранее закрыть перечисленные пункты.',
      'Демо-талаптар бойынша айырма үлкен. Нұсқаны қосалқы ретінде ұстаған немесе аталған тармақтарды алдын ала жапқан жөн.',
    ),
    gaps,
    factors,
  }
}

export function scoreProgram(
  profile: Profile,
  program: Program,
  ach: AchievementSummary = summarizeAchievements(profile),
): Recommendation {
  const adm = admissionScore(profile, program, ach)
  const fit = fieldScore(profile, program)

  /**
   * Направление — это ворота, а не ещё один критерий. Дешёвая программа рядом с домом
   * не становится подходящей, если она не про то, чем человек хочет заниматься,
   * поэтому остальные критерии приглушаются, когда совпадения по направлению нет.
   */
  const relevance = 0.25 + 0.75 * fit

  const breakdown: ScoreBreakdown = {
    field: fit * WEIGHTS.field,
    admission: adm.score * WEIGHTS.admission * relevance,
    budget: budgetScore(profile, program) * WEIGHTS.budget * relevance,
    geo: geoScore(profile, program) * WEIGHTS.geo * relevance,
    language: languageScore(profile, program) * WEIGHTS.language * relevance,
    priority: priorityScore(profile, program) * WEIGHTS.priority * relevance,
    profile: profileStrengthScore(program, ach) * WEIGHTS.profile * relevance,
  }
  const score = Math.round(Object.values(breakdown).reduce((a, b) => a + b, 0))
  const { reasons, watchouts } = buildReasons(profile, program, breakdown, ach)
  const total = yearlyCost(program)

  return {
    program,
    score,
    breakdown,
    reasons,
    watchouts,
    chance: buildChance(adm, program),
    yearlyCostUsd: total,
    affordable:
      profile.budget === 'grant-only'
        ? program.tuitionUsd[0] === 0 || program.grant.available
        : program.tuitionUsd[0] <= BUDGET_MAX[profile.budget],
  }
}

/**
 * Полный отсортированный подбор.
 *
 * Готовность к переезду — не предпочтение, а жёсткое ограничение: если человек
 * не может уехать, программа в другой стране для него не существует, каким бы
 * высоким ни было совпадение по остальным критериям. Поэтому здесь фильтр,
 * а не понижающий коэффициент.
 */
export function recommend(profile: Profile): Recommendation[] {
  const reachable = profile.relocation
    ? PROGRAMS
    : PROGRAMS.filter((p) => profile.countries.includes(p.country))

  // Свод по достижениям считается один раз на весь подбор, а не для каждой программы.
  const ach = summarizeAchievements(profile)
  return reachable.map((p) => scoreProgram(profile, p, ach)).sort((a, b) => b.score - a.score)
}

export function scoreLabel(score: number): string {
  if (score >= 78) return L('Сильное совпадение', 'Күшті сәйкестік')
  if (score >= 62) return L('Хорошее совпадение', 'Жақсы сәйкестік')
  if (score >= 45) return L('Частичное совпадение', 'Ішінара сәйкестік')
  return L('Слабое совпадение', 'Әлсіз сәйкестік')
}
