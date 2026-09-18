export interface Step {
  id: string
  path: string
  label: string
  labelKk: string
  short: string
  shortKk: string
  what: string
  whatKk: string
}

/** Единая карта пути. Из неё строятся и шаг-рейл сверху, и нижняя навигация. */
export const STEPS: Step[] = [
  {
    id: 'survey', path: '/survey', label: 'Профиль', labelKk: 'Профиль',
    short: 'Профиль', shortKk: 'Профиль',
    what: 'короткая анкета о тебе', whatKk: 'сен туралы қысқа сауалнама',
  },
  {
    id: 'diagnosis', path: '/diagnosis', label: 'Диагностика', labelKk: 'Диагностика',
    short: 'Разбор', shortKk: 'Талдау',
    what: 'резюме сильных сторон и ограничений', whatKk: 'күшті жақтар мен шектеулер түйіні',
  },
  {
    id: 'matches', path: '/matches', label: 'Рекомендации', labelKk: 'Ұсыныстар',
    short: 'Подбор', shortKk: 'Таңдау',
    what: 'программы с объяснением «почему подходит»', whatKk: '«неге қолайлы» түсіндірмесі бар бағдарламалар',
  },
  {
    id: 'compare', path: '/compare', label: 'Сравнение', labelKk: 'Салыстыру',
    short: 'Сравнить', shortKk: 'Салыстыру',
    what: 'варианты рядом по важным параметрам', whatKk: 'нұсқаларды маңызды өлшемдер бойынша қатар қою',
  },
  {
    id: 'roadmap', path: '/roadmap', label: 'План', labelKk: 'Жоспар',
    short: 'План', shortKk: 'Жоспар',
    what: 'экзамены, документы и следующий шаг', whatKk: 'емтихандар, құжаттар және келесі қадам',
  },
]

export interface Extra {
  id: string
  path: string
  label: string
  labelKk: string
  emoji: string
}

/**
 * Дополнительные разделы. Они не входят в обязательные семь шагов маршрута,
 * поэтому живут отдельной строкой и не сбивают счётчик «где я сейчас».
 */
export const EXTRAS: Extra[] = [
  { id: 'scholarships', path: '/scholarships', label: 'Стипендии', labelKk: 'Шәкіртақылар', emoji: '💰' },
  { id: 'calendar', path: '/calendar', label: 'Календарь', labelKk: 'Күнтізбе', emoji: '🗓' },
  { id: 'activities', path: '/activities', label: 'Активности', labelKk: 'Белсенділік', emoji: '🚀' },
  { id: 'saved', path: '/saved', label: 'Избранное', labelKk: 'Таңдаулылар', emoji: '★' },
]

export function stepIndexForPath(pathname: string): number {
  const i = STEPS.findIndex((s) => pathname.startsWith(s.path))
  return i === -1 ? 0 : i
}
