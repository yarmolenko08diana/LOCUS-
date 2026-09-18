import type { CalendarEntry, Profile, Recommendation, ScholarshipMatch } from '../types'
import { COUNTRY_LABEL } from '../data/taxonomy'
import { L } from '../i18n/lang'

const MONTHS_RU = [
  'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь',
]

const MONTHS_KK = [
  'қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым',
  'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан',
]

/** Названия месяцев читаются при отрисовке, поэтому следуют за языком интерфейса. */
export function monthLabel(index: number): string {
  return L(MONTHS_RU[index], MONTHS_KK[index])
}

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
      subtitle: m.eligible
        ? L('подходит по анкете', 'сауалнама бойынша келеді')
        : L('есть незакрытые требования', 'жабылмаған талаптар бар'),
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
      title: L('ЕНТ', 'ҰБТ'),
      subtitle: L('основной и дополнительный потоки', 'негізгі және қосымша ағындар'),
      kind: 'exam',
      window: L('март и июнь', 'наурыз және маусым'),
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
      subtitle: L('сессии проходят почти каждый месяц', 'сессиялар дерлік ай сайын өтеді'),
      kind: 'exam',
      window: L('выбрать дату за 2–3 месяца', 'күнді 2–3 ай бұрын таңдау'),
      month: currentMonth,
      year: currentYear,
      source: { label: L('ielts.org — даты', 'ielts.org — күндер'), url: 'https://www.ielts.org/for-test-takers/book-a-test' },
    })
  }
  if (profile.exams.planned.includes('sat') && profile.exams.sat === undefined) {
    entries.push({
      id: 'exam-sat',
      title: 'SAT',
      subtitle: L('регистрация закрывается за месяц', 'тіркеу бір ай бұрын жабылады'),
      kind: 'exam',
      window: L('март, май, октябрь, декабрь', 'наурыз, мамыр, қазан, желтоқсан'),
      month: 3,
      endMonth: 12,
      year: yearFor(3, currentMonth, currentYear),
      source: { label: L('collegeboard.org — даты SAT', 'collegeboard.org — SAT күндері'), url: 'https://satsuite.collegeboard.org/sat/registration' },
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

  if (spansNow) return L('идёт сейчас', 'қазір жүріп жатыр')
  if (diff <= 0) return L('скоро', 'жақында')
  if (diff === 1) return L('через месяц', 'бір айдан кейін')
  if (diff < 5) return L(`через ${diff} месяца`, `${diff} айдан кейін`)
  return L(`через ${diff} месяцев`, `${diff} айдан кейін`)
}
