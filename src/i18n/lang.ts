import type { Lang } from '../types'

/**
 * Язык, на котором движок генерирует объяснения.
 *
 * Тексты рекомендаций собираются из шаблонов со вставками, поэтому словарь по
 * ключам здесь не подходит: удобнее держать обе формулировки рядом. Значение
 * выставляется провайдером до пересчёта подбора, а сам пересчёт зависит от
 * языка через зависимости useMemo — так текст всегда соответствует интерфейсу.
 */
let current: Lang = 'ru'

export function setEngineLang(lang: Lang): void {
  current = lang
}

export function engineLang(): Lang {
  return current
}

/** Выбор формулировки по текущему языку движка. */
export function L(ru: string, kk: string): string {
  return current === 'kk' ? kk : ru
}
