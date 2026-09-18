import type {
  Chance, FieldId, Profile, Program, Reason, ReasonTone, Recommendation, ScoreBreakdown,
} from '../types'
import {
  BUDGET_MAX, COUNTRY_LABEL, ENGLISH_TO_IELTS, ENGLISH_RANK,
  FIELD_LABEL, LANGUAGE_LABEL,
} from '../data/taxonomy'
import { PROGRAMS } from '../data/programs'
import { listOf, softLower } from '../lib/text'
import { effectiveGpa, gpaSourceLabel, toeflToIelts } from './academics'
import { holisticFactor, summarizeAchievements, type AchievementSummary } from './achievements'

/**
 * Веса критериев подбора. Сумма — 100, поэтому итоговый score читается как процент
 * совпадения и его можно показать пользователю без дополнительной нормализации.
 */
export const WEIGHTS = {
  field: 26,
  admission: 20,
  budget: 18,
  geo: 11,
  language: 9,
  priority: 7,
  profile: 9,
} as const

export const WEIGHT_LABEL: Record<keyof ScoreBreakdown, string> = {
  field: 'Направление',
  admission: 'Проходимость',
  budget: 'Бюджет',
  geo: 'География',
  language: 'Язык',
  priority: 'Приоритеты',
  profile: 'Достижения',
}

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
        gaps.push(`ЕНТ: сейчас ${profile.exams.ent}, ориентир ${req.ent} баллов`)
        add('ЕНТ', `${profile.exams.ent} из ориентира ${req.ent}`, 'watch')
      } else {
        add('ЕНТ', `${profile.exams.ent} при ориентире ${req.ent}`, 'good')
      }
    } else if (profile.exams.planned.includes('ent')) {
      parts.push(0.6)
      gaps.push(`ЕНТ ещё не сдан, ориентир ${req.ent} баллов`)
      add('ЕНТ', `в планах, ориентир ${req.ent}`, 'neutral')
    } else {
      parts.push(0.15)
      gaps.push('ЕНТ не в планах, а без него на грант не подать')
      add('ЕНТ', 'не в планах', 'watch')
    }
  }

  if (req.ielts !== undefined) {
    const ielts = effectiveIelts(profile)
    parts.push(thresholdScore(ielts, req.ielts, 0.5))
    if (ielts < req.ielts) {
      gaps.push(`Английский: ориентир IELTS ${req.ielts}, оценка твоего уровня — ${ielts.toFixed(1)}`)
      add('Английский', `${ielts.toFixed(1)} из ориентира IELTS ${req.ielts}`, 'watch')
    } else {
      add('Английский', `${ielts.toFixed(1)} при ориентире IELTS ${req.ielts}`, 'good')
    }
  }

  if (req.sat !== undefined) {
    if (profile.exams.sat !== undefined) {
      parts.push(thresholdScore(profile.exams.sat, req.sat, 80))
      if (profile.exams.sat < req.sat) gaps.push(`SAT: сейчас ${profile.exams.sat}, ориентир ${req.sat}`)
    } else if (profile.exams.planned.includes('sat')) {
      parts.push(0.55)
      gaps.push(`SAT ещё не сдан, ориентир ${req.sat}`)
    } else {
      parts.push(0.2)
      gaps.push(`Нужен SAT около ${req.sat}, его нет в планах`)
    }
    add(
      'SAT',
      profile.exams.sat !== undefined
        ? `${profile.exams.sat} при ориентире ${req.sat}`
        : profile.exams.planned.includes('sat')
          ? `в планах, ориентир ${req.sat}`
          : 'не в планах',
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
      gaps.push(`Диплом IB: сейчас ${profile.exams.ib}, ориентир ${req.ib} баллов`)
      add('IB', `${profile.exams.ib} из ориентира ${req.ib}`, 'watch')
    } else {
      add('IB', `${profile.exams.ib} при ориентире ${req.ib}`, 'good')
    }
  } else if (req.gpa !== undefined) {
    const gpa = effectiveGpa(profile)
    parts.push(thresholdScore(gpa, req.gpa, 0.3))
    const note = gpaSourceLabel(profile)
    const shown = note ? `${gpa.toFixed(1)} по 5-балльной шкале (${note})` : gpa.toFixed(1)
    if (gpa < req.gpa) {
      gaps.push(`Средний балл: твой ${gpa.toFixed(1)}, ориентир ${req.gpa.toFixed(1)}`)
      add('Успеваемость', `${shown} из ориентира ${req.gpa.toFixed(1)}`, 'watch')
    } else {
      add('Успеваемость', `${shown} при ориентире ${req.gpa.toFixed(1)}`, 'good')
    }
  }

  if (req.portfolio) {
    // Творческие и проектные достижения — это и есть портфолио.
    const hasWorks = (ach.byKind.project ?? 0) + (ach.byKind.art ?? 0) + (ach.byKind.hackathon ?? 0) > 0
    const ready = profile.exams.planned.includes('portfolio') || hasWorks
    parts.push(ready ? 0.9 : 0.4)
    if (!ready) gaps.push('Нужно портфолио работ, его пока нет в планах')
    add('Портфолио', ready ? 'есть работы или оно в планах' : 'пока нет', ready ? 'good' : 'watch')
  }

  if (req.entranceExam) {
    const ready = profile.exams.planned.includes('localExam')
    parts.push(ready ? 0.85 : 0.5)
    if (!ready) gaps.push(`Дополнительное испытание: ${req.entranceExam}`)
    add('Испытание вуза', ready ? `в планах: ${req.entranceExam}` : req.entranceExam, ready ? 'good' : 'neutral')
  }

  if (parts.length === 0) {
    return {
      score: 0.6,
      gaps: ['Требования уточняются на сайте вуза'],
      factors: [{ label: 'Требования', verdict: 'не описаны в демо-наборе', tone: 'neutral' }],
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
      'Достижения',
      ach.strength >= 0.5
        ? 'сильный профиль, здесь его читают внимательно'
        : 'есть, но профиль можно усилить',
      ach.strength >= 0.5 ? 'good' : 'neutral',
    )
  } else if (ach.count === 0 && program.holistic >= 4) {
    add('Достижения', 'здесь смотрят на активности, а в анкете их нет', 'watch')
    gaps.push('Здесь читают всю заявку: без достижений и активностей шансы ниже')
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
  const max = BUDGET_MAX[profile.budget]
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
      tag: 'Направление',
      text: isPrimary
        ? `Это твой главный интерес — ${softLower(FIELD_LABEL[profile.fields[0]])}. Программа «${program.program}» напрямую про него.`
        : `Совпадает с твоим интересом: ${listOf(matched.map((f) => softLower(FIELD_LABEL[f])))}.`,
    })
  } else {
    watchouts.push({
      tone: 'watch',
      tag: 'Направление',
      text: 'Прямого совпадения с выбранными интересами нет, вариант показан как смежный.',
    })
  }

  // Бюджет
  const tuition = program.tuitionUsd[0]
  const total = yearlyCost(program)
  if (tuition === 0) {
    reasons.push({
      tone: 'good',
      tag: 'Бюджет',
      text: `Обучение бесплатное для поступивших: ${softLower(program.grant.note)}. Остаются расходы на жизнь — около ${money(program.livingUsd)} в месяц.`,
    })
  } else if (b.budget >= WEIGHTS.budget * 0.8) {
    reasons.push({
      tone: 'good',
      tag: 'Бюджет',
      text: `Обучение от ${money(tuition)} в год укладывается в твой бюджет. С учётом проживания выходит примерно ${money(total)} за год.`,
    })
  } else if (program.grant.available) {
    reasons.push({
      tone: 'neutral',
      tag: 'Бюджет',
      text: `Полная стоимость выше твоего бюджета (${money(tuition)} в год), но вариант остаётся реальным через грант: ${softLower(program.grant.note)}.`,
    })
    watchouts.push({
      tone: 'watch',
      tag: 'Бюджет',
      text: 'Без гранта эта программа не вписывается в указанный бюджет.',
    })
  } else {
    watchouts.push({
      tone: 'watch',
      tag: 'Бюджет',
      text: `Стоимость от ${money(tuition)} в год заметно выше твоего бюджета, а гранта для международных студентов здесь нет.`,
    })
  }

  // Язык
  const shared = program.languages.filter((l) => profile.languages.includes(l))
  if (shared.length > 0) {
    if (shared.includes('en') && ENGLISH_RANK[profile.english] < 3) {
      watchouts.push({
        tone: 'watch',
        tag: 'Язык',
        text: `Обучение на английском, а в профиле уровень ниже B2. До подачи стоит подтянуть язык.`,
      })
    } else {
      reasons.push({
        tone: 'good',
        tag: 'Язык',
        text: `Обучение на языке, которым ты владеешь: ${shared.map((l) => softLower(LANGUAGE_LABEL[l])).join(' или ')}.`,
      })
    }
  } else {
    watchouts.push({
      tone: 'watch',
      tag: 'Язык',
      text: `Программа читается на ${program.languages.map((l) => softLower(LANGUAGE_LABEL[l])).join('/')}, этого языка нет в твоём профиле.`,
    })
  }

  // География
  if (profile.countries.includes(program.country)) {
    reasons.push({
      tone: 'good',
      tag: 'География',
      text: `${COUNTRY_LABEL[program.country]} — одна из выбранных тобой стран, город: ${program.city}.`,
    })
  } else if (profile.relocation) {
    reasons.push({
      tone: 'neutral',
      tag: 'География',
      text: `${COUNTRY_LABEL[program.country]} не был в твоём списке, но в анкете отмечена готовность к переезду, поэтому вариант остался в подборе.`,
    })
  }

  // Приоритеты
  if (profile.priorities.includes('employability') && program.employability >= 4) {
    reasons.push({
      tone: 'good',
      tag: 'Карьера',
      text: 'В приоритетах отмечена работа после выпуска — у программы сильные связи с работодателями.',
    })
  }
  if (profile.priorities.includes('prestige') && program.prestige >= 4) {
    reasons.push({
      tone: 'good',
      tag: 'Репутация',
      text: 'Для тебя важно имя вуза — это один из самых сильных вариантов в подборе.',
    })
  }
  if (profile.priorities.includes('cost') && total <= 6000) {
    reasons.push({
      tone: 'good',
      tag: 'Стоимость',
      text: `Низкая стоимость отмечена как приоритет: полный год здесь обходится примерно в ${money(total)}.`,
    })
  }

  // Достижения
  if (program.holistic >= 4) {
    if (ach.strength >= 0.45) {
      reasons.push({
        tone: 'good',
        tag: 'Достижения',
        text: `Здесь заявку читают целиком, а не только по баллам. Твои достижения — ${ach.highlights[0] ?? 'указанные в анкете'} — работают именно на такой приём.`,
      })
    } else if (ach.count === 0) {
      watchouts.push({
        tone: 'watch',
        tag: 'Достижения',
        text: 'Этот вуз смотрит на олимпиады, проекты и активности, а в анкете их пока нет.',
      })
    }
  } else if (program.holistic <= 2 && ach.strength >= 0.5) {
    watchouts.push({
      tone: 'neutral',
      tag: 'Достижения',
      text: 'Здесь решают баллы экзаменов: сильное портфолио почти не влияет на приём.',
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
      explanation: 'Требования этой программы не описаны в демо-наборе, оценить шансы нельзя.',
      gaps,
      factors,
    }
  }
  if (admission >= 0.85) {
    return {
      level: 'high',
      explanation:
        gaps.length === 0
          ? 'По демо-требованиям ты проходишь по всем указанным критериям. Это ориентир, а не гарантия: конкурс зависит от числа заявок в конкретном году.'
          : 'Ты закрываешь почти все указанные требования. Это ориентир на демо-данных, а не гарантия поступления.',
      gaps,
      factors,
    }
  }
  if (admission >= 0.55) {
    return {
      level: 'medium',
      explanation:
        'Часть требований пока не закрыта, но разрыв реально сократить до подачи. Оценка ориентировочная, на демо-данных.',
      gaps,
      factors,
    }
  }
  return {
    level: 'low',
    explanation:
      'По демо-требованиям разрыв большой. Вариант стоит держать как запасной или заранее закрыть перечисленные пункты.',
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
  if (score >= 78) return 'Сильное совпадение'
  if (score >= 62) return 'Хорошее совпадение'
  if (score >= 45) return 'Частичное совпадение'
  return 'Слабое совпадение'
}
