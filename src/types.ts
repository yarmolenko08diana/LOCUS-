/**
 * Доменная модель Qadam.
 * Всё, что показывается пользователю, выводится из Profile — поэтому изменение
 * любого ответа в анкете автоматически меняет диагностику, рекомендации и roadmap.
 */

export type CountryCode =
  | 'KZ' | 'RU' | 'TR' | 'CZ' | 'PL' | 'HU' | 'DE' | 'NL' | 'IT'
  | 'GB' | 'US' | 'AE' | 'CN' | 'KR' | 'MY'
  | 'JP' | 'SG' | 'HK' | 'GE'
  | 'CA' | 'AT' | 'FR' | 'ES'

export type FieldId =
  | 'it' | 'engineering' | 'medicine' | 'business' | 'economics'
  | 'design' | 'law' | 'social' | 'science' | 'media' | 'education' | 'agro'

export type LanguageCode =
  | 'kk' | 'ru' | 'en' | 'tr' | 'de'
  | 'cs' | 'pl' | 'hu' | 'it' | 'zh' | 'ko' | 'ja' | 'ka'
  | 'fr' | 'es'

export type EnglishLevel = 'none' | 'a2' | 'b1' | 'b2' | 'c1'

export type Stage = 'grade9' | 'grade10' | 'grade11' | 'graduate'

export type BudgetTier = 'grant-only' | 'upto2k' | 'upto6k' | 'upto15k' | 'above15k'

export type Priority = 'cost' | 'prestige' | 'employability' | 'closeToHome' | 'community'

/** Язык интерфейса. */
export type Lang = 'ru' | 'kk'

/** Оформление интерфейса; 'system' следует за настройкой устройства. */
export type ThemeMode = 'light' | 'dark' | 'system'

/** Учебная система школы: от неё зависит, в каких баллах считать успеваемость. */
export type SchoolSystem = 'kz' | 'nis' | 'ib' | 'other'

/** Экзамены, которые пользователь уже сдал или планирует сдавать. */
export interface ExamState {
  /** Единое национальное тестирование, 0–140. */
  ent?: number
  /** IELTS Academic, 4.0–9.0. */
  ielts?: number
  /** TOEFL iBT, 0–120. */
  toefl?: number
  /** SAT, 400–1600. */
  sat?: number
  /** Итоговый диплом IB, 24–45. */
  ib?: number
  /** Итоговый средний балл НИШ по 100-балльной шкале. */
  nis?: number
  /** CSCA: вступительный экзамен для иностранцев в вузы Китая, 0–100 за предмет. */
  csca?: number
  /** Экзамены, которые пользователь готов сдать, даже если баллов пока нет. */
  planned: ExamId[]
}

export type ExamId = 'ent' | 'ielts' | 'sat' | 'toefl' | 'localExam' | 'portfolio' | 'ib' | 'csca'

/** Виды академических и внеучебных достижений. */
export type AchievementKind =
  | 'olympiad' | 'research' | 'hackathon' | 'contest' | 'course'
  | 'volunteer' | 'leadership' | 'sport' | 'art' | 'internship' | 'project'

/** Масштаб достижения: от школьного до международного. */
export type AchievementLevel = 'school' | 'city' | 'region' | 'national' | 'international'

/** Результат: участие или призовое место. */
export type AchievementAward = 'participant' | 'finalist' | 'bronze' | 'silver' | 'gold'

/**
 * Вид достижения внутри его типа.
 *
 * «Исследование» — это и школьная работа, и статья в журнале, и проект под
 * руководством вуза, а весят они по-разному. Один масштаб этого не передаёт,
 * поэтому вид указывается отдельно и влияет на вес достижения.
 */
export type AchievementForm =
  | 'subject' | 'team' | 'tournament'
  | 'schoolWork' | 'conference' | 'article' | 'labProject' | 'patent'
  | 'hackathonClassic' | 'hackathonOnline' | 'hackathonCorporate' | 'hackathonThematic' | 'ctf'
  | 'competitiveProgramming' | 'researchContest' | 'caseChampionship' | 'startupPitch'
  | 'debate' | 'robotics' | 'creativeContest'
  | 'app' | 'venture' | 'nonprofit' | 'mediaProject'
  | 'onlineCourse' | 'summerSchool' | 'universityProgram'
  | 'regularService' | 'oneOffAction' | 'ownInitiative'
  | 'studentCouncil' | 'clubLead' | 'teamCaptain'
  | 'company' | 'laboratory' | 'ngo'
  | 'competition' | 'nationalTeam' | 'rank'
  | 'exhibition' | 'performance' | 'publication'

export interface Achievement {
  id: string
  kind: AchievementKind
  level: AchievementLevel
  award: AchievementAward
  title: string
  /** Год получения; помогает отличить свежие достижения от давних. */
  year: number
  /** Часы для волонтёрства, курсов и стажировок. */
  hours?: number
  /** Вид внутри типа: статья, конференция, патент и так далее. */
  form?: AchievementForm
}

export interface Profile {
  /** Имя нужно только для тона общения, никуда не отправляется. */
  name: string
  stage: Stage
  fields: FieldId[]
  /** Учебная система школы. */
  schoolSystem: SchoolSystem
  /** Средний балл по 5-балльной шкале, 3.0–5.0. */
  gpa: number
  strongSubjects: string[]
  languages: LanguageCode[]
  english: EnglishLevel
  exams: ExamState
  /** Академические и внеучебные достижения. */
  achievements: Achievement[]
  countries: CountryCode[]
  /** Готовность к переезду в другую страну. */
  relocation: boolean
  budget: BudgetTier
  /** Год предполагаемого поступления, например 2027. */
  intakeYear: number
  priorities: Priority[]
}

export interface Requirement {
  ent?: number
  ielts?: number
  toefl?: number
  sat?: number
  gpa?: number
  /** Минимальный балл диплома IB, если вуз принимает IB напрямую. */
  ib?: number
  portfolio?: boolean
  /**
   * Ориентировочный проходной балл CSCA — среднее по предметам набора из 100.
   * Демонстрационные данные: официальных публичных порогов китайские вузы
   * не печатают, ориентир собран по объявлениям приёмных комиссий.
   */
  csca?: number
  entranceExam?: string
}

export interface DeadlineHint {
  label: string
  /** Ориентировочный период, а не подтверждённая дата: демо-данные. */
  window: string
  /** Месяц начала периода, 1–12: нужен для календаря. */
  startMonth?: number
  /** Месяц конца периода, 1–12. */
  endMonth?: number
  note?: string
}

export interface Program {
  id: string
  university: string
  universityShort: string
  city: string
  country: CountryCode
  program: string
  fields: FieldId[]
  languages: LanguageCode[]
  /** Диапазон стоимости обучения, USD в год. */
  tuitionUsd: [number, number]
  grant: { available: boolean; note: string }
  requirements: Requirement
  deadlines: DeadlineHint[]
  /** Ориентировочные расходы на жизнь, USD в месяц. */
  livingUsd: number
  durationYears: number
  highlights: string[]
  /** Субъективные демо-оценки 1–5 для сравнения вариантов. */
  employability: number
  prestige: number
  /**
   * Насколько приём смотрит на портфолио и внеучебные достижения, 1–5.
   * 1 — решают только баллы экзаменов, 5 — комплексное рассмотрение заявки.
   */
  holistic: number
  source: { label: string; url: string }
}

/** Стипендия или грант, на который можно подать вместе с программой. */
export interface Scholarship {
  id: string
  name: string
  /** Страны обучения, которые покрывает стипендия. */
  countries: CountryCode[]
  /** Что покрывает: коротко и человеческим языком. */
  coverage: string
  /** Направления; пустой массив означает «любое направление». */
  fields: FieldId[]
  requirements: {
    gpa?: number
    ielts?: number
    ent?: number
    /** Нужен ли заметный внеучебный профиль, 0–1. */
    achievements?: number
    note?: string
  }
  /** Ориентировочный период подачи. */
  window: string
  startMonth?: number
  endMonth?: number
  stages: Stage[]
  /**
   * Честное предупреждение о конкурсе: сколько мест реально достаётся
   * казахстанцам. Без этого стипендия с квотой в несколько человек в год
   * читается как обычный вариант, и на неё строят весь план.
   */
  competition?: string
  competitionKk?: string
  source: { label: string; url: string }
}

/** Насколько стипендия подходит профилю. */
export interface ScholarshipMatch {
  scholarship: Scholarship
  /** 0–100. */
  score: number
  reasons: Reason[]
  gaps: string[]
  eligible: boolean
}

export type ReasonTone = 'good' | 'neutral' | 'watch'

export interface Reason {
  tone: ReasonTone
  /** Короткий ярлык для карточки: «Интересы», «Бюджет», «Экзамены». */
  tag: string
  text: string
}

export type ChanceLevel = 'high' | 'medium' | 'low' | 'unknown'

export interface Chance {
  level: ChanceLevel
  /** Ориентировочная оценка на демо-данных, не гарантия. */
  explanation: string
  gaps: string[]
  /** Из чего сложилась оценка: человекочитаемый разбор по пунктам. */
  factors: { label: string; verdict: string; tone: ReasonTone }[]
}

export interface ScoreBreakdown {
  field: number
  admission: number
  budget: number
  geo: number
  language: number
  priority: number
  /** Вклад достижений и внеучебного профиля. */
  profile: number
}

export interface Recommendation {
  program: Program
  /** 0–100, взвешенная сумма ScoreBreakdown. */
  score: number
  breakdown: ScoreBreakdown
  reasons: Reason[]
  watchouts: Reason[]
  chance: Chance
  /** Годовая стоимость обучения и жизни при текущем профиле, USD. */
  yearlyCostUsd: number
  affordable: boolean
}

export interface Diagnosis {
  headline: string
  summary: string
  strengths: string[]
  constraints: string[]
  goal: string
  /** Насколько анкета заполнена содержательно, 0–100. */
  readiness: number
  readinessNote: string
}

export type TaskCategory =
  | 'exam' | 'document' | 'academic' | 'activity' | 'research'
  | 'essay' | 'contest' | 'scholarship'

export type TaskPhase = 'now' | 'soon' | 'apply' | 'final'

export interface RoadmapTask {
  id: string
  title: string
  why: string
  category: TaskCategory
  phase: TaskPhase
  /** Ориентировочный период, помечается как демо-данные. */
  window: string
  effort: string
  source?: { label: string; url: string }
}

export interface RoadmapPhase {
  id: TaskPhase
  title: string
  subtitle: string
  tasks: RoadmapTask[]
}

/** Идея активности, которая усиливает заявку: эссе, волонтёрство, хакатон и т.д. */
export interface ActivityIdea {
  id: string
  kind: AchievementKind
  title: string
  why: string
  /** Пустой массив означает «подходит любому направлению». */
  fields: FieldId[]
  effort: string
  /** На каких этапах школы это имеет смысл начинать. */
  stages: Stage[]
  source?: { label: string; url: string }
}

/** Событие календаря поступления: период подачи, экзамен или дедлайн стипендии. */
export interface CalendarEntry {
  id: string
  title: string
  subtitle: string
  kind: 'program' | 'scholarship' | 'exam' | 'task'
  window: string
  /** Месяц начала, 1–12. Нужен для сортировки по времени. */
  month: number
  endMonth?: number
  /** Год, к которому относится период. */
  year: number
  source?: { label: string; url: string }
}
