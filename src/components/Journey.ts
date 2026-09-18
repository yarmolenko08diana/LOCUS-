export interface Step {
  id: string
  path: string
  label: string
  short: string
  what: string
}

/** Единая карта пути. Из неё строятся и шаг-рейл сверху, и нижняя навигация. */
export const STEPS: Step[] = [
  { id: 'survey', path: '/survey', label: 'Профиль', short: 'Профиль', what: 'короткая анкета о тебе' },
  { id: 'diagnosis', path: '/diagnosis', label: 'Диагностика', short: 'Разбор', what: 'резюме сильных сторон и ограничений' },
  { id: 'matches', path: '/matches', label: 'Рекомендации', short: 'Подбор', what: 'программы с объяснением «почему подходит»' },
  { id: 'compare', path: '/compare', label: 'Сравнение', short: 'Сравнить', what: 'варианты рядом по важным параметрам' },
  { id: 'roadmap', path: '/roadmap', label: 'План', short: 'План', what: 'экзамены, документы и следующий шаг' },
]

export function stepIndexForPath(pathname: string): number {
  const i = STEPS.findIndex((s) => pathname.startsWith(s.path))
  return i === -1 ? 0 : i
}
