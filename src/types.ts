/**
 * Доменная модель Qadam.
 * Всё, что показывается пользователю, выводится из Profile — поэтому изменение
 * любого ответа в анкете автоматически меняет диагностику, рекомендации и roadmap.
 */

export type CountryCode =
  | 'KZ' | 'RU' | 'TR' | 'CZ' | 'PL' | 'HU' | 'DE' | 'NL' | 'IT'
  | 'GB' | 'US' | 'AE' | 'CN' | 'KR' | 'MY'

export type FieldId =
  | 'it' | 'engineering' | 'medicine' | 'business' | 'economics'
  | 'design' | 'law' | 'social' | 'science' | 'media' | 'education' | 'agro'

export type LanguageCode = 'kk' | 'ru' | 'en' | 'tr' | 'de'

export type EnglishLevel = 'none' | 'a2' | 'b1' | 'b2' | 'c1'

export type Stage = 'grade9' | 'grade10' | 'grade11' | 'graduate'

export type BudgetTier = 'grant-only' | 'upto2k' | 'upto6k' | 'upto15k' | 'above15k'

export type Priority = 'cost' | 'prestige' | 'employability' | 'closeToHome' | 'community'

/** Экзамены, которые пользователь уже сдал или планирует сдавать. */
export interface ExamState {
  /** Единое национальное тестирование, 0–140. */
  ent?: number
  /** IELTS Academic, 4.0–9.0. */
  ielts?: number
  /** SAT, 400–1600. */
  sat?: number
  /** Экзамены, которые пользователь готов сдать, даже если баллов пока нет. */
  planned: ExamId[]
}

export type ExamId = 'ent' | 'ielts' | 'sat' | 'toefl' | 'localExam' | 'portfolio'

export interface Profile {
  /** Имя нужно только для тона общения, никуда не отправляется. */
  name: string
  stage: Stage
  fields: FieldId[]
  /** Средний балл по 5-балльной шкале, 3.0–5.0. */
  gpa: number
  strongSubjects: string[]
  languages: LanguageCode[]
  english: EnglishLevel
  exams: ExamState
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
  sat?: number
  gpa?: number
  portfolio?: boolean
  entranceExam?: string
}

export interface DeadlineHint {
  label: string
  /** Ориентировочный период, а не подтверждённая дата: демо-данные. */
  window: string
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
  source: { label: string; url: string }
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
}

export interface ScoreBreakdown {
  field: number
  admission: number
  budget: number
  geo: number
  language: number
  priority: number
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

export type TaskCategory = 'exam' | 'document' | 'academic' | 'activity' | 'research'

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
