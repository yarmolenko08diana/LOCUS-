import type { CalendarEntry } from '../types'
import { L } from '../i18n/lang'

/**
 * Что показывать в колокольчике.
 *
 * Сервера у прототипа нет, поэтому push-уведомлений и писем быть не может.
 * Честная замена — считать оставшееся время прямо в браузере и подсвечивать
 * те периоды, которые уже идут или начнутся в ближайший месяц. Отмеченные
 * звёздочкой поднимаются выше: человек сам сказал, что они ему важны.
 */

export type AlertLevel = 'now' | 'soon' | 'later'

export interface DeadlineAlert {
  entry: CalendarEntry
  level: AlertLevel
  /** Сколько месяцев осталось до начала периода; 0 — период уже идёт. */
  monthsLeft: number
  /** Отмечен ли период звёздочкой в календаре. */
  starred: boolean
}

const LEVEL_ORDER: Record<AlertLevel, number> = { now: 0, soon: 1, later: 2 }

function levelOf(monthsLeft: number, spansNow: boolean): AlertLevel {
  if (spansNow || monthsLeft <= 0) return 'now'
  if (monthsLeft <= 1) return 'soon'
  return 'later'
}

/**
 * Периоды, о которых стоит напомнить, от самого срочного к дальнему.
 * Дальше четырёх месяцев не уведомляем: это уже не напоминание, а календарь.
 */
export function deadlineAlerts(
  calendar: CalendarEntry[],
  reminders: string[],
  now = new Date(),
): DeadlineAlert[] {
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  return calendar
    .map((entry) => {
      const monthsLeft = (entry.year - year) * 12 + (entry.month - month)
      const until = entry.endMonth ?? entry.month
      const spansNow =
        entry.year === year &&
        (until >= entry.month
          ? month >= entry.month && month <= until
          : month >= entry.month || month <= until)
      return {
        entry,
        level: levelOf(monthsLeft, spansNow),
        monthsLeft: Math.max(0, monthsLeft),
        starred: reminders.includes(entry.id),
      }
    })
    .filter((a) => a.level !== 'later' || a.starred || a.monthsLeft <= 4)
    .sort(
      (a, b) =>
        LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level] ||
        Number(b.starred) - Number(a.starred) ||
        a.monthsLeft - b.monthsLeft,
    )
}

/** Сколько из них требуют внимания прямо сейчас — это число горит красным. */
export function urgentCount(alerts: DeadlineAlert[]): number {
  return alerts.filter((a) => a.level === 'now' || a.level === 'soon').length
}

/** Человеческая подпись к срочности. */
export function alertLabel(alert: DeadlineAlert): string {
  if (alert.level === 'now') return L('идёт сейчас', 'қазір жүріп жатыр')
  if (alert.level === 'soon') return L('начинается в течение месяца', 'бір ай ішінде басталады')
  if (alert.monthsLeft < 5) return L(`через ${alert.monthsLeft} месяца`, `${alert.monthsLeft} айдан кейін`)
  return L(`через ${alert.monthsLeft} месяцев`, `${alert.monthsLeft} айдан кейін`)
}
