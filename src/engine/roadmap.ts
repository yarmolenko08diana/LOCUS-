import type { Profile, Recommendation, RoadmapPhase, RoadmapTask } from '../types'
import { COUNTRY_LABEL, ENGLISH_RANK, FIELD_LABEL, FIELD_SUBJECTS, STAGE_YEARS_TO_APPLY } from '../data/taxonomy'
import { effectiveIelts } from './match'

const PHASE_META: Record<RoadmapTask['phase'], { title: string; subtitle: string }> = {
  now: { title: 'Сейчас', subtitle: 'ближайшие 1–2 месяца' },
  soon: { title: 'Подготовка', subtitle: 'следующие 3–9 месяцев' },
  apply: { title: 'Подача', subtitle: 'сезон заявок и документов' },
  final: { title: 'Финал', subtitle: 'решение, виза и заезд' },
}

/**
 * Персональный план. Задачи не берутся из фиксированного списка: набор зависит
 * от этапа обучения, выбранных стран, языка, экзаменов и от требований программ,
 * которые реально попали в топ подбора.
 */
export function buildRoadmap(profile: Profile, recs: Recommendation[]): RoadmapPhase[] {
  const tasks: RoadmapTask[] = []
  const top = recs.slice(0, 5)
  const years = STAGE_YEARS_TO_APPLY[profile.stage]
  const needsEnt = top.some((r) => r.program.requirements.ent !== undefined)
  const needsIelts = top.some((r) => r.program.requirements.ielts !== undefined)
  const needsSat = top.some((r) => r.program.requirements.sat !== undefined)
  const needsPortfolio = top.some((r) => r.program.requirements.portfolio)
  const needsLocalExam = top.some((r) => r.program.requirements.entranceExam)
  const abroad = top.some((r) => r.program.country !== 'KZ')
  const grantTargets = top.filter((r) => r.program.grant.available)
  const ielts = effectiveIelts(profile)
  const add = (t: RoadmapTask) => tasks.push(t)

  // — Сейчас —
  if (top.length > 0) {
    add({
      id: 'shortlist',
      title: `Собрать короткий список: ${top.slice(0, 3).map((r) => r.program.universityShort).join(', ')}`,
      why: 'Три варианта — рабочий минимум: один амбициозный, один основной, один запасной. Дальше весь план строится вокруг их требований.',
      category: 'research',
      phase: 'now',
      window: 'на этой неделе',
      effort: '30 минут',
    })
    add({
      id: 'verify-requirements',
      title: `Сверить требования ${top[0].program.universityShort} с официальным сайтом`,
      why: 'В прототипе используются демо-данные. Перед тем как строить подготовку вокруг цифр, их нужно подтвердить на сайте вуза.',
      category: 'research',
      phase: 'now',
      window: 'на этой неделе',
      effort: '20 минут',
      source: top[0].program.source,
    })
  }

  if (needsIelts && ielts < 6.5) {
    add({
      id: 'english-baseline',
      title: 'Пройти пробный тест IELTS и узнать стартовый балл',
      why: `Часть программ в твоём подборе просит около IELTS ${Math.max(
        ...top.map((r) => r.program.requirements.ielts ?? 0),
      )}. Без честного стартового балла нельзя спланировать подготовку.`,
      category: 'exam',
      phase: 'now',
      window: 'ближайшие 2 недели',
      effort: '3 часа',
      source: { label: 'ielts.org — sample tests', url: 'https://www.ielts.org/for-test-takers/sample-test-questions' },
    })
  }

  if (needsEnt && profile.exams.ent === undefined) {
    add({
      id: 'ent-diagnostic',
      title: 'Пройти пробное ЕНТ по профильным предметам',
      why: `Для грантов в Казахстане ЕНТ — основной фильтр. Ориентир по твоему подбору — от ${Math.min(
        ...top.filter((r) => r.program.requirements.ent).map((r) => r.program.requirements.ent!),
      )} баллов.`,
      category: 'exam',
      phase: 'now',
      window: 'ближайший месяц',
      effort: '4 часа',
      source: { label: 'testcenter.kz', url: 'https://testcenter.kz' },
    })
  }

  if (profile.strongSubjects.length === 0) {
    add({
      id: 'subjects-audit',
      title: 'Определить два профильных предмета и зафиксировать текущие оценки',
      why: 'Профильные предметы задают и набор ЕНТ, и то, какие программы вообще доступны.',
      category: 'academic',
      phase: 'now',
      window: 'ближайшие 2 недели',
      effort: '1 час',
    })
  }

  // — Подготовка —
  if (needsIelts) {
    add({
      id: 'english-plan',
      title: ielts >= 6.5 ? 'Поддерживать английский и записаться на официальный IELTS' : 'Заниматься английским по плану до целевого балла',
      why:
        ielts >= 6.5
          ? 'Уровень уже близок к требованиям, осталось получить официальный сертификат — он нужен для подачи.'
          : `Твой текущий уровень оценён примерно в IELTS ${ielts.toFixed(1)}, целевой — ${Math.max(
              ...top.map((r) => r.program.requirements.ielts ?? 6),
            )}. Разрыв закрывается регулярными занятиями, а не рывком перед экзаменом.`,
      category: 'exam',
      phase: 'soon',
      window: years >= 1 ? 'в течение года' : 'ближайшие 3 месяца',
      effort: '4–6 часов в неделю',
    })
  }

  if (needsEnt) {
    add({
      id: 'ent-prep',
      title: 'Готовиться к ЕНТ по профильным предметам',
      why: `Профильные предметы для твоего направления: ${
        profile.fields.length
          ? FIELD_SUBJECTS[profile.fields[0]].slice(0, 3).join(', ')
          : 'математика и язык'
      }. Балл ЕНТ напрямую решает вопрос гранта.`,
      category: 'exam',
      phase: 'soon',
      window: 'до мартовской сессии ЕНТ',
      effort: '5 часов в неделю',
      source: { label: 'testcenter.kz', url: 'https://testcenter.kz' },
    })
  }

  if (needsSat) {
    add({
      id: 'sat-prep',
      title: 'Зарегистрироваться на SAT и пройти подготовку',
      why: `SAT просят ${top.filter((r) => r.program.requirements.sat).map((r) => r.program.universityShort).join(', ')}. Регистрация закрывается примерно за месяц до даты экзамена.`,
      category: 'exam',
      phase: 'soon',
      window: 'выбрать дату за 3 месяца',
      effort: '3 часа в неделю',
      source: { label: 'collegeboard.org', url: 'https://satsuite.collegeboard.org/sat' },
    })
  }

  if (needsPortfolio) {
    add({
      id: 'portfolio',
      title: 'Собрать портфолио из 8–12 работ',
      why: 'Творческие программы в твоём подборе принимают по портфолио. Оно собирается месяцами, а не за неделю до дедлайна.',
      category: 'activity',
      phase: 'soon',
      window: 'за 6 месяцев до подачи',
      effort: '3 часа в неделю',
    })
  }

  if (profile.gpa < 4.5 && years >= 1) {
    add({
      id: 'gpa-up',
      title: `Поднять средний балл с ${profile.gpa.toFixed(1)} хотя бы до 4.5`,
      why: 'Конкурсные программы и гранты смотрят на аттестат. У тебя ещё есть учебный год, чтобы это изменить.',
      category: 'academic',
      phase: 'soon',
      window: 'до конца учебного года',
      effort: 'постоянно',
    })
  }

  add({
    id: 'activity',
    title:
      profile.fields.length > 0
        ? `Сделать один проект или волонтёрство по теме «${FIELD_LABEL[profile.fields[0]]}»`
        : 'Добавить одну внеучебную активность в профиль',
    why: 'Зарубежные программы и стипендии оценивают не только баллы. Один доведённый до конца проект в мотивационном письме весит больше, чем список кружков.',
    category: 'activity',
    phase: 'soon',
    window: years >= 1 ? 'в течение года' : 'ближайшие 2 месяца',
    effort: '2 часа в неделю',
  })

  if (grantTargets.length > 0) {
    add({
      id: 'grants',
      title: `Изучить условия грантов: ${grantTargets.slice(0, 2).map((r) => r.program.universityShort).join(' и ')}`,
      why: grantTargets[0].program.grant.note + '. У стипендий свои дедлайны, часто раньше, чем у самих вузов.',
      category: 'research',
      phase: 'soon',
      window: 'за 8–10 месяцев до старта учёбы',
      effort: '2 часа',
      source: grantTargets[0].program.source,
    })
  }

  // — Подача —
  add({
    id: 'documents',
    title: 'Подготовить пакет документов: аттестат, переводы, справки',
    why: abroad
      ? 'Для зарубежных программ документы нужны с нотариальным переводом, иногда с апостилем. Это занимает недели, а не дни.'
      : 'Пакет документов для приёмной комиссии лучше собрать заранее, чтобы не собирать его в последнюю неделю.',
    category: 'document',
    phase: 'apply',
    window: 'за 2 месяца до дедлайна подачи',
    effort: '1–2 недели',
  })

  add({
    id: 'motivation',
    title: 'Написать мотивационное письмо и дать его проверить',
    why: 'Одно письмо пишется под все программы, а потом адаптируется под каждую. Черновик всегда слабее третьей версии.',
    category: 'document',
    phase: 'apply',
    window: 'за 6 недель до дедлайна',
    effort: '5–8 часов',
  })

  if (abroad) {
    add({
      id: 'recommendation',
      title: 'Запросить рекомендательные письма у двух учителей',
      why: 'Учителю нужно время. Просить за неделю до дедлайна — значит получить формальный текст.',
      category: 'document',
      phase: 'apply',
      window: 'за 6 недель до дедлайна',
      effort: '1 час + ожидание',
    })
  }

  if (needsLocalExam) {
    add({
      id: 'local-exam',
      title: 'Подготовиться к внутреннему экзамену или собеседованию',
      why: `Часть программ в подборе (${top
        .filter((r) => r.program.requirements.entranceExam)
        .map((r) => r.program.universityShort)
        .join(', ')}) проводит собственное испытание помимо основных экзаменов.`,
      category: 'exam',
      phase: 'apply',
      window: 'за месяц до испытания',
      effort: '4 часа в неделю',
    })
  }

  top.slice(0, 3).forEach((r, i) => {
    const d = r.program.deadlines[0]
    add({
      id: `submit-${r.program.id}`,
      title: `Подать заявку: ${r.program.universityShort}, ${r.program.program}`,
      why: `${d.label} — ориентировочно ${d.window}. Период указан по демо-данным, точную дату нужно сверить на сайте вуза.`,
      category: 'document',
      phase: 'apply',
      window: d.window,
      effort: i === 0 ? 'полдня' : '2–3 часа',
      source: r.program.source,
    })
  })

  // — Финал —
  add({
    id: 'compare-offers',
    title: 'Сравнить полученные приглашения по стоимости и условиям',
    why: 'Когда придут ответы, решение принимается быстро. Таблица сравнения, собранная заранее, снимает панику.',
    category: 'research',
    phase: 'final',
    window: 'после первых ответов',
    effort: '2 часа',
  })

  if (abroad) {
    const country = top.find((r) => r.program.country !== 'KZ')?.program.country
    add({
      id: 'visa',
      title: `Собрать документы на студенческую визу${country ? `: ${COUNTRY_LABEL[country]}` : ''}`,
      why: 'Виза зависит от приглашения, финансовых гарантий и записи в консульство. Это самый частый источник срыва планов.',
      category: 'document',
      phase: 'final',
      window: 'сразу после приглашения',
      effort: '2–4 недели',
    })
    add({
      id: 'housing',
      title: 'Решить вопрос с жильём и бюджетом на первый год',
      why: `Проживание — заметная часть расходов: около $${Math.round(
        top[0].program.livingUsd,
      )} в месяц по демо-оценке для города ${top[0].program.city}.`,
      category: 'research',
      phase: 'final',
      window: 'за 2 месяца до заезда',
      effort: '3 часа',
    })
  }

  if (ENGLISH_RANK[profile.english] >= 2 && !needsIelts && abroad) {
    add({
      id: 'language-cert',
      title: 'Уточнить, нужен ли языковой сертификат для выбранной программы',
      why: 'Даже на неанглоязычных программах часто просят подтверждение языка обучения.',
      category: 'research',
      phase: 'final',
      window: 'до подачи',
      effort: '30 минут',
    })
  }

  const order: RoadmapTask['phase'][] = ['now', 'soon', 'apply', 'final']
  return order.map((phase) => ({
    id: phase,
    title: PHASE_META[phase].title,
    subtitle: PHASE_META[phase].subtitle,
    tasks: tasks.filter((t) => t.phase === phase),
  }))
}

/** Ближайший невыполненный шаг — то самое «следующее действие» на главном экране. */
export function nextAction(phases: RoadmapPhase[], done: string[]): RoadmapTask | null {
  for (const phase of phases) {
    for (const task of phase.tasks) {
      if (!done.includes(task.id)) return task
    }
  }
  return null
}

export function allTasks(phases: RoadmapPhase[]): RoadmapTask[] {
  return phases.flatMap((p) => p.tasks)
}
