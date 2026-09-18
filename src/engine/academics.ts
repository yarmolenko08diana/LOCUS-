import type { Profile } from '../types'
import { L } from '../i18n/lang'

/**
 * Приведение успеваемости к единой 5-балльной шкале.
 *
 * НИШ и IB считают оценки по-своему, а требования вузов в демо-наборе записаны
 * в привычной казахстанской шкале. Чтобы сравнение было честным, балл ученика
 * НИШ или IB пересчитывается сюда, а не сравнивается напрямую.
 *
 * Пересчёт ориентировочный: он нужен для прототипа, а не для официального
 * признания оценок. Вузы делают собственную конвертацию.
 */
export function effectiveGpa(profile: Profile): number {
  if (profile.schoolSystem === 'nis' && profile.exams.nis !== undefined) {
    // 50 баллов НИШ ≈ 3.0, 100 баллов ≈ 5.0
    return clamp(3 + ((profile.exams.nis - 50) / 50) * 2, 3, 5)
  }
  if (profile.schoolSystem === 'ib' && profile.exams.ib !== undefined) {
    // Диплом IB засчитывается от 24 баллов; 45 — максимум
    return clamp(3 + ((profile.exams.ib - 24) / 21) * 2, 3, 5)
  }
  return profile.gpa
}

/** Как называется шкала, в которой пользователь указал успеваемость. */
export function gpaSourceLabel(profile: Profile): string | null {
  if (profile.schoolSystem === 'nis' && profile.exams.nis !== undefined) {
    return L(`итоговый балл НИШ ${profile.exams.nis} из 100`, `НИШ қорытынды балы 100-ден ${profile.exams.nis}`)
  }
  if (profile.schoolSystem === 'ib' && profile.exams.ib !== undefined) {
    return L(`диплом IB ${profile.exams.ib} из 45`, `IB дипломы 45-тен ${profile.exams.ib}`)
  }
  return null
}

/**
 * Ориентировочное соответствие TOEFL iBT и IELTS Academic.
 * Нужно, чтобы сданный TOEFL не терялся там, где вуз указал порог по IELTS.
 */
export function toeflToIelts(toefl: number): number {
  if (toefl >= 110) return 8.0
  if (toefl >= 102) return 7.5
  if (toefl >= 94) return 7.0
  if (toefl >= 79) return 6.5
  if (toefl >= 60) return 6.0
  if (toefl >= 46) return 5.5
  return 5.0
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}
