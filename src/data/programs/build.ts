import type {
  CountryCode, DeadlineHint, FieldId, LanguageCode, Program, Requirement,
} from '../../types'

/**
 * Факты, общие для всей страны: язык обучения, стоимость жизни, цикл подачи,
 * характер приёма. Раньше они повторялись в каждой программе, из-за чего база
 * расползалась и расходилась сама с собой. Теперь страна описывается один раз,
 * а программа задаёт только то, чем она отличается.
 */
export interface CountryProfile {
  code: CountryCode
  /** Языки обучения по умолчанию. */
  langs: LanguageCode[]
  /** Ориентировочные расходы на жизнь, USD в месяц. */
  living: number
  /** Насколько приём смотрит на заявку целиком, 1–5. */
  holistic: number
  /** Что со стипендиями и бесплатным обучением в этой стране. */
  grant: string
  /** Есть ли грант или стипендия для международных студентов. */
  grantAvailable: boolean
  /** Типовой цикл подачи: [подпись, период, месяц начала, месяц конца]. */
  cycle: [string, string, number, number][]
  durationYears: number
}

/** Программа в компактной записи: только то, что отличает её от страны. */
export interface ProgramSpec {
  id: string
  uni: string
  short: string
  city: string
  prog: string
  fields: FieldId[]
  /** Стоимость обучения, USD в год. */
  tuition: [number, number]
  req: Requirement
  hi: string[]
  /** [подпись источника, https-ссылка]. */
  src: [string, string]
  emp: number
  pres: number
  /** Переопределения страновых значений, когда программа выбивается из общего ряда. */
  langs?: LanguageCode[]
  living?: number
  holistic?: number
  grant?: string
  grantAvailable?: boolean
  cycle?: [string, string, number, number][]
  years?: number
}

function toDeadlines(cycle: [string, string, number, number][]): DeadlineHint[] {
  return cycle.map(([label, window, startMonth, endMonth]) => ({
    label, window, startMonth, endMonth,
  }))
}

/**
 * Собирает программы страны. Идентификатор программы получает префикс страны,
 * чтобы он оставался уникальным в общей базе и читался в URL.
 */
export function country(profile: CountryProfile, specs: ProgramSpec[]): Program[] {
  const prefix = profile.code.toLowerCase()
  return specs.map((s) => ({
    id: `${prefix}-${s.id}`,
    university: s.uni,
    universityShort: s.short,
    city: s.city,
    country: profile.code,
    program: s.prog,
    fields: s.fields,
    languages: s.langs ?? profile.langs,
    tuitionUsd: s.tuition,
    grant: {
      available: s.grantAvailable ?? profile.grantAvailable,
      note: s.grant ?? profile.grant,
    },
    requirements: s.req,
    deadlines: toDeadlines(s.cycle ?? profile.cycle),
    livingUsd: s.living ?? profile.living,
    durationYears: s.years ?? profile.durationYears,
    highlights: s.hi,
    employability: s.emp,
    prestige: s.pres,
    holistic: s.holistic ?? profile.holistic,
    source: { label: s.src[0], url: s.src[1] },
  }))
}
