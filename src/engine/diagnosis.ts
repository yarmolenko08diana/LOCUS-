import type { Diagnosis, Profile, Recommendation } from '../types'
import {
  BUDGET_LABEL, COUNTRY_LABEL, ENGLISH_RANK, FIELD_LABEL,
  FIELD_SUBJECTS, PRIORITY_LABEL, STAGE_LABEL, STAGE_YEARS_TO_APPLY,
} from '../data/taxonomy'
import { effectiveIelts } from './match'
import { effectiveGpa, gpaSourceLabel } from './academics'
import { summarizeAchievements } from './achievements'
import { greet, readinessPhrase } from './tone'
import { L } from '../i18n/lang'
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
  const gpa = effectiveGpa(profile)
  const gpaNote = gpaSourceLabel(profile)
  const ach = summarizeAchievements(profile)

  // Сильные стороны
  if (gpa >= 4.5) {
    strengths.push(
      L(
        `Высокий средний балл ${gpa.toFixed(1)}${gpaNote ? ` (${gpaNote})` : ''} — открывает конкурсные программы и гранты`,
        `Жоғары орташа бал ${gpa.toFixed(1)}${gpaNote ? ` (${gpaNote})` : ''} — конкурстық бағдарламалар мен гранттарға жол ашады`,
      ),
    )
  } else if (gpa >= 4.0) {
    strengths.push(
      L(
        `Ровная успеваемость ${gpa.toFixed(1)} — хватает для большинства вариантов в подборе`,
        `Тұрақты үлгерім ${gpa.toFixed(1)} — таңдаудағы нұсқалардың көбіне жетеді`,
      ),
    )
  }

  const ielts = effectiveIelts(profile)
  if (ielts >= 6.5) {
    strengths.push(
      L(
        `Английский на уровне около IELTS ${ielts.toFixed(1)} — доступны англоязычные программы`,
        `Ағылшын тілі шамамен IELTS ${ielts.toFixed(1)} деңгейінде — ағылшын тілді бағдарламалар қолжетімді`,
      ),
    )
  }
  if (profile.exams.ent !== undefined && profile.exams.ent >= 100) {
    strengths.push(
      L(
        `ЕНТ ${profile.exams.ent} — это уже зона грантов по многим специальностям`,
        `ҰБТ ${profile.exams.ent} — бұл көптеген мамандық бойынша грант аймағы`,
      ),
    )
  }
  if (ach.strength >= 0.45 && ach.top) {
    strengths.push(
      L(
        `Заметный внеучебный профиль: ${ach.highlights[0]} — это работает там, где заявку читают целиком`,
        `Айқын оқудан тыс профиль: ${ach.highlights[0]} — бұл өтінімді толық оқитын жерде жұмыс істейді`,
      ),
    )
  }
  const relevantSubjects = profile.strongSubjects.filter((s) =>
    profile.fields.some((f) => FIELD_SUBJECTS[f].includes(s)),
  )
  if (relevantSubjects.length > 0) {
    strengths.push(L(
      `Сильные профильные предметы: ${listOf(relevantSubjects)} — они прямо работают на выбранное направление`,
      `Күшті бейіндік пәндер: ${listOf(relevantSubjects)} — олар таңдалған бағытқа тікелей жұмыс істейді`,
    ))
  }
  if (years >= 1) {
    strengths.push(L(
      `До подачи ещё ${years === 1 ? 'год' : `${years} года`} — есть время закрыть экзамены без спешки`,
      `Өтінімге дейін ${years === 1 ? 'бір жыл' : `${years} жыл`} бар — емтихандарды асықпай жабуға уақыт жетеді`,
    ))
  }
  if (profile.relocation) {
    strengths.push(
      L(
        'Готовность к переезду заметно расширяет список доступных программ',
        'Көшуге дайындық қолжетімді бағдарламалар тізімін айтарлықтай кеңейтеді',
      ),
    )
  }
  if (strengths.length === 0) {
    strengths.push(
      L(
        'Профиль заполнен — уже можно строить маршрут и подтягивать слабые места по шагам',
        'Профиль толтырылған — маршрут құрып, әлсіз тұстарды қадаммен күшейтуге болады',
      ),
    )
  }

  // Ограничения
  if (profile.budget === 'grant-only') {
    constraints.push(
      L(
        'Платное обучение не рассматривается, поэтому маршрут строится вокруг грантов и стипендий',
        'Ақылы оқу қарастырылмайды, сондықтан маршрут гранттар мен шәкіртақылар айналасында құрылады',
      ),
    )
  } else {
    constraints.push(
      L(
        `Бюджет: ${BUDGET_LABEL[profile.budget].toLowerCase()} — это отсекает часть дорогих направлений`,
        `Бюджет: ${BUDGET_LABEL[profile.budget].toLowerCase()} — бұл қымбат бағыттардың бір бөлігін шектейді`,
      ),
    )
  }
  if (ENGLISH_RANK[profile.english] < 3) {
    constraints.push(
      L(
        'Английский ниже B2 закрывает часть англоязычных программ до сдачи языкового экзамена',
        'B2-ден төмен ағылшын тілі тіл емтиханын тапсырғанға дейін бірқатар бағдарламаны жабады',
      ),
    )
  }
  if (profile.exams.ent === undefined && profile.countries.includes('KZ')) {
    constraints.push(
      L(
        'Балл ЕНТ пока неизвестен, поэтому шансы на грант в Казахстане оценены ориентировочно',
        'ҰБТ балы әзірге белгісіз, сондықтан Қазақстандағы грант мүмкіндігі болжаммен бағаланды',
      ),
    )
  }
  if (!profile.relocation) {
    constraints.push(
      L(
        'Без переезда подбор ограничен программами внутри страны',
        'Көшусіз таңдау ел ішіндегі бағдарламалармен шектеледі',
      ),
    )
  }
  if (years === 0) {
    constraints.push(
      L(
        'Подача уже в этом цикле — сроки сжатые, начинать нужно с ближайшего дедлайна',
        'Өтінім осы циклде — мерзім тығыз, ең жақын мерзімнен бастау керек',
      ),
    )
  }
  if (gpa < 4.0) {
    constraints.push(
      L(
        `Средний балл ${gpa.toFixed(1)} ниже порогов самых конкурсных программ`,
        `Орташа бал ${gpa.toFixed(1)} ең конкурстық бағдарламалардың табалдырығынан төмен`,
      ),
    )
  }
  if (ach.count === 0) {
    constraints.push(
      L(
        'Достижений в анкете нет: там, где приём смотрит на всю заявку, это заметно снижает шансы',
        'Сауалнамада жетістік жоқ: өтінімді толық қарайтын жерде бұл мүмкіндікті айтарлықтай азайтады',
      ),
    )
  }

  // Цель
  const countryNames = profile.countries.map((c) => COUNTRY_LABEL[c])
  const goal = profile.fields.length
    ? L(
        `Поступить на бакалавриат по направлению ${listOf(fieldNames, 2)}${
          countryNames.length ? `, приоритет — ${listOf(countryNames, 3)}` : ''
        }, старт обучения в ${profile.intakeYear} году.`,
        `${listOf(fieldNames, 2)} бағыты бойынша бакалавриатқа түсу${
          countryNames.length ? `, басымдық — ${listOf(countryNames, 3)}` : ''
        }, оқу ${profile.intakeYear} жылы басталады.`,
      )
    : L(
        'Определиться с направлением и собрать первый рабочий список программ.',
        'Бағытты анықтап, бағдарламалардың алғашқы жұмыс тізімін жинау.',
      )

  // Готовность профиля
  const filled = [
    profile.fields.length > 0,
    profile.strongSubjects.length > 0,
    profile.countries.length > 0,
    profile.languages.length > 0,
    profile.priorities.length > 0,
    profile.exams.planned.length > 0,
    profile.exams.ent !== undefined || profile.exams.ielts !== undefined
      || profile.exams.sat !== undefined || profile.exams.toefl !== undefined
      || profile.exams.ib !== undefined || profile.exams.nis !== undefined,
    profile.english !== 'none',
    profile.achievements.length > 0,
  ]
  const readiness = Math.round((filled.filter(Boolean).length / filled.length) * 100)
  const readinessNote = readinessPhrase(readiness)

  const strong = recs.filter((r) => r.score >= 62).length
  const headline = profile.fields.length
    ? L(
        `${STAGE_LABEL[profile.stage]}, курс на ${listOf(fieldNames, 2)}`,
        `${STAGE_LABEL[profile.stage]}, бағыт — ${listOf(fieldNames, 2)}`,
      )
    : L('Профиль без выбранного направления', 'Бағыты таңдалмаған профиль')

  const summary =
    `${greet(profile.name)} ` +
    L(
      `Мы разобрали ${countOf(recs.length, 'программу', 'программы', 'программ')} из демо-базы, ` +
        `${strong} ${strong === 1 ? 'из них подходит' : 'из них подходят'} тебе по совокупности условий. `,
      `Демо-базадан ${recs.length} бағдарлама қаралды, олардың ${strong} шарттар жиынтығы бойынша саған келеді. `,
    ) +
    (profile.priorities.length
      ? L(
          `В подборе в первую очередь учитывались твои приоритеты: ${listOf(
            profile.priorities.map((p) => softLower(PRIORITY_LABEL[p])),
          )}.`,
          `Таңдауда ең алдымен басымдықтарың ескерілді: ${listOf(
            profile.priorities.map((p) => softLower(PRIORITY_LABEL[p])),
          )}.`,
        )
      : L(
          'Приоритеты не выбраны, поэтому варианты отсортированы по общему совпадению с профилем.',
          'Басымдықтар таңдалмаған, сондықтан нұсқалар профильмен жалпы сәйкестігі бойынша сұрыпталды.',
        ))

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
