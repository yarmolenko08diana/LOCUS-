import type { Profile, Reason, Scholarship, ScholarshipMatch } from '../types'
import { SCHOLARSHIPS } from '../data/scholarships'
import { COUNTRY_LABEL, FIELD_LABEL } from '../data/taxonomy'
import { effectiveGpa } from './academics'
import { summarizeAchievements, type AchievementSummary } from './achievements'
import { effectiveIelts } from './match'
import { listOf, softLower } from '../lib/text'
import { L } from '../i18n/lang'

/**
 * Подбор стипендий устроен проще, чем подбор программ: это не рейтинг вузов,
 * а ответ на вопрос «чем из этого я могу воспользоваться и чего мне не хватает».
 * Поэтому у каждой стипендии считается и балл соответствия, и список пробелов.
 */
function scoreScholarship(
  profile: Profile,
  s: Scholarship,
  ach: AchievementSummary,
): ScholarshipMatch {
  const reasons: Reason[] = []
  const gaps: string[] = []
  let score = 0

  // География: стипендия имеет смысл, только если страна человеку интересна.
  const countryHit = s.countries.filter((c) => profile.countries.includes(c))
  if (countryHit.length > 0) {
    score += 34
    reasons.push({
      tone: 'good',
      tag: L('Страна', 'Ел'),
      text: L(
        `Работает в выбранных тобой странах: ${listOf(countryHit.map((c) => COUNTRY_LABEL[c]))}.`,
        `Сен таңдаған елдерде жұмыс істейді: ${listOf(countryHit.map((c) => COUNTRY_LABEL[c]))}.`,
      ),
    })
  } else if (profile.relocation) {
    score += 14
    reasons.push({
      tone: 'neutral',
      tag: L('Страна', 'Ел'),
      text: L(
        `Этих стран не было в твоём списке, но в анкете отмечена готовность к переезду: ${listOf(s.countries.slice(0, 4).map((c) => COUNTRY_LABEL[c]))}.`,
        `Бұл елдер тізіміңде болмады, бірақ сауалнамада көшуге дайын екенің белгіленген: ${listOf(s.countries.slice(0, 4).map((c) => COUNTRY_LABEL[c]))}.`,
      ),
    })
  } else {
    gaps.push(L(
      'Стипендия не покрывает страны из твоего списка, а переезд в анкете выключен',
      'Шәкіртақы тізіміңдегі елдерді қамтымайды, ал сауалнамада көшу өшірілген',
    ))
  }

  // Направление
  if (s.fields.length === 0) {
    score += 14
  } else if (s.fields.some((f) => profile.fields.includes(f))) {
    score += 18
    reasons.push({
      tone: 'good',
      tag: L('Направление', 'Бағыт'),
      text: L(
        `Рассчитана как раз на твои интересы: ${listOf(s.fields.filter((f) => profile.fields.includes(f)).map((f) => softLower(FIELD_LABEL[f])))}.`,
        `Дәл сенің қызығушылықтарыңа арналған: ${listOf(s.fields.filter((f) => profile.fields.includes(f)).map((f) => softLower(FIELD_LABEL[f])))}.`,
      ),
    })
  } else {
    gaps.push(L(
      `Направления не совпадают: стипендия для ${listOf(s.fields.map((f) => softLower(FIELD_LABEL[f])))}`,
      `Бағыттар сәйкес келмейді: шәкіртақы ${listOf(s.fields.map((f) => softLower(FIELD_LABEL[f])))} үшін`,
    ))
  }

  // Этап обучения
  if (s.stages.includes(profile.stage)) {
    score += 12
  } else {
    gaps.push(L(
      'На твоём этапе обучения подать на эту стипендию ещё нельзя',
      'Оқу кезеңіңде бұл шәкіртақыға әлі өтінім беруге болмайды',
    ))
  }

  // Успеваемость
  const gpa = effectiveGpa(profile)
  if (s.requirements.gpa !== undefined) {
    if (gpa >= s.requirements.gpa) {
      score += 14
      reasons.push({
        tone: 'good',
        tag: L('Успеваемость', 'Үлгерім'),
        text: L(
          `Твой балл ${gpa.toFixed(1)} закрывает ориентир ${s.requirements.gpa.toFixed(1)}.`,
          `Балың ${gpa.toFixed(1)} — бағдар ${s.requirements.gpa.toFixed(1)} жабылды.`,
        ),
      })
    } else {
      score += 4
      gaps.push(L(
        `Средний балл: твой ${gpa.toFixed(1)}, ориентир ${s.requirements.gpa.toFixed(1)}`,
        `Орташа балл: сенікі ${gpa.toFixed(1)}, бағдар ${s.requirements.gpa.toFixed(1)}`,
      ))
    }
  } else {
    score += 8
  }

  // Английский
  if (s.requirements.ielts !== undefined) {
    const ielts = effectiveIelts(profile)
    if (ielts >= s.requirements.ielts) {
      score += 10
    } else {
      score += 3
      gaps.push(L(
        `Английский: ориентир IELTS ${s.requirements.ielts}, оценка твоего уровня — ${ielts.toFixed(1)}`,
        `Ағылшын тілі: бағдар IELTS ${s.requirements.ielts}, сенің деңгейің шамамен ${ielts.toFixed(1)}`,
      ))
    }
  } else {
    score += 6
  }

  // ЕНТ
  if (s.requirements.ent !== undefined) {
    if (profile.exams.ent !== undefined && profile.exams.ent >= s.requirements.ent) {
      score += 12
      reasons.push({
        tone: 'good',
        tag: L('ЕНТ', 'ҰБТ'),
        text: L(
          `${profile.exams.ent} баллов при ориентире ${s.requirements.ent}.`,
          `Бағдар ${s.requirements.ent} кезінде ${profile.exams.ent} балл.`,
        ),
      })
    } else if (profile.exams.planned.includes('ent')) {
      score += 7
      gaps.push(L(
        `ЕНТ ещё не сдан, ориентир ${s.requirements.ent} баллов`,
        `ҰБТ әлі тапсырылмаған, бағдар — ${s.requirements.ent} балл`,
      ))
    } else {
      gaps.push(L(
        'Без ЕНТ на эту стипендию подать нельзя',
        'ҰБТ-сыз бұл шәкіртақыға өтінім беру мүмкін емес',
      ))
    }
  } else {
    score += 6
  }

  // Достижения
  if (s.requirements.achievements !== undefined) {
    if (ach.strength >= s.requirements.achievements) {
      score += 12
      reasons.push({
        tone: 'good',
        tag: L('Достижения', 'Жетістіктер'),
        text: L(
          'Здесь смотрят на олимпиады, проекты и активности — твой профиль для этого достаточно сильный.',
          'Мұнда олимпиада, жоба және белсенділікке қарайды — профилің ол үшін жеткілікті күшті.',
        ),
      })
    } else {
      score += 3
      gaps.push(
        ach.count === 0
          ? L(
              'Нужны достижения: олимпиады, проекты или конкурсы, в анкете их пока нет',
              'Жетістіктер керек: олимпиада, жоба немесе конкурс, сауалнамада олар әзірге жоқ',
            )
          : L(
              'Профиль достижений пока слабее, чем обычно требуется для этой стипендии',
              'Жетістік профилі әзірге бұл шәкіртақыға әдетте қажет деңгейден әлсіз',
            ),
      )
    }
  } else {
    score += 6
  }

  return {
    scholarship: s,
    score: Math.min(100, Math.round(score)),
    reasons: reasons.slice(0, 3),
    gaps: gaps.slice(0, 3),
    eligible: gaps.length === 0,
  }
}

export function matchScholarships(profile: Profile): ScholarshipMatch[] {
  const ach = summarizeAchievements(profile)
  return SCHOLARSHIPS.map((s) => scoreScholarship(profile, s, ach))
    .filter((m) => m.score >= 35)
    .sort((a, b) => b.score - a.score)
}
