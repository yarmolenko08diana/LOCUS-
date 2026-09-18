import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from 'react'
import type {
  Achievement, CalendarEntry, Diagnosis, Lang, Profile, Recommendation,
  RoadmapPhase, RoadmapTask, ScholarshipMatch, ThemeMode,
} from '../types'
import { recommend } from '../engine/match'
import { diagnose } from '../engine/diagnosis'
import { allTasks, buildRoadmap, nextAction } from '../engine/roadmap'
import { matchScholarships } from '../engine/scholarships'
import { buildCalendar } from '../engine/calendar'
import { suggestActivities, type ActivitySuggestion } from '../engine/activities'
import { summarizeAchievements, type AchievementSummary } from '../engine/achievements'
import { L, setEngineLang } from '../i18n/lang'
import { LangProvider } from '../i18n/LangContext'
import { clear, load, save, type PersistedShape } from './storage'

export const EMPTY_PROFILE: Profile = {
  name: '',
  stage: 'grade11',
  fields: [],
  schoolSystem: 'kz',
  gpa: 4.2,
  strongSubjects: [],
  languages: ['ru'],
  english: 'b1',
  exams: { planned: [] },
  achievements: [],
  countries: [],
  relocation: true,
  budget: 'upto6k',
  intakeYear: new Date().getFullYear() + 1,
  priorities: [],
  tone: 'friendly',
}

/** Готовый профиль для быстрого показа продукта жюри без заполнения анкеты. */
export const DEMO_PROFILE: Profile = {
  name: 'Аружан',
  stage: 'grade11',
  fields: ['it', 'science'],
  schoolSystem: 'nis',
  gpa: 4.6,
  strongSubjects: ['Математика', 'Информатика', 'Английский'],
  languages: ['kk', 'ru', 'en'],
  english: 'b2',
  exams: { ent: 112, nis: 88, planned: ['ent', 'ielts'] },
  achievements: [
    {
      id: 'demo-1',
      kind: 'olympiad',
      level: 'national',
      award: 'silver',
      title: 'Республиканская олимпиада по информатике',
      year: new Date().getFullYear(),
    },
    {
      id: 'demo-2',
      kind: 'hackathon',
      level: 'city',
      award: 'gold',
      title: 'Городской хакатон по анализу данных',
      year: new Date().getFullYear(),
    },
    {
      id: 'demo-3',
      kind: 'volunteer',
      level: 'school',
      award: 'participant',
      title: 'Кружок программирования для младших классов',
      year: new Date().getFullYear() - 1,
      hours: 60,
    },
  ],
  countries: ['KZ', 'TR', 'CZ'],
  relocation: true,
  budget: 'upto6k',
  intakeYear: new Date().getFullYear() + 1,
  priorities: ['cost', 'employability'],
  tone: 'friendly',
}

export interface ChangeNote {
  id: number
  headline: string
  details: string[]
}

interface AppState {
  profile: Profile
  completed: boolean
  recommendations: Recommendation[]
  diagnosis: Diagnosis
  roadmap: RoadmapPhase[]
  tasks: RoadmapTask[]
  next: RoadmapTask | null
  scholarships: ScholarshipMatch[]
  calendar: CalendarEntry[]
  activities: ActivitySuggestion[]
  achievements: AchievementSummary
  done: string[]
  saved: string[]
  compare: string[]
  reminders: string[]
  lang: Lang
  theme: ThemeMode
  changeNote: ChangeNote | null
  setProfile: (patch: Partial<Profile>, options?: { silent?: boolean }) => void
  addAchievement: (value: Omit<Achievement, 'id'>) => void
  removeAchievement: (id: string) => void
  completeSurvey: (profile: Profile) => void
  loadDemo: () => void
  toggleDone: (id: string) => void
  toggleSaved: (id: string) => void
  toggleCompare: (id: string) => void
  toggleReminder: (id: string) => void
  setLang: (lang: Lang) => void
  setTheme: (theme: ThemeMode) => void
  dismissChange: () => void
  reset: () => void
}

const Ctx = createContext<AppState | null>(null)

interface Initial {
  profile: Profile
  completed: boolean
  done: string[]
  saved: string[]
  compare: string[]
  reminders: string[]
  lang: Lang
  theme: ThemeMode
}

function readInitial(): Initial {
  const stored = load<PersistedShape>()
  const base: Initial = {
    profile: EMPTY_PROFILE,
    completed: false,
    done: [],
    saved: [],
    compare: [],
    reminders: [],
    lang: 'ru',
    theme: 'system',
  }
  if (!stored) return base
  return {
    // Слияние с EMPTY_PROFILE: сохранённая анкета из более старой версии
    // не должна ронять приложение из-за новых полей.
    profile: { ...EMPTY_PROFILE, ...(stored.profile as Profile) },
    completed: Boolean(stored.completed),
    done: stored.done ?? [],
    saved: stored.saved ?? [],
    compare: stored.compare ?? [],
    reminders: stored.reminders ?? [],
    lang: stored.lang ?? 'ru',
    theme: stored.theme ?? 'system',
  }
}

/** Человеческое описание того, что поменялось в подборе после правки анкеты. */
function describeChange(
  before: Recommendation[],
  after: Recommendation[],
): { headline: string; details: string[] } | null {
  const beforeTop = before.slice(0, 3).map((r) => r.program.id)
  const afterTop = after.slice(0, 3).map((r) => r.program.id)
  const appeared = after.slice(0, 3).filter((r) => !beforeTop.includes(r.program.id))
  const gone = before.slice(0, 3).filter((r) => !afterTop.includes(r.program.id))
  const details: string[] = []

  appeared.forEach((r) => details.push(L(
    `Появилось в топе: ${r.program.universityShort} — ${r.program.program}`,
    `Топқа қосылды: ${r.program.universityShort} — ${r.program.program}`,
  )))
  gone.forEach((r) => details.push(L(
    `Ушло из топа: ${r.program.universityShort}`,
    `Топтан шықты: ${r.program.universityShort}`,
  )))

  if (appeared.length === 0 && gone.length === 0) {
    const beforeScore = before[0]?.score ?? 0
    const afterScore = after[0]?.score ?? 0
    const diff = afterScore - beforeScore
    if (Math.abs(diff) < 2) return null
    return {
      headline: L('Совпадение пересчитано', 'Сәйкестік қайта есептелді'),
      details: [
        L(
          `${after[0].program.universityShort}: ${beforeScore}% → ${afterScore}% совпадения`,
          `${after[0].program.universityShort}: сәйкестік ${beforeScore}% → ${afterScore}%`,
        ),
      ],
    }
  }

  return {
    headline: L(
      `Подбор обновился: ${appeared.length} ${appeared.length === 1 ? 'новый вариант' : 'новых варианта'} в топ-3`,
      `Таңдау жаңарды: топ-3-те ${appeared.length} жаңа нұсқа`,
    ),
    details: details.slice(0, 4),
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  // Ленивая инициализация: localStorage читается один раз при монтировании.
  const [profile, setProfileState] = useState<Profile>(() => readInitial().profile)
  const [completed, setCompleted] = useState(() => readInitial().completed)
  const [done, setDone] = useState<string[]>(() => readInitial().done)
  const [savedIds, setSavedIds] = useState<string[]>(() => readInitial().saved)
  const [compare, setCompare] = useState<string[]>(() => readInitial().compare)
  const [reminders, setReminders] = useState<string[]>(() => readInitial().reminders)
  const [lang, setLangState] = useState<Lang>(() => readInitial().lang)
  const [theme, setThemeState] = useState<ThemeMode>(() => readInitial().theme)
  const [changeNote, setChangeNote] = useState<ChangeNote | null>(null)
  const noteId = useRef(0)

  // Движок берёт язык отсюда; пересчёт ниже зависит от lang, поэтому тексты
  // рекомендаций всегда совпадают с языком интерфейса.
  setEngineLang(lang)

  /*
   * lang в зависимостях намеренно: движок читает язык из модуля i18n/lang, а не
   * из аргументов, поэтому линтер не видит этой связи. Без lang переключение
   * языка не пересчитало бы тексты рекомендаций, плана и стипендий.
   */
  /* eslint-disable react-hooks/exhaustive-deps */
  const recommendations = useMemo(() => recommend(profile), [profile, lang])
  const diagnosis = useMemo(() => diagnose(profile, recommendations), [profile, recommendations, lang])
  const roadmap = useMemo(() => buildRoadmap(profile, recommendations), [profile, recommendations, lang])
  const tasks = useMemo(() => allTasks(roadmap), [roadmap])
  const next = useMemo(() => nextAction(roadmap, done), [roadmap, done])
  const scholarships = useMemo(() => matchScholarships(profile), [profile, lang])
  /* eslint-enable react-hooks/exhaustive-deps */
  const calendar = useMemo(
    () => buildCalendar(profile, recommendations, scholarships),
    [profile, recommendations, scholarships],
  )
  const activities = useMemo(() => suggestActivities(profile), [profile])
  const achievements = useMemo(() => summarizeAchievements(profile), [profile])

  useEffect(() => {
    save({ profile, completed, done, saved: savedIds, compare, reminders, lang, theme })
  }, [profile, completed, done, savedIds, compare, reminders, lang, theme])

  // Тема применяется к <html>, чтобы CSS-переменные переключились разом.
  useEffect(() => {
    const root = document.documentElement
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches)
      root.classList.toggle('dark', dark)
      root.style.colorScheme = dark ? 'dark' : 'light'
    }
    apply()
    if (theme !== 'system') return
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setProfile = useCallback(
    (patch: Partial<Profile>, options?: { silent?: boolean }) => {
      setProfileState((prev) => {
        const nextProfile = { ...prev, ...patch }
        if (!options?.silent && completed) {
          const change = describeChange(recommend(prev), recommend(nextProfile))
          if (change) {
            noteId.current += 1
            setChangeNote({ id: noteId.current, ...change })
          }
        }
        return nextProfile
      })
    },
    [completed],
  )

  const addAchievement = useCallback(
    (value: Omit<Achievement, 'id'>) => {
      const item: Achievement = { ...value, id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }
      setProfile({ achievements: [...profile.achievements, item] })
    },
    [profile.achievements, setProfile],
  )

  const removeAchievement = useCallback(
    (id: string) => {
      setProfile({ achievements: profile.achievements.filter((a) => a.id !== id) })
    },
    [profile.achievements, setProfile],
  )

  const completeSurvey = useCallback((value: Profile) => {
    setProfileState(value)
    setCompleted(true)
  }, [])

  const loadDemo = useCallback(() => {
    setProfileState(DEMO_PROFILE)
    setCompleted(true)
    setDone([])
    setCompare([])
    setSavedIds([])
    setReminders([])
  }, [])

  const toggleDone = useCallback((id: string) => {
    setDone((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }, [])

  const toggleSaved = useCallback((id: string) => {
    setSavedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }, [])

  const toggleReminder = useCallback((id: string) => {
    setReminders((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }, [])

  const toggleCompare = useCallback((id: string) => {
    setCompare((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 3) return [...prev.slice(1), id]
      return [...prev, id]
    })
  }, [])

  const setLang = useCallback((value: Lang) => setLangState(value), [])
  const setTheme = useCallback((value: ThemeMode) => setThemeState(value), [])

  const dismissChange = useCallback(() => setChangeNote(null), [])

  const reset = useCallback(() => {
    clear()
    setProfileState(EMPTY_PROFILE)
    setCompleted(false)
    setDone([])
    setSavedIds([])
    setCompare([])
    setReminders([])
    setChangeNote(null)
  }, [])

  const value: AppState = {
    profile, completed, recommendations, diagnosis, roadmap, tasks, next,
    scholarships, calendar, activities, achievements,
    done, saved: savedIds, compare, reminders, lang, theme, changeNote,
    setProfile, addAchievement, removeAchievement, completeSurvey, loadDemo,
    toggleDone, toggleSaved, toggleCompare, toggleReminder, setLang, setTheme,
    dismissChange, reset,
  }

  return (
    <Ctx.Provider value={value}>
      <LangProvider lang={lang}>{children}</LangProvider>
    </Ctx.Provider>
  )
}

export function useApp(): AppState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp вызван вне AppProvider')
  return ctx
}
