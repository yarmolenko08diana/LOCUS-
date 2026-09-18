import type { CalendarEntry, Profile, Recommendation, ScholarshipMatch } from '../types'
import { COUNTRY_LABEL } from '../data/taxonomy'

const MONTHS = [
  'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь',
]

export const MONTH_LABEL = MONTHS

/**
 * Календарь собирается из периодов подачи выбранных программ и стипендий.
 *
 * Периоды намеренно остаются периодами: точных дат в демо-наборе нет, и
 * показывать их было бы выдумкой. Каждая запись ведёт на официальную страницу,
 * где дату нужно сверить.
 */
export function buildCalendar(
  profile: Profile,
  recs: Recommendation[],
  scholarships: ScholarshipMatch[],
  now = new Date(),
): CalendarEntry[] {
  const entries: CalendarEntry[] = []
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  recs.slice(0, 6).forEach((r) => {
    r.program.deadlines.forEach((d, i) => {
      if (d.startMonth === undefined) return
      entries.push({
        id: `prog-${r.program.id}-${i}`,
        title: d.label,
        subtitle: `${r.program.universityShort} · ${COUNTRY_LABEL[r.program.country]}`,
        kind: 'program',
        window: d.window,
        month: d.startMonth,
        endMonth: d.endMonth,
        year: yearFor(d.startMonth, currentMonth, currentYear),
        source: r.program.source,
      })
    })
  })

  scholarships.slice(0, 6).forEach((m) => {
    if (m.scholarship.startMonth === undefined) return
    entries.push({
      id: `sch-${m.scholarship.id}`,
      title: m.scholarship.name,
      subtitle: m.eligible ? 'подходит по анкете' : 'есть незакрытые требования',
      kind: 'scholarship',
      window: m.scholarship.window,
      month: m.scholarship.startMonth,
      endMonth: m.scholarship.endMonth,
      year: yearFor(m.scholarship.startMonth, currentMonth, currentYear),
      source: m.scholarship.source,
    })
  })

  // Экзамены, которые человек уже запланировал
  if (profile.exams.planned.includes('ent')) {
    entries.push({
      id: 'exam-ent',
      title: 'ЕНТ',
      subtitle: 'основной и дополнительный потоки',
      kind: 'exam',
      window: 'март и июнь',
      month: 3,
      endMonth: 6,
      year: yearFor(3, currentMonth, currentYear),
      source: { label: 'testcenter.kz', url: 'https://testcenter.kz' },
    })
  }
  if (profile.exams.planned.includes('ielts') && profile.exams.ielts === undefined) {
    entries.push({
      id: 'exam-ielts',
      title: 'IELTS',
      subtitle: 'сессии проходят почти каждый месяц',
      kind: 'exam',
      window: 'выбрать дату за 2–3 месяца',
      month: currentMonth,
      year: currentYear,
      source: { label: 'ielts.org — даты', url: 'https://www.ielts.org/for-test-takers/book-a-test' },
    })
  }
  if (profile.exams.planned.includes('sat') && profile.exams.sat === undefined) {
    entries.push({
      id: 'exam-sat',
      title: 'SAT',
      subtitle: 'регистрация закрывается за месяц',
      kind: 'exam',
      window: 'март, май, октябрь, декабрь',
      month: 3,
      endMonth: 12,
      year: yearFor(3, currentMonth, currentYear),
      source: { label: 'collegeboard.org — даты SAT', url: 'https://satsuite.collegeboard.org/sat/registration' },
    })
  }

  return dedupe(entries).sort((a, b) => a.year - b.year || a.month - b.month)
}

/** Период, который уже прошёл в этом году, относится к следующему циклу подачи. */
function yearFor(month: number, currentMonth: number, currentYear: number): number {
  return month >= currentMonth ? currentYear : currentYear + 1
}

function dedupe(entries: CalendarEntry[]): CalendarEntry[] {
  const seen = new Set<string>()
  return entries.filter((e) => {
    const key = `${e.title}|${e.subtitle}|${e.month}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/** «через 2 месяца» или «идёт сейчас» — человеческая подпись к периоду. */
export function whenLabel(entry: CalendarEntry, now = new Date()): string {
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const diff = (entry.year - currentYear) * 12 + (entry.month - currentMonth)
  const until = entry.endMonth ?? entry.month
  const spansNow =
    entry.year === currentYear &&
    (until >= entry.month
      ? currentMonth >= entry.month && currentMonth <= until
      : currentMonth >= entry.month || currentMonth <= until)

  if (spansNow) return 'идёт сейчас'
  if (diff <= 0) return 'скоро'
  if (diff === 1) return 'через месяц'
  if (diff < 5) return `через ${diff} месяца`
  return `через ${diff} месяцев`
}
