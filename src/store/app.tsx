import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from 'react'
import type { Diagnosis, Profile, Recommendation, RoadmapPhase, RoadmapTask } from '../types'
import { recommend } from '../engine/match'
import { diagnose } from '../engine/diagnosis'
import { allTasks, buildRoadmap, nextAction } from '../engine/roadmap'
import { clear, load, save, type PersistedShape } from './storage'

export const EMPTY_PROFILE: Profile = {
  name: '',
  stage: 'grade11',
  fields: [],
  gpa: 4.2,
  strongSubjects: [],
  languages: ['ru'],
  english: 'b1',
  exams: { planned: [] },
  countries: [],
  relocation: true,
  budget: 'upto6k',
  intakeYear: new Date().getFullYear() + 1,
  priorities: [],
}

/** Готовый профиль для быстрого показа продукта жюри без заполнения анкеты. */
export const DEMO_PROFILE: Profile = {
  name: 'Аружан',
  stage: 'grade11',
  fields: ['it', 'science'],
  gpa: 4.6,
  strongSubjects: ['Математика', 'Информатика', 'Английский'],
  languages: ['kk', 'ru', 'en'],
  english: 'b2',
  exams: { ent: 112, ielts: undefined, sat: undefined, planned: ['ent', 'ielts'] },
  countries: ['KZ', 'TR', 'CZ'],
  relocation: true,
  budget: 'upto6k',
  intakeYear: new Date().getFullYear() + 1,
  priorities: ['cost', 'employability'],
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
  done: string[]
  saved: string[]
  compare: string[]
  changeNote: ChangeNote | null
  setProfile: (patch: Partial<Profile>, options?: { silent?: boolean }) => void
  completeSurvey: (profile: Profile) => void
  loadDemo: () => void
  toggleDone: (id: string) => void
  toggleSaved: (id: string) => void
  toggleCompare: (id: string) => void
  dismissChange: () => void
  reset: () => void
}

const Ctx = createContext<AppState | null>(null)

function readInitial(): { profile: Profile; completed: boolean; done: string[]; saved: string[]; compare: string[] } {
  const stored = load<PersistedShape>()
  if (!stored) return { profile: EMPTY_PROFILE, completed: false, done: [], saved: [], compare: [] }
  return {
    profile: { ...EMPTY_PROFILE, ...(stored.profile as Profile) },
    completed: Boolean(stored.completed),
    done: stored.done ?? [],
    saved: stored.saved ?? [],
    compare: stored.compare ?? [],
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

  appeared.forEach((r) => details.push(`Появилось в топе: ${r.program.universityShort} — ${r.program.program}`))
  gone.forEach((r) => details.push(`Ушло из топа: ${r.program.universityShort}`))

  if (appeared.length === 0 && gone.length === 0) {
    const beforeScore = before[0]?.score ?? 0
    const afterScore = after[0]?.score ?? 0
    const diff = afterScore - beforeScore
    if (Math.abs(diff) < 2) return null
    return {
      headline: 'Совпадение пересчитано',
      details: [
        `${after[0].program.universityShort}: ${beforeScore}% → ${afterScore}% совпадения`,
      ],
    }
  }

  return {
    headline: `Подбор обновился: ${appeared.length} ${appeared.length === 1 ? 'новый вариант' : 'новых варианта'} в топ-3`,
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
  const [changeNote, setChangeNote] = useState<ChangeNote | null>(null)
  const noteId = useRef(0)

  const recommendations = useMemo(() => recommend(profile), [profile])
  const diagnosis = useMemo(() => diagnose(profile, recommendations), [profile, recommendations])
  const roadmap = useMemo(() => buildRoadmap(profile, recommendations), [profile, recommendations])
  const tasks = useMemo(() => allTasks(roadmap), [roadmap])
  const next = useMemo(() => nextAction(roadmap, done), [roadmap, done])

  useEffect(() => {
    save({ profile, completed, done, saved: savedIds, compare })
  }, [profile, completed, done, savedIds, compare])

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
  }, [])

  const toggleDone = useCallback((id: string) => {
    setDone((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }, [])

  const toggleSaved = useCallback((id: string) => {
    setSavedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }, [])

  const toggleCompare = useCallback((id: string) => {
    setCompare((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 3) return [...prev.slice(1), id]
      return [...prev, id]
    })
  }, [])

  const dismissChange = useCallback(() => setChangeNote(null), [])

  const reset = useCallback(() => {
    clear()
    setProfileState(EMPTY_PROFILE)
    setCompleted(false)
    setDone([])
    setSavedIds([])
    setCompare([])
    setChangeNote(null)
  }, [])

  const value: AppState = {
    profile, completed, recommendations, diagnosis, roadmap, tasks, next,
    done, saved: savedIds, compare, changeNote,
    setProfile, completeSurvey, loadDemo, toggleDone, toggleSaved, toggleCompare,
    dismissChange, reset,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp(): AppState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp вызван вне AppProvider')
  return ctx
}
