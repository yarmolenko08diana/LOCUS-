import type { Lang, ThemeMode } from '../types'

const KEY = 'qadam.state.v2'

export interface PersistedShape {
  profile: unknown
  completed: boolean
  done: string[]
  saved: string[]
  compare: string[]
  lang?: Lang
  theme?: ThemeMode
  reminders?: string[]
}

export function load<T extends PersistedShape>(): T | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    // Приватный режим браузера или повреждённые данные: работаем без сохранения.
    return null
  }
}

export function save(state: PersistedShape): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Тихо игнорируем: потеря сохранения не должна ломать путь пользователя.
  }
}

export function clear(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* no-op */
  }
}
