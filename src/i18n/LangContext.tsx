import { createContext, useContext, type ReactNode } from 'react'
import type { Lang } from '../types'

export interface LangValue {
  lang: Lang
  /** Выбор формулировки: L('Подбор', 'Таңдау'). */
  L: (ru: string, kk: string) => string
}

const Ctx = createContext<LangValue>({ lang: 'ru', L: (ru) => ru })

export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const value: LangValue = { lang, L: (ru, kk) => (lang === 'kk' ? kk : ru) }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/** Хук для компонентов: const L = useL(). */
export function useL(): (ru: string, kk: string) => string {
  return useContext(Ctx).L
}

export function useLang(): Lang {
  return useContext(Ctx).lang
}
