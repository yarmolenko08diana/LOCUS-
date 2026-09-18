import type { Diagnosis, Profile, Recommendation } from '../types'
import {
  BUDGET_LABEL, COUNTRY_LABEL, ENGLISH_RANK, FIELD_LABEL,
  FIELD_SUBJECTS, PRIORITY_LABEL, STAGE_LABEL, STAGE_YEARS_TO_APPLY,
} from '../data/taxonomy'
import { effectiveIelts } from './match'
import { countOf, listOf as joinList, softLower } from '../lib/text'

const listOf = joinList

/**
 * Краткое резюме профиля: что у пользователя сильного, что ограничивает выбор
 * и какая у него образовательная цель. Всё выводится из анкеты, поэтому
 * меняется сразу после правки любого ответа.
 */
export function diagnose(profile: Profile, recs: Recommendation[]): Diagnosis {
  const strengths: string[] = []
  const constraints: string[] = []

  const years = STAGE_YEARS_TO_APPLY[profile.stage]
  const fieldNames = profile.fields.map((f) => softLower(FIELD_LABEL[f]))

  // Сильные стороны
  if (profile.gpa >= 4.5) {
    strengths.push(`Высокий средний балл ${profile.gpa.toFixed(1)} — открывает конкурсные программы и гранты`)
  } else if (profile.gpa >= 4.0) {
    strengths.push(`Ровная успеваемость ${profile.gpa.toFixed(1)} — хватает для большинства вариантов в подборе`)
  }

  const ielts = effectiveIelts(profile)
  if (ielts >= 6.5) {
    strengths.push(`Английский на уровне около IELTS ${ielts.toFixed(1)} — доступны англоязычные программы`)
  }
  if (profile.exams.ent !== undefined && profile.exams.ent >= 100) {
    strengths.push(`ЕНТ ${profile.exams.ent} — это уже зона грантов по многим специальностям`)
  }
  const relevantSubjects = profile.strongSubjects.filter((s) =>
    profile.fields.some((f) => FIELD_SUBJECTS[f].includes(s)),
  )
  if (relevantSubjects.length > 0) {
    strengths.push(`Сильные профильные предметы: ${listOf(relevantSubjects)} — они прямо работают на выбранное направление`)
  }
  if (years >= 1) {
    strengths.push(`До подачи ещё ${years === 1 ? 'год' : `${years} года`} — есть время закрыть экзамены без спешки`)
  }
  if (profile.relocation) {
    strengths.push('Готовность к переезду заметно расширяет список доступных программ')
  }
  if (strengths.length === 0) {
    strengths.push('Профиль заполнен — уже можно строить маршрут и подтягивать слабые места по шагам')
  }

  // Ограничения
  if (profile.budget === 'grant-only') {
    constraints.push('Платное обучение не рассматривается, поэтому маршрут строится вокруг грантов и стипендий')
  } else {
    constraints.push(`Бюджет: ${BUDGET_LABEL[profile.budget].toLowerCase()} — это отсекает часть дорогих направлений`)
  }
  if (ENGLISH_RANK[profile.english] < 3) {
    constraints.push('Английский ниже B2 закрывает часть англоязычных программ до сдачи языкового экзамена')
  }
  if (profile.exams.ent === undefined && profile.countries.includes('KZ')) {
    constraints.push('Балл ЕНТ пока неизвестен, поэтому шансы на грант в Казахстане оценены ориентировочно')
  }
  if (!profile.relocation) {
    constraints.push('Без переезда подбор ограничен программами внутри страны')
  }
  if (years === 0) {
    constraints.push('Подача уже в этом цикле — сроки сжатые, начинать нужно с ближайшего дедлайна')
  }
  if (profile.gpa < 4.0) {
    constraints.push(`Средний балл ${profile.gpa.toFixed(1)} ниже порогов самых конкурсных программ`)
  }

  // Цель
  const countryNames = profile.countries.map((c) => COUNTRY_LABEL[c])
  const goal = profile.fields.length
    ? `Поступить на бакалавриат по направлению ${listOf(fieldNames, 2)}${
        countryNames.length ? `, приоритет — ${listOf(countryNames, 3)}` : ''
      }, старт обучения в ${profile.intakeYear} году.`
    : 'Определиться с направлением и собрать первый рабочий список программ.'

  // Готовность профиля
  const filled = [
    profile.fields.length > 0,
    profile.strongSubjects.length > 0,
    profile.countries.length > 0,
    profile.languages.length > 0,
    profile.priorities.length > 0,
    profile.exams.planned.length > 0,
    profile.exams.ent !== undefined || profile.exams.ielts !== undefined || profile.exams.sat !== undefined,
    profile.english !== 'none',
  ]
  const readiness = Math.round((filled.filter(Boolean).length / filled.length) * 100)
  const readinessNote =
    readiness >= 85
      ? 'Профиль подробный: рекомендации построены на полном наборе данных.'
      : readiness >= 60
        ? 'Профиль заполнен достаточно. Добавь баллы экзаменов, и оценка шансов станет точнее.'
        : 'Данных мало: рекомендации пока грубые. Вернись в анкету и уточни экзамены и предметы.'

  const strong = recs.filter((r) => r.score >= 62).length
  const headline = profile.fields.length
    ? `${STAGE_LABEL[profile.stage]}, курс на ${listOf(fieldNames, 2)}`
    : 'Профиль без выбранного направления'

  const summary =
    `Мы разобрали ${countOf(recs.length, 'программу', 'программы', 'программ')} из демо-базы, ` +
    `${strong} ${strong === 1 ? 'из них подходит' : 'из них подходят'} тебе по совокупности условий. ` +
    (profile.priorities.length
      ? `В подборе в первую очередь учитывались твои приоритеты: ${listOf(
          profile.priorities.map((p) => softLower(PRIORITY_LABEL[p])),
        )}.`
      : 'Приоритеты не выбраны, поэтому варианты отсортированы по общему совпадению с профилем.')

  return {
    headline,
    summary,
    strengths: strengths.slice(0, 4),
    constraints: constraints.slice(0, 4),
    goal,
    readiness,
    readinessNote,
  }
}
