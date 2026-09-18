import type { Profile, Recommendation, RoadmapPhase, RoadmapTask } from '../types'
import {
  ACHIEVEMENT_KIND_LABEL, COUNTRY_LABEL, ENGLISH_RANK, FIELD_LABEL, FIELD_SUBJECTS,
  STAGE_YEARS_TO_APPLY,
} from '../data/taxonomy'
import { effectiveIelts } from './match'
import { effectiveGpa } from './academics'
import { summarizeAchievements } from './achievements'
import { suggestActivities } from './activities'
import { matchScholarships } from './scholarships'
import { cscaPlan } from './csca'
import { listOf, softLower } from '../lib/text'
import { L } from '../i18n/lang'

/**
 * Подписи фаз считаются при построении плана, а не при загрузке модуля:
 * иначе язык зафиксировался бы на том, что стоял до выбора пользователя.
 */
function phaseMeta(): Record<RoadmapTask['phase'], { title: string; subtitle: string }> {
  return {
    now: { title: L('Сейчас', 'Қазір'), subtitle: L('ближайшие 1–2 месяца', 'алдағы 1–2 ай') },
    soon: { title: L('Подготовка', 'Дайындық'), subtitle: L('следующие 3–9 месяцев', 'келесі 3–9 ай') },
    apply: { title: L('Подача', 'Өтінім'), subtitle: L('сезон заявок и документов', 'өтінім мен құжат маусымы') },
    final: { title: L('Финал', 'Финал'), subtitle: L('решение, виза и заезд', 'шешім, виза және көшу') },
  }
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
  const gpa = effectiveGpa(profile)
  const ach = summarizeAchievements(profile)
  // Насколько программы в топе вообще смотрят на портфолио и активности.
  const holisticTop = top.length > 0
    ? Math.max(...top.map((r) => r.program.holistic))
    : 1
  const add = (t: RoadmapTask) => tasks.push(t)

  // — Сейчас —
  if (top.length > 0) {
    add({
      id: 'shortlist',
      title: L(`Собрать короткий список: ${top.slice(0, 3).map((r) => r.program.universityShort).join(', ')}`, `Қысқа тізім жинау: ${top.slice(0, 3).map((r) => r.program.universityShort).join(', ')}`),
      why: L('Три варианта — рабочий минимум: один амбициозный, один основной, один запасной. Дальше весь план строится вокруг их требований.', 'Үш нұсқа — жұмыс минимумы: бірі амбициялы, бірі негізгі, бірі қосалқы. Әрі қарай бүкіл жоспар солардың талаптарына құрылады.'),
      category: 'research',
      phase: 'now',
      window: L('на этой неделе', 'осы аптада'),
      effort: L('30 минут', '30 минут'),
    })
    add({
      id: 'verify-requirements',
      title: L(`Сверить требования ${top[0].program.universityShort} с официальным сайтом`, `${top[0].program.universityShort} талаптарын ресми сайтпен салыстыру`),
      why: L('В прототипе используются демо-данные. Перед тем как строить подготовку вокруг цифр, их нужно подтвердить на сайте вуза.', 'Прототипте демо-деректер қолданылады. Цифрлардың айналасында дайындық құрмас бұрын, оларды ЖОО сайтында растау керек.'),
      category: 'research',
      phase: 'now',
      window: L('на этой неделе', 'осы аптада'),
      effort: L('20 минут', '20 минут'),
      source: top[0].program.source,
    })
  }

  if (needsIelts && ielts < 6.5) {
    add({
      id: 'english-baseline',
      title: L('Пройти пробный тест IELTS и узнать стартовый балл', 'Сынама IELTS тестін тапсырып, бастапқы баллды білу'),
      why: L(
        `Часть программ в твоём подборе просит около IELTS ${Math.max(
          ...top.map((r) => r.program.requirements.ielts ?? 0),
        )}. Без честного стартового балла нельзя спланировать подготовку.`,
        `Таңдауыңдағы кейбір бағдарлама шамамен IELTS ${Math.max(
          ...top.map((r) => r.program.requirements.ielts ?? 0),
        )} сұрайды. Шынайы бастапқы баллсыз дайындықты жоспарлау мүмкін емес.`,
      ),
      category: 'exam',
      phase: 'now',
      window: L('ближайшие 2 недели', 'алдағы 2 апта'),
      effort: L('3 часа', '3 сағат'),
      source: { label: 'ielts.org — sample tests', url: 'https://www.ielts.org/for-test-takers/sample-test-questions' },
    })
  }

  // CSCA нужен только тем, кто целится в Китай, и набор предметов у каждого свой,
  // поэтому шаг называет их поимённо, а не отправляет «узнать требования».
  const csca = cscaPlan(profile)
  // Условие — Китай в выбранных странах, а не в топе выдачи: экзамен нужно
  // готовить заранее, а топ может меняться от правки бюджета или языка,
  // и шаг бы то появлялся, то исчезал.
  if (csca.relevant) {
    const list = csca.subjects.map((sub) => L(sub.short, sub.shortKk))
    // Ориентир берётся по всей выдаче, а не по топу: экзамен готовят заранее,
    // а китайская программа может стоять и на седьмом месте — балл всё равно
    // нужен, иначе шаг говорит «готовься», не называя цели.
    const cnTop = recs
      .filter((r) => r.program.country === 'CN' && r.program.requirements.csca !== undefined)
      .sort((a, b) => b.program.requirements.csca! - a.program.requirements.csca!)[0]
    const aim = cnTop
      ? L(
          ` Ориентир по ${cnTop.program.universityShort} — примерно ${cnTop.program.requirements.csca} из 100, это демонстрационная оценка.`,
          ` ${cnTop.program.universityShort} бойынша бағдар — 100-ден шамамен ${cnTop.program.requirements.csca}, бұл демонстрациялық баға.`,
        )
      : ''
    add({
      id: 'csca-plan',
      title: L(
        `Начать подготовку к CSCA: ${listOf(list)}`,
        `CSCA-ға дайындықты бастау: ${listOf(list)}`,
      ),
      why: L(
        `Это вступительный экзамен вузов Китая для иностранцев. Набор предметов собран под твоё направление и язык обучения. ${csca.trackNote}${aim}`,
        `Бұл — Қытай ЖОО-ларының шетелдіктерге арналған кіру емтиханы. Пәндер жинағы бағытың мен оқу тіліңе қарай құрылған. ${csca.trackNote}${aim}`,
      ),
      category: 'exam',
      phase: 'soon',
      window: L('ближайшие 2 месяца', 'алдағы 2 ай'),
      effort: L('по 3–4 часа в неделю', 'аптасына 3–4 сағаттан'),
      source: csca.source,
    })
  }

  if (needsEnt && profile.exams.ent === undefined) {
    add({
      id: 'ent-diagnostic',
      title: L('Пройти пробное ЕНТ по профильным предметам', 'Бейіндік пәндер бойынша сынама ҰБТ тапсыру'),
      why: L(
        `Для грантов в Казахстане ЕНТ — основной фильтр. Ориентир по твоему подбору — от ${Math.min(
          ...top.filter((r) => r.program.requirements.ent).map((r) => r.program.requirements.ent!),
        )} баллов.`,
        `Қазақстандағы granттар үшін ҰБТ — негізгі сүзгі. Таңдауың бойынша бағдар — ${Math.min(
          ...top.filter((r) => r.program.requirements.ent).map((r) => r.program.requirements.ent!),
        )} балдан бастап.`,
      ),
      category: 'exam',
      phase: 'now',
      window: L('ближайший месяц', 'алдағы ай'),
      effort: L('4 часа', '4 сағат'),
      source: { label: 'testcenter.kz', url: 'https://testcenter.kz' },
    })
  }

  if (profile.strongSubjects.length === 0) {
    add({
      id: 'subjects-audit',
      title: L('Определить два профильных предмета и зафиксировать текущие оценки', 'Екі бейіндік пәнді анықтап, ағымдағы бағаларды белгілеу'),
      why: L('Профильные предметы задают и набор ЕНТ, и то, какие программы вообще доступны.', 'Бейіндік пәндер ҰБТ жиынтығын да, қандай бағдарламалар қолжетімді екенін де айқындайды.'),
      category: 'academic',
      phase: 'now',
      window: L('ближайшие 2 недели', 'алдағы 2 апта'),
      effort: L('1 час', '1 сағат'),
    })
  }

  // — Подготовка —
  if (needsIelts) {
    add({
      id: 'english-plan',
      title: ielts >= 6.5 ? L('Поддерживать английский и записаться на официальный IELTS', 'Ағылшын тілін ұстап, ресми IELTS-ке жазылу') : L('Заниматься английским по плану до целевого балла', 'Мақсатты баллға дейін ағылшын тілін жоспармен оқу'),
      why:
        ielts >= 6.5
          ? L('Уровень уже близок к требованиям, осталось получить официальный сертификат — он нужен для подачи.', 'Деңгей талаптарға жақын, тек ресми сертификат алу қалды — ол өтінім беруге қажет.')
          : L(
              `Твой текущий уровень оценён примерно в IELTS ${ielts.toFixed(1)}, целевой — ${Math.max(
                ...top.map((r) => r.program.requirements.ielts ?? 6),
              )}. Разрыв закрывается регулярными занятиями, а не рывком перед экзаменом.`,
              `Ағымдағы деңгейің шамамен IELTS ${ielts.toFixed(1)}, мақсат — ${Math.max(
                ...top.map((r) => r.program.requirements.ielts ?? 6),
              )}. Айырма емтихан алдындағы бір серпінмен емес, тұрақты сабақпен жабылады.`,
            ),
      category: 'exam',
      phase: 'soon',
      window: years >= 1 ? L('в течение года', 'жыл ішінде') : L('ближайшие 3 месяца', 'алдағы 3 ай'),
      effort: L('4–6 часов в неделю', 'аптасына 4–6 сағат'),
    })
  }

  if (needsEnt) {
    add({
      id: 'ent-prep',
      title: L('Готовиться к ЕНТ по профильным предметам', 'Бейіндік пәндер бойынша ҰБТ-ға дайындалу'),
      why: L(
        `Профильные предметы для твоего направления: ${
          profile.fields.length
            ? FIELD_SUBJECTS[profile.fields[0]].slice(0, 3).join(', ')
            : 'математика и язык'
        }. Балл ЕНТ напрямую решает вопрос гранта.`,
        `Бағытың бойынша бейіндік пәндер: ${
          profile.fields.length
            ? FIELD_SUBJECTS[profile.fields[0]].slice(0, 3).join(', ')
            : 'математика және тіл'
        }. ҰБТ баллы грант мәселесін тікелей шешеді.`,
      ),
      category: 'exam',
      phase: 'soon',
      window: L('до мартовской сессии ЕНТ', 'наурыздағы ҰБТ сессиясына дейін'),
      effort: L('5 часов в неделю', 'аптасына 5 сағат'),
      source: { label: 'testcenter.kz', url: 'https://testcenter.kz' },
    })
  }

  if (needsSat) {
    add({
      id: 'sat-prep',
      title: L('Зарегистрироваться на SAT и пройти подготовку', 'SAT-қа тіркеліп, дайындықтан өту'),
      why: L(
        `SAT просят ${top.filter((r) => r.program.requirements.sat).map((r) => r.program.universityShort).join(', ')}. Регистрация закрывается примерно за месяц до даты экзамена.`,
        `SAT-ты ${top.filter((r) => r.program.requirements.sat).map((r) => r.program.universityShort).join(', ')} сұрайды. Тіркеу емтихан күніне шамамен бір ай қалғанда жабылады.`,
      ),
      category: 'exam',
      phase: 'soon',
      window: L('выбрать дату за 3 месяца', 'күнді 3 ай бұрын таңдау'),
      effort: L('3 часа в неделю', 'аптасына 3 сағат'),
      source: { label: 'collegeboard.org', url: 'https://satsuite.collegeboard.org/sat' },
    })
  }

  if (needsPortfolio) {
    add({
      id: 'portfolio',
      title: L('Собрать портфолио из 8–12 работ', '8–12 жұмыстан портфолио жинау'),
      why: L('Творческие программы в твоём подборе принимают по портфолио. Оно собирается месяцами, а не за неделю до дедлайна.', 'Таңдауыңдағы шығармашылық бағдарламалар портфолио бойынша қабылдайды. Ол айлап жиналады, мерзімге бір апта қалғанда емес.'),
      category: 'activity',
      phase: 'soon',
      window: L('за 6 месяцев до подачи', 'өтінімге 6 ай қалғанда'),
      effort: L('3 часа в неделю', 'аптасына 3 сағат'),
    })
  }

  if (gpa < 4.5 && years >= 1) {
    add({
      id: 'gpa-up',
      title: L(
        `Поднять средний балл с ${gpa.toFixed(1)} хотя бы до 4.5`,
        `Орташа баллды ${gpa.toFixed(1)}-тен кемінде 4.5-ке дейін көтеру`,
      ),
      why: L('Конкурсные программы и гранты смотрят на аттестат. У тебя ещё есть учебный год, чтобы это изменить.', 'Конкурстық бағдарламалар мен granттар аттестатқа қарайды. Мұны өзгертуге әлі бір оқу жылың бар.'),
      category: 'academic',
      phase: 'soon',
      window: L('до конца учебного года', 'оқу жылының соңына дейін'),
      effort: L('постоянно', 'үнемі'),
    })
  }

  /**
   * Активности берутся из пробелов в достижениях, а не из общего списка.
   * Поэтому добавление достижения в анкету убирает соответствующий шаг из
   * маршрута и подставляет следующий по важности — план заметно меняется.
   */
  const ideas = suggestActivities(profile, holisticTop >= 4 ? 3 : 2)
  ideas.forEach((s, i) => {
    add({
      id: `activity-${s.idea.id}`,
      title: s.idea.title,
      why: `${s.hint}. ${s.idea.why}`,
      category: s.idea.kind === 'hackathon' || s.idea.kind === 'contest' || s.idea.kind === 'olympiad'
        ? 'contest'
        : s.idea.kind === 'research'
          ? 'research'
          : 'activity',
      phase: i === 0 ? 'now' : 'soon',
      window: years >= 1 ? L('в течение года', 'жыл ішінде') : L('ближайшие 2 месяца', 'алдағы 2 ай'),
      effort: s.idea.effort,
      source: s.idea.source,
    })
  })

  if (ach.count === 0 && holisticTop >= 4) {
    add({
      id: 'achievements-empty',
      title: L('Внести в анкету всё, что уже есть: олимпиады, проекты, волонтёрство', 'Сауалнамаға бар нәрсенің бәрін енгізу: олимпиада, жоба, волонтёрлік'),
      why: L('Программы в твоём топе читают заявку целиком. Даже школьная грамота или кружок меняют и оценку шансов, и маршрут — сейчас в профиле пусто.', 'Топтағы бағдарламалар өтінімді түгел оқиды. Тіпті мектеп грамотасы немесе үйірме де мүмкіндік бағасын да, маршрутты да өзгертеді — қазір профиль бос.'),
      category: 'activity',
      phase: 'now',
      window: L('сегодня', 'бүгін'),
      effort: L('10 минут', '10 минут'),
    })
  } else if (ach.count > 0 && ach.strength >= 0.45) {
    add({
      id: 'achievements-leverage',
      title: L('Построить мотивационное письмо вокруг сильного достижения', 'Мотивациялық хатты күшті жетістіктің айналасына құру'),
      why: L(
        `Самое весомое в твоей анкете — ${softLower(ach.highlights[0] ?? 'указанное достижение')}. В заявке это работает только тогда, когда объяснено, чему оно тебя научило.`,
        `Сауалнамаңдағы ең салмақтысы — ${softLower(ach.highlights[0] ?? 'көрсетілген жетістік')}. Өтінімде ол саған не үйреткені түсіндірілгенде ғана жұмыс істейді.`,
      ),
      category: 'essay',
      phase: 'soon',
      window: L('за 3 месяца до подачи', 'өтінімге 3 ай қалғанда'),
      effort: L('3 часа', '3 сағат'),
    })
  }

  if (ach.count > 0 && ach.relevance < 0.5 && profile.fields.length > 0) {
    add({
      id: 'achievements-align',
      title: L(
        `Добавить достижение по направлению «${FIELD_LABEL[profile.fields[0]]}»`,
        `«${FIELD_LABEL[profile.fields[0]]}» бағыты бойынша жетістік қосу`,
      ),
      why: L(
        `Достижения в анкете есть, но по выбранному направлению их почти нет. Приёмная комиссия ищет связь между активностями и тем, куда ты подаёшь${
          ach.missing.length > 0 ? `: не хватает такого, как ${softLower(ACHIEVEMENT_KIND_LABEL[ach.missing[0]])}` : ''
        }.`,
        `Сауалнамада жетістіктер бар, бірақ таңдалған бағыт бойынша олар жоққа тән. Қабылдау комиссиясы белсенділік пен өтінім беретін бағыттың арасындағы байланысты іздейді${
          ach.missing.length > 0 ? `: ${softLower(ACHIEVEMENT_KIND_LABEL[ach.missing[0]])} сияқтысы жетіспейді` : ''
        }.`,
      ),
      category: 'activity',
      phase: 'soon',
      window: L('ближайшие 3 месяца', 'алдағы 3 ай'),
      effort: L('2 часа в неделю', 'аптасына 2 сағат'),
    })
  }

  // Стипендии со своими дедлайнами — отдельные шаги, а не сноска в тексте.
  const schol = matchScholarships(profile).filter((m) => m.score >= 55).slice(0, 2)
  schol.forEach((m) => {
    add({
      id: `scholarship-${m.scholarship.id}`,
      title: L(`Подготовить заявку: ${m.scholarship.name}`, `Өтінім дайындау: ${m.scholarship.name}`),
      why: m.eligible
        ? L(
            `${m.scholarship.coverage}. Подача — ${m.scholarship.window}, это ориентировочный период по демо-данным.`,
            `${m.scholarship.coverage}. Өтінім — ${m.scholarship.window}, бұл демо-деректер бойынша болжамды кезең.`,
          )
        : L(
            `${m.scholarship.coverage}. Сейчас не закрыто: ${softLower(m.gaps[0] ?? 'часть требований')}.`,
            `${m.scholarship.coverage}. Қазір жабылмағаны: ${softLower(m.gaps[0] ?? 'талаптардың бір бөлігі')}.`,
          ),
      category: 'scholarship',
      phase: 'soon',
      window: m.scholarship.window,
      effort: L('4–6 часов', '4–6 сағат'),
      source: m.scholarship.source,
    })
  })

  if (grantTargets.length > 0) {
    add({
      id: 'grants',
      title: L(
        `Изучить условия грантов: ${grantTargets.slice(0, 2).map((r) => r.program.universityShort).join(' и ')}`,
        `Грант шарттарын зерттеу: ${grantTargets.slice(0, 2).map((r) => r.program.universityShort).join(' және ')}`,
      ),
      why: grantTargets[0].program.grant.note + L(
        '. У стипендий свои дедлайны, часто раньше, чем у самих вузов.',
        '. Шәкіртақылардың өз мерзімдері бар, көбіне ЖОО мерзімінен ерте.',
      ),
      category: 'research',
      phase: 'soon',
      window: L('за 8–10 месяцев до старта учёбы', 'оқу басталуына 8–10 ай қалғанда'),
      effort: L('2 часа', '2 сағат'),
      source: grantTargets[0].program.source,
    })
  }

  // — Подача —
  add({
    id: 'documents',
    title: L('Подготовить пакет документов: аттестат, переводы, справки', 'Құжат топтамасын дайындау: аттестат, аудармалар, анықтамалар'),
    why: abroad
      ? L('Для зарубежных программ документы нужны с нотариальным переводом, иногда с апостилем. Это занимает недели, а не дни.', 'Шетелдік бағдарламаларға құжаттар нотариалды аудармамен, кейде апостильмен керек. Бұл күндер емес, апталар алады.')
      : L('Пакет документов для приёмной комиссии лучше собрать заранее, чтобы не собирать его в последнюю неделю.', 'Қабылдау комиссиясына арналған құжаттарды соңғы аптада емес, алдын ала жинаған дұрыс.'),
    category: 'document',
    phase: 'apply',
    window: L('за 2 месяца до дедлайна подачи', 'өтінім мерзіміне 2 ай қалғанда'),
    effort: L('1–2 недели', '1–2 апта'),
  })

  add({
    id: 'cv',
    title: L('Собрать одностраничное CV', 'Бір беттік CV жинау'),
    why: L('Резюме просят и вузы, и стипендии. На одной странице: учёба, достижения, проекты, волонтёрство и языки.', 'Түйіндемені ЖОО да, шәкіртақылар да сұрайды. Бір бетте: оқу, жетістіктер, жобалар, волонтёрлік және тілдер.'),
    category: 'document',
    phase: 'apply',
    window: L('за 2 месяца до дедлайна', 'мерзімге 2 ай қалғанда'),
    effort: L('2 часа', '2 сағат'),
    source: { label: L('Шаблон Europass', 'Europass үлгісі'), url: 'https://europa.eu/europass/en/create-europass-cv' },
  })

  add({
    id: 'motivation',
    title: L('Написать мотивационное письмо и дать его проверить', 'Мотивациялық хат жазып, оны тексертіп алу'),
    why: L('Одно письмо пишется под все программы, а потом адаптируется под каждую. Черновик всегда слабее третьей версии.', 'Бір хат барлық бағдарламаға жазылып, содан кейін әрқайсысына бейімделеді. Жоба нұсқасы әрқашан үшінші нұсқадан әлсіз.'),
    category: 'essay',
    phase: 'apply',
    window: L('за 6 недель до дедлайна', 'мерзімге 6 апта қалғанда'),
    effort: L('5–8 часов', '5–8 сағат'),
  })

  if (abroad) {
    add({
      id: 'recommendation',
      title: L('Запросить рекомендательные письма у двух учителей', 'Екі мұғалімнен ұсыныс хат сұрау'),
      why: L('Учителю нужно время. Просить за неделю до дедлайна — значит получить формальный текст.', 'Мұғалімге уақыт керек. Мерзімге бір апта қалғанда сұрау — формалды мәтін алу деген сөз.'),
      category: 'document',
      phase: 'apply',
      window: L('за 6 недель до дедлайна', 'мерзімге 6 апта қалғанда'),
      effort: L('1 час + ожидание', '1 сағат + күту'),
    })
  }

  if (needsLocalExam) {
    add({
      id: 'local-exam',
      title: L('Подготовиться к внутреннему экзамену или собеседованию', 'ЖОО ішкі емтиханына немесе сұхбатқа дайындалу'),
      why: L(
        `Часть программ в подборе (${top
          .filter((r) => r.program.requirements.entranceExam)
          .map((r) => r.program.universityShort)
          .join(', ')}) проводит собственное испытание помимо основных экзаменов.`,
        `Таңдаудағы кейбір бағдарлама (${top
          .filter((r) => r.program.requirements.entranceExam)
          .map((r) => r.program.universityShort)
          .join(', ')}) негізгі емтихандардан бөлек өз сынағын өткізеді.`,
      ),
      category: 'exam',
      phase: 'apply',
      window: L('за месяц до испытания', 'сынаққа бір ай қалғанда'),
      effort: L('4 часа в неделю', 'аптасына 4 сағат'),
    })
  }

  top.slice(0, 3).forEach((r, i) => {
    const d = r.program.deadlines[0]
    add({
      id: `submit-${r.program.id}`,
      title: L(
        `Подать заявку: ${r.program.universityShort}, ${r.program.program}`,
        `Өтінім беру: ${r.program.universityShort}, ${r.program.program}`,
      ),
      why: L(
        `${d.label} — ориентировочно ${d.window}. Период указан по демо-данным, точную дату нужно сверить на сайте вуза.`,
        `${d.label} — шамамен ${d.window}. Кезең демо-деректер бойынша көрсетілген, нақты күнді ЖОО сайтынан салыстыру керек.`,
      ),
      category: 'document',
      phase: 'apply',
      window: d.window,
      effort: i === 0 ? L('полдня', 'жарты күн') : L('2–3 часа', '2–3 сағат'),
      source: r.program.source,
    })
  })

  // — Финал —
  add({
    id: 'compare-offers',
    title: L('Сравнить полученные приглашения по стоимости и условиям', 'Келген шақыруларды құны мен шарты бойынша салыстыру'),
    why: L('Когда придут ответы, решение принимается быстро. Таблица сравнения, собранная заранее, снимает панику.', 'Жауаптар келгенде шешім тез қабылданады. Алдын ала жасалған салыстыру кестесі дүрбелеңді басады.'),
    category: 'research',
    phase: 'final',
    window: L('после первых ответов', 'алғашқы жауаптардан кейін'),
    effort: L('2 часа', '2 сағат'),
  })

  if (abroad) {
    const country = top.find((r) => r.program.country !== 'KZ')?.program.country
    add({
      id: 'visa',
      title: L(
        `Собрать документы на студенческую визу${country ? `: ${COUNTRY_LABEL[country]}` : ''}`,
        `Студенттік визаға құжат жинау${country ? `: ${COUNTRY_LABEL[country]}` : ''}`,
      ),
      why: L('Виза зависит от приглашения, финансовых гарантий и записи в консульство. Это самый частый источник срыва планов.', 'Виза шақыруға, қаржылық кепілдікке және консулдыққа жазылуға байланысты. Бұл — жоспардың бұзылуының ең жиі себебі.'),
      category: 'document',
      phase: 'final',
      window: L('сразу после приглашения', 'шақырудан кейін бірден'),
      effort: L('2–4 недели', '2–4 апта'),
    })
    add({
      id: 'housing',
      title: L('Решить вопрос с жильём и бюджетом на первый год', 'Тұрғын үй мен бірінші жылдың бюджет мәселесін шешу'),
      why: L(
        `Проживание — заметная часть расходов: около $${Math.round(
          top[0].program.livingUsd,
        )} в месяц по демо-оценке для города ${top[0].program.city}.`,
        `Тұру — шығынның елеулі бөлігі: ${top[0].program.city} қаласы бойынша демо-бағалау бойынша айына шамамен $${Math.round(
          top[0].program.livingUsd,
        )}.`,
      ),
      category: 'research',
      phase: 'final',
      window: L('за 2 месяца до заезда', 'көшуге 2 ай қалғанда'),
      effort: L('3 часа', '3 сағат'),
    })
  }

  if (ENGLISH_RANK[profile.english] >= 2 && !needsIelts && abroad) {
    add({
      id: 'language-cert',
      title: L('Уточнить, нужен ли языковой сертификат для выбранной программы', 'Таңдалған бағдарламаға тіл сертификаты керек пе, соны нақтылау'),
      why: L('Даже на неанглоязычных программах часто просят подтверждение языка обучения.', 'Ағылшын тілінде емес бағдарламаларда да оқу тілін растауды жиі сұрайды.'),
      category: 'research',
      phase: 'final',
      window: L('до подачи', 'өтінімге дейін'),
      effort: L('30 минут', '30 минут'),
    })
  }

  const order: RoadmapTask['phase'][] = ['now', 'soon', 'apply', 'final']
  const meta = phaseMeta()
  return order.map((phase) => ({
    id: phase,
    title: meta[phase].title,
    subtitle: meta[phase].subtitle,
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
