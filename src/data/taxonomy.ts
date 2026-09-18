import type {
  AchievementAward, AchievementForm, AchievementKind, AchievementLevel, BudgetTier, CountryCode,
  EnglishLevel, ExamId, FieldId, LanguageCode, Priority, SchoolSystem, Stage, ToneId,
} from '../types'
import { L } from '../i18n/lang'

/**
 * Справочники интерфейса на двух языках.
 *
 * Подписи хранятся парами (label / labelKk), а карты вида FIELD_LABEL отдают
 * нужный язык в момент обращения. Так все места, где раньше стояло
 * FIELD_LABEL[id], продолжают работать без изменений, а перевод не расходится
 * между экранами и текстами, которые генерирует движок.
 */
interface Localized {
  label: string
  labelKk: string
  hint?: string
  hintKk?: string
}

/** Карта id → подпись на текущем языке. */
function labelMap<K extends string, T extends Localized & { id?: K; code?: K }>(
  items: T[],
): Record<K, string> {
  const index = new Map<string, T>(items.map((i) => [String(i.id ?? i.code), i]))
  return new Proxy({} as Record<K, string>, {
    get: (_t, key: string) => {
      const item = index.get(key)
      return item ? L(item.label, item.labelKk) : key
    },
    has: (_t, key: string) => index.has(key),
    ownKeys: () => [...index.keys()],
    getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
  })
}

/** Копия списка с подписями на текущем языке — для отрисовки в анкете. */
function localize<T extends Localized>(items: T[]): T[] {
  return items.map((i) => ({
    ...i,
    label: L(i.label, i.labelKk),
    ...(i.hint !== undefined ? { hint: L(i.hint, i.hintKk ?? i.hint) } : {}),
  }))
}

export const FIELDS_RAW: {
  id: FieldId; label: string; labelKk: string; hint: string; hintKk: string; emoji: string
}[] = [
  { id: 'it', label: 'IT и данные', labelKk: 'IT және деректер', hint: 'разработка, ИИ, кибербезопасность', hintKk: 'бағдарламалау, ЖИ, киберқауіпсіздік', emoji: '💻' },
  { id: 'engineering', label: 'Инженерия', labelKk: 'Инженерия', hint: 'нефтегаз, робототехника, строительство', hintKk: 'мұнай-газ, робототехника, құрылыс', emoji: '⚙️' },
  { id: 'medicine', label: 'Медицина', labelKk: 'Медицина', hint: 'лечебное дело, фармация, биомед', hintKk: 'емдеу ісі, фармация, биомедицина', emoji: '🩺' },
  { id: 'business', label: 'Бизнес', labelKk: 'Бизнес', hint: 'менеджмент, маркетинг, предпринимательство', hintKk: 'менеджмент, маркетинг, кәсіпкерлік', emoji: '📈' },
  { id: 'economics', label: 'Экономика и финансы', labelKk: 'Экономика және қаржы', hint: 'финансы, аналитика, банкинг', hintKk: 'қаржы, аналитика, банк ісі', emoji: '🏦' },
  { id: 'design', label: 'Дизайн и архитектура', labelKk: 'Дизайн және сәулет', hint: 'UX, графика, среда', hintKk: 'UX, графика, орта', emoji: '🎨' },
  { id: 'law', label: 'Право', labelKk: 'Құқық', hint: 'юриспруденция, международное право', hintKk: 'құқықтану, халықаралық құқық', emoji: '⚖️' },
  { id: 'social', label: 'Общество и политика', labelKk: 'Қоғам және саясат', hint: 'международные отношения, психология', hintKk: 'халықаралық қатынастар, психология', emoji: '🌍' },
  { id: 'science', label: 'Наука', labelKk: 'Ғылым', hint: 'математика, физика, химия, биология', hintKk: 'математика, физика, химия, биология', emoji: '🔬' },
  { id: 'media', label: 'Медиа', labelKk: 'Медиа', hint: 'журналистика, кино, digital', hintKk: 'журналистика, кино, digital', emoji: '🎬' },
  { id: 'education', label: 'Образование', labelKk: 'Білім беру', hint: 'педагогика, языки', hintKk: 'педагогика, тілдер', emoji: '📚' },
  { id: 'agro', label: 'Агро и экология', labelKk: 'Агро және экология', hint: 'агрономия, экология, устойчивое развитие', hintKk: 'агрономия, экология, орнықты даму', emoji: '🌱' },
]

export const FIELD_LABEL = labelMap<FieldId, (typeof FIELDS_RAW)[number]>(FIELDS_RAW)
export function fields() { return localize(FIELDS_RAW) }

export const COUNTRIES_RAW: {
  code: CountryCode; label: string; labelKk: string; flag: string; hint: string; hintKk: string
}[] = [
  { code: 'KZ', label: 'Казахстан', labelKk: 'Қазақстан', flag: '🇰🇿', hint: 'дом, грант ЕНТ', hintKk: 'үй, ҰБТ гранты' },
  { code: 'RU', label: 'Россия', labelKk: 'Ресей', flag: '🇷🇺', hint: 'русский язык, квоты', hintKk: 'орыс тілі, квоталар' },
  { code: 'TR', label: 'Турция', labelKk: 'Түркия', flag: '🇹🇷', hint: 'стипендия Türkiye Bursları', hintKk: 'Türkiye Bursları шәкіртақысы' },
  { code: 'CZ', label: 'Чехия', labelKk: 'Чехия', flag: '🇨🇿', hint: 'бесплатно на чешском', hintKk: 'чех тілінде тегін' },
  { code: 'PL', label: 'Польша', labelKk: 'Польша', flag: '🇵🇱', hint: 'недорого, ЕС', hintKk: 'арзан, ЕО' },
  { code: 'HU', label: 'Венгрия', labelKk: 'Венгрия', flag: '🇭🇺', hint: 'Stipendium Hungaricum', hintKk: 'Stipendium Hungaricum' },
  { code: 'DE', label: 'Германия', labelKk: 'Германия', flag: '🇩🇪', hint: 'почти без платы за обучение', hintKk: 'оқу ақысы дерлік жоқ' },
  { code: 'NL', label: 'Нидерланды', labelKk: 'Нидерланды', flag: '🇳🇱', hint: 'англоязычный бакалавриат', hintKk: 'ағылшын тілді бакалавриат' },
  { code: 'IT', label: 'Италия', labelKk: 'Италия', flag: '🇮🇹', hint: 'низкая плата, стипендии', hintKk: 'төмен ақы, шәкіртақылар' },
  { code: 'GB', label: 'Великобритания', labelKk: 'Ұлыбритания', flag: '🇬🇧', hint: 'топ-рейтинги, дорого', hintKk: 'жоғары рейтинг, қымбат' },
  { code: 'US', label: 'США', labelKk: 'АҚШ', flag: '🇺🇸', hint: 'financial aid, SAT', hintKk: 'financial aid, SAT' },
  { code: 'AE', label: 'ОАЭ', labelKk: 'БАӘ', flag: '🇦🇪', hint: 'кампусы вузов, английский', hintKk: 'ЖОО кампустары, ағылшын тілі' },
  { code: 'CN', label: 'Китай', labelKk: 'Қытай', flag: '🇨🇳', hint: 'CSC-стипендии', hintKk: 'CSC шәкіртақылары' },
  { code: 'KR', label: 'Южная Корея', labelKk: 'Оңтүстік Корея', flag: '🇰🇷', hint: 'GKS-стипендии', hintKk: 'GKS шәкіртақылары' },
  { code: 'MY', label: 'Малайзия', labelKk: 'Малайзия', flag: '🇲🇾', hint: 'дёшево, английский', hintKk: 'арзан, ағылшын тілі' },
  { code: 'JP', label: 'Япония', labelKk: 'Жапония', flag: '🇯🇵', hint: 'стипендия MEXT, программы на английском', hintKk: 'MEXT шәкіртақысы, ағылшын тілді бағдарламалар' },
  { code: 'SG', label: 'Сингапур', labelKk: 'Сингапур', flag: '🇸🇬', hint: 'MOE Tuition Grant, сильные вузы', hintKk: 'MOE Tuition Grant, күшті ЖОО' },
  { code: 'HK', label: 'Гонконг (Китай)', labelKk: 'Гонконг (Қытай)', flag: '🇭🇰', hint: 'английский, стипендии вузов', hintKk: 'ағылшын тілі, ЖОО шәкіртақылары' },
  { code: 'GE', label: 'Грузия', labelKk: 'Грузия', flag: '🇬🇪', hint: 'безвизовый въезд, недорого', hintKk: 'визасыз кіру, арзан' },
  { code: 'CA', label: 'Канада', labelKk: 'Канада', flag: '🇨🇦', hint: 'работа после выпуска до 3 лет', hintKk: 'бітіргеннен кейін 3 жылға дейін жұмыс' },
  { code: 'AT', label: 'Австрия', labelKk: 'Австрия', flag: '🇦🇹', hint: '≈€1 500 в год в госвузах', hintKk: 'мемлекеттік ЖОО-да жылына ≈€1 500' },
  { code: 'FR', label: 'Франция', labelKk: 'Франция', flag: '🇫🇷', hint: 'субсидии и жилищная помощь CAF', hintKk: 'субсидиялар және CAF тұрғын үй көмегі' },
  { code: 'ES', label: 'Испания', labelKk: 'Испания', flag: '🇪🇸', hint: 'можно работать 30 часов в неделю', hintKk: 'аптасына 30 сағат жұмыс істеуге болады' },
]

export const COUNTRY_LABEL = labelMap<CountryCode, (typeof COUNTRIES_RAW)[number]>(COUNTRIES_RAW)
export function countries() { return localize(COUNTRIES_RAW) }

export const COUNTRY_FLAG: Record<CountryCode, string> = Object.fromEntries(
  COUNTRIES_RAW.map((c) => [c.code, c.flag]),
) as Record<CountryCode, string>

export const LANGUAGES_RAW: { code: LanguageCode; label: string; labelKk: string }[] = [
  { code: 'kk', label: 'Казахский', labelKk: 'Қазақ тілі' },
  { code: 'ru', label: 'Русский', labelKk: 'Орыс тілі' },
  { code: 'en', label: 'Английский', labelKk: 'Ағылшын тілі' },
  { code: 'tr', label: 'Турецкий', labelKk: 'Түрік тілі' },
  { code: 'de', label: 'Немецкий', labelKk: 'Неміс тілі' },
  { code: 'cs', label: 'Чешский', labelKk: 'Чех тілі' },
  { code: 'pl', label: 'Польский', labelKk: 'Поляк тілі' },
  { code: 'hu', label: 'Венгерский', labelKk: 'Венгр тілі' },
  { code: 'fr', label: 'Французский', labelKk: 'Француз тілі' },
  { code: 'es', label: 'Испанский', labelKk: 'Испан тілі' },
  { code: 'it', label: 'Итальянский', labelKk: 'Итальян тілі' },
  { code: 'zh', label: 'Китайский', labelKk: 'Қытай тілі' },
  { code: 'ko', label: 'Корейский', labelKk: 'Корей тілі' },
  { code: 'ja', label: 'Японский', labelKk: 'Жапон тілі' },
  { code: 'ka', label: 'Грузинский', labelKk: 'Грузин тілі' },
]

export const LANGUAGE_LABEL = labelMap<LanguageCode, (typeof LANGUAGES_RAW)[number]>(LANGUAGES_RAW)
export function languages() { return localize(LANGUAGES_RAW) }

export const ENGLISH_LEVELS_RAW: {
  id: EnglishLevel; label: string; labelKk: string; hint: string; hintKk: string
}[] = [
  { id: 'none', label: 'Почти нет', labelKk: 'Жоқтың қасы', hint: 'пока не использую', hintKk: 'әзірге қолданбаймын' },
  { id: 'a2', label: 'A2', labelKk: 'A2', hint: 'базовый', hintKk: 'бастапқы' },
  { id: 'b1', label: 'B1', labelKk: 'B1', hint: 'понимаю и говорю', hintKk: 'түсінемін және сөйлеймін' },
  { id: 'b2', label: 'B2', labelKk: 'B2', hint: 'учусь и читаю свободно', hintKk: 'еркін оқимын және оқуға жарайды' },
  { id: 'c1', label: 'C1+', labelKk: 'C1+', hint: 'уровень выше среднего', hintKk: 'орташадан жоғары деңгей' },
]

export function englishLevels() { return localize(ENGLISH_LEVELS_RAW) }

export const ENGLISH_RANK: Record<EnglishLevel, number> = {
  none: 0, a2: 1, b1: 2, b2: 3, c1: 4,
}

/** Ориентировочное соответствие уровня и балла IELTS для оценки шансов. */
export const ENGLISH_TO_IELTS: Record<EnglishLevel, number> = {
  none: 0, a2: 4, b1: 5, b2: 6.5, c1: 7.5,
}

export const STAGES_RAW: { id: Stage; label: string; labelKk: string; hint: string; hintKk: string }[] = [
  { id: 'grade9', label: '9 класс', labelKk: '9-сынып', hint: 'есть 2–3 года на подготовку', hintKk: 'дайындыққа 2–3 жыл бар' },
  { id: 'grade10', label: '10 класс', labelKk: '10-сынып', hint: 'год на экзамены и портфолио', hintKk: 'емтихан мен портфолиоға бір жыл' },
  { id: 'grade11', label: '11 класс', labelKk: '11-сынып', hint: 'подача уже в этом цикле', hintKk: 'өтінім осы циклде' },
  { id: 'graduate', label: 'Выпускник', labelKk: 'Түлек', hint: 'год перерыва или пересдача', hintKk: 'үзіліс жылы немесе қайта тапсыру' },
]

export const STAGE_LABEL = labelMap<Stage, (typeof STAGES_RAW)[number]>(STAGES_RAW)
export function stages() { return localize(STAGES_RAW) }

/** Сколько лет до подачи документов от текущего этапа. */
export const STAGE_YEARS_TO_APPLY: Record<Stage, number> = {
  grade9: 2, grade10: 1, grade11: 0, graduate: 0,
}

export const BUDGETS_RAW: {
  id: BudgetTier; label: string; labelKk: string; hint: string; hintKk: string; max: number
}[] = [
  { id: 'grant-only', label: 'Только грант', labelKk: 'Тек грант', hint: 'платить за обучение не получится', hintKk: 'оқу ақысын төлеу мүмкін емес', max: 0 },
  { id: 'upto2k', label: 'До $2 000 в год', labelKk: 'Жылына $2 000-ға дейін', hint: 'небольшой бюджет семьи', hintKk: 'отбасының шағын бюджеті', max: 2000 },
  { id: 'upto6k', label: 'До $6 000 в год', labelKk: 'Жылына $6 000-ға дейін', hint: 'средний бюджет', hintKk: 'орташа бюджет', max: 6000 },
  { id: 'upto15k', label: 'До $15 000 в год', labelKk: 'Жылына $15 000-ға дейін', hint: 'зарубежные программы реальны', hintKk: 'шетелдік бағдарламалар нақты', max: 15000 },
  { id: 'above15k', label: 'Больше $15 000', labelKk: '$15 000-нан жоғары', hint: 'бюджет почти не ограничивает', hintKk: 'бюджет дерлік шектемейді', max: 60000 },
]

export const BUDGET_MAX: Record<BudgetTier, number> = Object.fromEntries(
  BUDGETS_RAW.map((b) => [b.id, b.max]),
) as Record<BudgetTier, number>

export const BUDGET_LABEL = labelMap<BudgetTier, (typeof BUDGETS_RAW)[number]>(BUDGETS_RAW)
export function budgets() { return localize(BUDGETS_RAW) }

export const PRIORITIES_RAW: {
  id: Priority; label: string; labelKk: string; hint: string; hintKk: string
}[] = [
  { id: 'cost', label: 'Низкая стоимость', labelKk: 'Төмен құны', hint: 'грант или минимальная плата', hintKk: 'грант немесе ең аз ақы' },
  { id: 'prestige', label: 'Сильный вуз', labelKk: 'Күшті ЖОО', hint: 'имя и рейтинг важны', hintKk: 'аты мен рейтингі маңызды' },
  { id: 'employability', label: 'Работа после выпуска', labelKk: 'Бітіргеннен кейінгі жұмыс', hint: 'практика и трудоустройство', hintKk: 'практика және жұмысқа орналасу' },
  { id: 'closeToHome', label: 'Ближе к дому', labelKk: 'Үйге жақын', hint: 'не хочу далеко уезжать', hintKk: 'алысқа кеткім келмейді' },
  { id: 'community', label: 'Среда и сообщество', labelKk: 'Орта және қауымдастық', hint: 'студенческая жизнь, люди', hintKk: 'студенттік өмір, адамдар' },
]

export const PRIORITY_LABEL = labelMap<Priority, (typeof PRIORITIES_RAW)[number]>(PRIORITIES_RAW)
export function priorities() { return localize(PRIORITIES_RAW) }

export const EXAMS_RAW: { id: ExamId; label: string; labelKk: string; hint: string; hintKk: string }[] = [
  { id: 'ent', label: 'ЕНТ', labelKk: 'ҰБТ', hint: 'нужен для грантов Казахстана', hintKk: 'Қазақстан гранттары үшін қажет' },
  { id: 'ielts', label: 'IELTS', labelKk: 'IELTS', hint: 'английский для зарубежных программ', hintKk: 'шетелдік бағдарламалар үшін ағылшын тілі' },
  { id: 'sat', label: 'SAT', labelKk: 'SAT', hint: 'США и часть международных вузов', hintKk: 'АҚШ және кейбір халықаралық ЖОО' },
  { id: 'toefl', label: 'TOEFL', labelKk: 'TOEFL', hint: 'альтернатива IELTS', hintKk: 'IELTS баламасы' },
  { id: 'localExam', label: 'Экзамен вуза', labelKk: 'ЖОО емтиханы', hint: 'внутренний экзамен или собеседование', hintKk: 'ішкі емтихан немесе сұхбат' },
  { id: 'portfolio', label: 'Портфолио', labelKk: 'Портфолио', hint: 'дизайн, архитектура, медиа', hintKk: 'дизайн, сәулет, медиа' },
  { id: 'ib', label: 'IB Diploma', labelKk: 'IB дипломы', hint: 'международный диплом, принимают напрямую', hintKk: 'халықаралық диплом, тікелей қабылданады' },
  { id: 'csca', label: 'CSCA', labelKk: 'CSCA', hint: 'вступительный экзамен вузов Китая для иностранцев', hintKk: 'Қытай ЖОО-ларының шетелдіктерге арналған емтиханы' },
]

export const EXAM_LABEL = labelMap<ExamId, (typeof EXAMS_RAW)[number]>(EXAMS_RAW)
export function exams() { return localize(EXAMS_RAW) }

export const SUBJECTS_RAW: { id: string; label: string; labelKk: string }[] = [
  { id: 'Математика', label: 'Математика', labelKk: 'Математика' },
  { id: 'Физика', label: 'Физика', labelKk: 'Физика' },
  { id: 'Информатика', label: 'Информатика', labelKk: 'Информатика' },
  { id: 'Химия', label: 'Химия', labelKk: 'Химия' },
  { id: 'Биология', label: 'Биология', labelKk: 'Биология' },
  { id: 'История', label: 'История', labelKk: 'Тарих' },
  { id: 'География', label: 'География', labelKk: 'География' },
  { id: 'Английский', label: 'Английский', labelKk: 'Ағылшын тілі' },
  { id: 'Казахский язык', label: 'Казахский язык', labelKk: 'Қазақ тілі' },
  { id: 'Русский язык', label: 'Русский язык', labelKk: 'Орыс тілі' },
  { id: 'Литература', label: 'Литература', labelKk: 'Әдебиет' },
  { id: 'Право', label: 'Право', labelKk: 'Құқық' },
  { id: 'Экономика', label: 'Экономика', labelKk: 'Экономика' },
  { id: 'Черчение и рисунок', label: 'Черчение и рисунок', labelKk: 'Сызу және сурет' },
]

export const SUBJECTS = SUBJECTS_RAW.map((s) => s.id)
export const SUBJECT_LABEL = labelMap<string, (typeof SUBJECTS_RAW)[number]>(SUBJECTS_RAW)
export function subjects() { return localize(SUBJECTS_RAW) }

/** Какие школьные предметы усиливают какое направление. */
export const FIELD_SUBJECTS: Record<FieldId, string[]> = {
  it: ['Математика', 'Информатика', 'Физика'],
  engineering: ['Математика', 'Физика', 'Черчение и рисунок'],
  medicine: ['Биология', 'Химия'],
  business: ['Математика', 'Экономика', 'Английский'],
  economics: ['Математика', 'Экономика', 'География'],
  design: ['Черчение и рисунок', 'Литература'],
  law: ['История', 'Право', 'Литература'],
  social: ['История', 'География', 'Английский'],
  science: ['Математика', 'Физика', 'Химия', 'Биология'],
  media: ['Литература', 'Английский', 'История'],
  education: ['Литература', 'Казахский язык', 'Английский'],
  agro: ['Биология', 'Химия', 'География'],
}

export const SCHOOL_SYSTEMS_RAW: {
  id: SchoolSystem; label: string; labelKk: string; hint: string; hintKk: string
}[] = [
  { id: 'kz', label: 'Обычная школа', labelKk: 'Кәдімгі мектеп', hint: 'аттестат по 5-балльной шкале', hintKk: '5 балдық шкала бойынша аттестат' },
  { id: 'nis', label: 'НИШ', labelKk: 'НЗМ', hint: 'итоговый балл по 100-балльной шкале', hintKk: '100 балдық шкала бойынша қорытынды бал' },
  { id: 'ib', label: 'IB', labelKk: 'IB', hint: 'диплом International Baccalaureate, 24–45', hintKk: 'International Baccalaureate дипломы, 24–45' },
  { id: 'other', label: 'Другая система', labelKk: 'Басқа жүйе', hint: 'колледж, зарубежная школа, экстернат', hintKk: 'колледж, шетелдік мектеп, экстернат' },
]

export const SCHOOL_SYSTEM_LABEL = labelMap<SchoolSystem, (typeof SCHOOL_SYSTEMS_RAW)[number]>(SCHOOL_SYSTEMS_RAW)
export function schoolSystems() { return localize(SCHOOL_SYSTEMS_RAW) }

export const ACHIEVEMENT_KINDS_RAW: {
  id: AchievementKind; label: string; labelKk: string; hint: string; hintKk: string; emoji: string
  /** Пример названия для подсказки в поле ввода: у каждого типа свой. */
  example: string; exampleKk: string
}[] = [
  { id: 'olympiad', label: 'Олимпиада', labelKk: 'Олимпиада', emoji: '🥇', hint: 'предметная олимпиада или турнир', hintKk: 'пәндік олимпиада немесе турнир',
    example: 'Например: областная олимпиада по физике', exampleKk: 'Мысалы: физикадан облыстық олимпиада' },
  { id: 'research', label: 'Исследование', labelKk: 'Зерттеу', emoji: '🔬', hint: 'научный проект, статья, конференция', hintKk: 'ғылыми жоба, мақала, конференция',
    example: 'Например: статья о качестве воды в Kazakhstan Journal of Science', exampleKk: 'Мысалы: Kazakhstan Journal of Science журналындағы су сапасы туралы мақала' },
  { id: 'hackathon', label: 'Хакатон', labelKk: 'Хакатон', emoji: '💻', hint: 'командная разработка за 24–48 часов', hintKk: '24–48 сағаттық командалық әзірлеу',
    example: 'Например: 48-часовой хакатон nFactorial, приложение для школьников', exampleKk: 'Мысалы: nFactorial 48 сағаттық хакатоны, оқушыларға арналған қосымша' },
  { id: 'contest', label: 'Конкурс или соревнование', labelKk: 'Байқау немесе жарыс', emoji: '🏆', hint: 'кейс-чемпионат, ICPC, дебаты, робототехника', hintKk: 'кейс-чемпионат, ICPC, дебат, робототехника',
    example: 'Например: республиканский кейс-чемпионат по маркетингу', exampleKk: 'Мысалы: маркетинг бойынша республикалық кейс-чемпионат' },
  { id: 'project', label: 'Свой проект', labelKk: 'Өз жобаң', emoji: '🚀', hint: 'приложение, сайт, инициатива', hintKk: 'қосымша, сайт, бастама',
    example: 'Например: бот для расписания, которым пользуется вся школа', exampleKk: 'Мысалы: бүкіл мектеп қолданатын кесте боты' },
  { id: 'course', label: 'Курс с сертификатом', labelKk: 'Сертификаты бар курс', emoji: '📜', hint: 'онлайн-курс, летняя школа, программа при вузе', hintKk: 'онлайн-курс, жазғы мектеп, ЖОО жанындағы бағдарлама',
    example: 'Например: CS50 от Harvard с сертификатом', exampleKk: 'Мысалы: Harvard-тың CS50 курсы, сертификатымен' },
  { id: 'volunteer', label: 'Волонтёрство', labelKk: 'Волонтёрлық', emoji: '🤝', hint: 'помощь фондам и сообществу', hintKk: 'қорлар мен қоғамға көмек',
    example: 'Например: каждую субботу помогаю в приюте для животных', exampleKk: 'Мысалы: әр сенбіде жануарлар баспанасына көмектесемін' },
  { id: 'leadership', label: 'Лидерство', labelKk: 'Көшбасшылық', emoji: '🧭', hint: 'ученический совет, клуб, команда', hintKk: 'оқушылар кеңесі, клуб, команда',
    example: 'Например: основала IT-клуб в школе, 30 участников', exampleKk: 'Мысалы: мектепте IT-клуб аштым, 30 қатысушы' },
  { id: 'internship', label: 'Стажировка', labelKk: 'Тәжірибеден өту', emoji: '🏢', hint: 'работа или практика в организации', hintKk: 'ұйымдағы жұмыс немесе практика',
    example: 'Например: летняя стажировка в лаборатории КБТУ', exampleKk: 'Мысалы: ҚБТУ зертханасындағы жазғы тәжірибе' },
  { id: 'sport', label: 'Спорт', labelKk: 'Спорт', emoji: '🏅', hint: 'разряд, сборная, соревнования', hintKk: 'разряд, құрама, жарыстар',
    example: 'Например: сборная области по волейболу', exampleKk: 'Мысалы: волейболдан облыс құрамасы' },
  { id: 'art', label: 'Творчество', labelKk: 'Шығармашылық', emoji: '🎭', hint: 'музыка, театр, изобразительное искусство', hintKk: 'музыка, театр, бейнелеу өнері',
    example: 'Например: персональная выставка живописи в городской галерее', exampleKk: 'Мысалы: қалалық галереядағы жеке кескіндеме көрмесі' },
]

/** Подсказка в поле «Название» на языке интерфейса, своя для каждого типа. */
export function achievementExample(kind: AchievementKind): string {
  const k = ACHIEVEMENT_KINDS_RAW.find((x) => x.id === kind)
  return k ? L(k.example, k.exampleKk) : ''
}

export const ACHIEVEMENT_KIND_LABEL = labelMap<AchievementKind, (typeof ACHIEVEMENT_KINDS_RAW)[number]>(ACHIEVEMENT_KINDS_RAW)
export function achievementKinds() { return localize(ACHIEVEMENT_KINDS_RAW) }

export const ACHIEVEMENT_KIND_EMOJI: Record<AchievementKind, string> = Object.fromEntries(
  ACHIEVEMENT_KINDS_RAW.map((k) => [k.id, k.emoji]),
) as Record<AchievementKind, string>

/**
 * Вид достижения внутри типа.
 *
 * Масштаб («республиканский», «международный») не отвечает на вопрос, что
 * именно было сделано: школьная исследовательская работа и статья в журнале
 * могут быть одного масштаба и при этом читаются приёмной комиссией
 * совершенно по-разному. Вес здесь — множитель к весу достижения.
 */
export const ACHIEVEMENT_FORMS_RAW: {
  id: AchievementForm; kind: AchievementKind; label: string; labelKk: string; weight: number
  /** Короткое пояснение, когда из названия вида не очевидно, что это. */
  hint?: string; hintKk?: string
}[] = [
  { id: 'subject', kind: 'olympiad', label: 'Предметная олимпиада', labelKk: 'Пәндік олимпиада', weight: 1 },
  { id: 'team', kind: 'olympiad', label: 'Командная олимпиада', labelKk: 'Командалық олимпиада', weight: 0.9 },
  { id: 'tournament', kind: 'olympiad', label: 'Турнир или чемпионат', labelKk: 'Турнир немесе чемпионат', weight: 0.85 },

  { id: 'schoolWork', kind: 'research', label: 'Школьная исследовательская работа', labelKk: 'Мектептік зерттеу жұмысы', weight: 0.7 },
  { id: 'conference', kind: 'research', label: 'Доклад на конференции', labelKk: 'Конференциядағы баяндама', weight: 0.95 },
  { id: 'article', kind: 'research', label: 'Научная статья или публикация', labelKk: 'Ғылыми мақала немесе жарияланым', weight: 1.15 },
  { id: 'labProject', kind: 'research', label: 'Проект под руководством вуза или лаборатории', labelKk: 'ЖОО немесе зертхана жетекшілігіндегі жоба', weight: 1.1 },
  { id: 'patent', kind: 'research', label: 'Патент или изобретение', labelKk: 'Патент немесе өнертабыс', weight: 1.2 },

  { id: 'hackathonClassic', kind: 'hackathon', label: 'Классический, 24–48 часов', labelKk: 'Классикалық, 24–48 сағат', weight: 1,
    hint: 'прототип нон-стоп, demo и питч в конце', hintKk: 'прототип нон-стоп, соңында demo және питч' },
  { id: 'hackathonOnline', kind: 'hackathon', label: 'Онлайн или гибридный', labelKk: 'Онлайн немесе гибридті', weight: 0.9,
    hint: 'от нескольких дней до недель, работа удалённо', hintKk: 'бірнеше күннен аптаға дейін, қашықтан жұмыс' },
  { id: 'hackathonCorporate', kind: 'hackathon', label: 'Корпоративный', labelKk: 'Корпоративтік', weight: 1.05,
    hint: 'внутри компании: попасть туда школьнику дорогого стоит', hintKk: 'компания ішінде: оқушыға ол жерге кіру құнды' },
  { id: 'hackathonThematic', kind: 'hackathon', label: 'Тематический', labelKk: 'Тақырыптық', weight: 1.1,
    hint: 'узкая сфера: AI, GameDev, FinTech, инклюзия', hintKk: 'тар сала: AI, GameDev, FinTech, инклюзия' },
  { id: 'ctf', kind: 'hackathon', label: 'CTF по кибербезопасности', labelKk: 'Киберқауіпсіздік бойынша CTF', weight: 1.05,
    hint: 'поиск уязвимостей на время', hintKk: 'уақытқа қарсы осалдықтарды іздеу' },

  { id: 'competitiveProgramming', kind: 'contest', label: 'Спортивное программирование', labelKk: 'Спорттық бағдарламалау', weight: 1.15,
    hint: 'ICPC, Codeforces, олимпиады по алгоритмам', hintKk: 'ICPC, Codeforces, алгоритм олимпиадалары' },
  { id: 'researchContest', kind: 'contest', label: 'Конкурс научных работ', labelKk: 'Ғылыми жұмыстар байқауы', weight: 1.1,
    hint: 'долгая подготовка и защита перед жюри', hintKk: 'ұзақ дайындық және қазылар алдында қорғау' },
  { id: 'caseChampionship', kind: 'contest', label: 'Кейс-чемпионат', labelKk: 'Кейс-чемпионат', weight: 1,
    hint: 'разбор бизнес-задачи и презентация решения', hintKk: 'бизнес-міндетті талдау және шешімді ұсыну' },
  { id: 'startupPitch', kind: 'contest', label: 'Конкурс стартапов или питч-сессия', labelKk: 'Стартаптар байқауы немесе питч-сессия', weight: 1.05,
    hint: 'защита продукта и бизнес-модели перед инвесторами', hintKk: 'өнім мен бизнес-модельді инвесторлар алдында қорғау' },
  { id: 'debate', kind: 'contest', label: 'Дебаты или модель ООН', labelKk: 'Дебат немесе БҰҰ моделі', weight: 0.95,
    hint: 'аргументация и публичное выступление', hintKk: 'дәлелдеу және көпшілік алдында сөйлеу' },
  { id: 'robotics', kind: 'contest', label: 'Робототехника или инженерное соревнование', labelKk: 'Робототехника немесе инженерлік жарыс', weight: 1.05,
    hint: 'сборка и программирование устройства', hintKk: 'құрылғыны құрастыру және бағдарламалау' },
  { id: 'creativeContest', kind: 'contest', label: 'Творческий конкурс', labelKk: 'Шығармашылық байқау', weight: 0.9,
    hint: 'работы по дизайну, музыке, тексту, видео', hintKk: 'дизайн, музыка, мәтін, бейне бойынша жұмыстар' },

  { id: 'app', kind: 'project', label: 'Приложение, сайт или сервис', labelKk: 'Қосымша, сайт немесе сервис', weight: 1 },
  { id: 'venture', kind: 'project', label: 'Бизнес или стартап', labelKk: 'Бизнес немесе стартап', weight: 1.1 },
  { id: 'nonprofit', kind: 'project', label: 'Общественная инициатива', labelKk: 'Қоғамдық бастама', weight: 1.05 },
  { id: 'mediaProject', kind: 'project', label: 'Медиа, блог или подкаст', labelKk: 'Медиа, блог немесе подкаст', weight: 0.9 },

  { id: 'onlineCourse', kind: 'course', label: 'Онлайн-курс с сертификатом', labelKk: 'Сертификаты бар онлайн-курс', weight: 0.8 },
  { id: 'summerSchool', kind: 'course', label: 'Летняя или зимняя школа', labelKk: 'Жазғы немесе қысқы мектеп', weight: 1.05 },
  { id: 'universityProgram', kind: 'course', label: 'Программа при университете', labelKk: 'Университет жанындағы бағдарлама', weight: 1.1 },

  { id: 'regularService', kind: 'volunteer', label: 'Регулярное волонтёрство', labelKk: 'Тұрақты волонтёрлық', weight: 1.1 },
  { id: 'oneOffAction', kind: 'volunteer', label: 'Разовая акция', labelKk: 'Бір реттік акция', weight: 0.75 },
  { id: 'ownInitiative', kind: 'volunteer', label: 'Своя волонтёрская инициатива', labelKk: 'Өз волонтёрлық бастамаң', weight: 1.15 },

  { id: 'studentCouncil', kind: 'leadership', label: 'Ученический совет', labelKk: 'Оқушылар кеңесі', weight: 1 },
  { id: 'clubLead', kind: 'leadership', label: 'Руководитель клуба или сообщества', labelKk: 'Клуб немесе қауымдастық жетекшісі', weight: 1.05 },
  { id: 'teamCaptain', kind: 'leadership', label: 'Капитан команды', labelKk: 'Команда капитаны', weight: 0.95 },

  { id: 'company', kind: 'internship', label: 'Компания', labelKk: 'Компания', weight: 1 },
  { id: 'laboratory', kind: 'internship', label: 'Научная лаборатория', labelKk: 'Ғылыми зертхана', weight: 1.15 },
  { id: 'ngo', kind: 'internship', label: 'Фонд или НКО', labelKk: 'Қор немесе үкіметтік емес ұйым', weight: 0.95 },

  { id: 'competition', kind: 'sport', label: 'Соревнования', labelKk: 'Жарыстар', weight: 1 },
  { id: 'nationalTeam', kind: 'sport', label: 'Сборная', labelKk: 'Құрама', weight: 1.1 },
  { id: 'rank', kind: 'sport', label: 'Спортивный разряд', labelKk: 'Спорттық разряд', weight: 0.9 },

  { id: 'exhibition', kind: 'art', label: 'Выставка или показ', labelKk: 'Көрме немесе көрсетілім', weight: 1.05 },
  { id: 'performance', kind: 'art', label: 'Выступление или концерт', labelKk: 'Өнер көрсету немесе концерт', weight: 1 },
  { id: 'publication', kind: 'art', label: 'Публикация работы', labelKk: 'Жұмыстың жариялануы', weight: 1.05 },
]

export const ACHIEVEMENT_FORM_LABEL = labelMap<AchievementForm, (typeof ACHIEVEMENT_FORMS_RAW)[number]>(ACHIEVEMENT_FORMS_RAW)

export const ACHIEVEMENT_FORM_WEIGHT: Record<AchievementForm, number> = Object.fromEntries(
  ACHIEVEMENT_FORMS_RAW.map((f) => [f.id, f.weight]),
) as Record<AchievementForm, number>

/** Виды, доступные для выбранного типа достижения, на языке интерфейса. */
export function achievementForms(kind: AchievementKind) {
  return localize(ACHIEVEMENT_FORMS_RAW.filter((f) => f.kind === kind))
}

export const ACHIEVEMENT_LEVELS_RAW: {
  id: AchievementLevel; label: string; labelKk: string; weight: number
}[] = [
  { id: 'school', label: 'Школьный', labelKk: 'Мектептік', weight: 0.2 },
  { id: 'city', label: 'Городской', labelKk: 'Қалалық', weight: 0.4 },
  { id: 'region', label: 'Областной', labelKk: 'Облыстық', weight: 0.6 },
  { id: 'national', label: 'Республиканский', labelKk: 'Республикалық', weight: 0.85 },
  { id: 'international', label: 'Международный', labelKk: 'Халықаралық', weight: 1 },
]

/**
 * Как называется масштаб в контексте конкретного типа.
 *
 * «Школьный уровень» ничего не говорит про хакатон, а «до 100 участников,
 * внутри вуза или города» — говорит. Значение уровня и его вес при этом
 * не меняются: меняется только подпись, которую человек читает.
 */
const LEVEL_LABEL_BY_KIND: Partial<Record<AchievementKind, Partial<Record<AchievementLevel, [string, string]>>>> = {
  hackathon: {
    school: ['Локальный: внутри школы или вуза', 'Жергілікті: мектеп немесе ЖОО ішінде'],
    city: ['Городской: до 100 участников', 'Қалалық: 100 қатысушыға дейін'],
    region: ['Областной или межвузовский', 'Облыстық немесе ЖОО аралық'],
    national: ['Национальный: от 300 участников, крупные спонсоры', 'Ұлттық: 300 қатысушыдан, ірі демеушілер'],
    international: ['Глобальный: тысячи участников из разных стран', 'Жаһандық: түрлі елден мыңдаған қатысушы'],
  },
  contest: {
    school: ['Институциональный: внутри школы или вуза', 'Институционалдық: мектеп немесе ЖОО ішінде'],
    city: ['Городской отбор', 'Қалалық іріктеу'],
    region: ['Региональный или областной', 'Аймақтық немесе облыстық'],
    national: ['Республиканский: главные состязания страны', 'Республикалық: елдегі басты жарыстар'],
    international: ['Международный: десятки стран', 'Халықаралық: ондаған ел'],
  },
  research: {
    school: ['Школьная конференция', 'Мектеп конференциясы'],
    city: ['Городская конференция', 'Қалалық конференция'],
    region: ['Областная конференция', 'Облыстық конференция'],
    national: ['Республиканский конкурс или журнал', 'Республикалық байқау немесе журнал'],
    international: ['Международная конференция или журнал', 'Халықаралық конференция немесе журнал'],
  },
  internship: {
    school: ['Внутри школы', 'Мектеп ішінде'],
    city: ['Местная организация', 'Жергілікті ұйым'],
    region: ['Крупная организация региона', 'Аймақтағы ірі ұйым'],
    national: ['Известная компания или вуз страны', 'Елге белгілі компания немесе ЖОО'],
    international: ['Международная компания или лаборатория', 'Халықаралық компания немесе зертхана'],
  },
}

/** Варианты масштаба с подписями под выбранный тип достижения. */
export function achievementLevels(kind?: AchievementKind) {
  const overrides = kind ? LEVEL_LABEL_BY_KIND[kind] : undefined
  return ACHIEVEMENT_LEVELS_RAW.map((l) => {
    const pair = overrides?.[l.id]
    return { id: l.id, label: pair ? L(pair[0], pair[1]) : L(l.label, l.labelKk) }
  })
}

export const ACHIEVEMENT_LEVEL_LABEL = labelMap<AchievementLevel, (typeof ACHIEVEMENT_LEVELS_RAW)[number]>(ACHIEVEMENT_LEVELS_RAW)

export const ACHIEVEMENT_LEVEL_WEIGHT: Record<AchievementLevel, number> = Object.fromEntries(
  ACHIEVEMENT_LEVELS_RAW.map((l) => [l.id, l.weight]),
) as Record<AchievementLevel, number>

export const ACHIEVEMENT_AWARDS_RAW: {
  id: AchievementAward; label: string; labelKk: string; weight: number
}[] = [
  { id: 'participant', label: 'Участие', labelKk: 'Қатысу', weight: 0.45 },
  { id: 'finalist', label: 'Финалист', labelKk: 'Финалист', weight: 0.7 },
  { id: 'bronze', label: '3 место', labelKk: '3-орын', weight: 0.85 },
  { id: 'silver', label: '2 место', labelKk: '2-орын', weight: 0.93 },
  { id: 'gold', label: '1 место', labelKk: '1-орын', weight: 1 },
]

export const ACHIEVEMENT_AWARD_LABEL = labelMap<AchievementAward, (typeof ACHIEVEMENT_AWARDS_RAW)[number]>(ACHIEVEMENT_AWARDS_RAW)
export function achievementAwards() { return localize(ACHIEVEMENT_AWARDS_RAW) }

export const ACHIEVEMENT_AWARD_WEIGHT: Record<AchievementAward, number> = Object.fromEntries(
  ACHIEVEMENT_AWARDS_RAW.map((a) => [a.id, a.weight]),
) as Record<AchievementAward, number>

/** Какие виды достижений сильнее всего усиливают заявку по направлению. */
export const FIELD_ACHIEVEMENTS: Record<FieldId, AchievementKind[]> = {
  it: ['hackathon', 'project', 'olympiad', 'course'],
  engineering: ['contest', 'project', 'olympiad', 'internship'],
  medicine: ['volunteer', 'research', 'olympiad', 'internship'],
  business: ['contest', 'project', 'leadership', 'internship'],
  economics: ['olympiad', 'research', 'contest', 'course'],
  design: ['project', 'art', 'contest', 'course'],
  law: ['contest', 'volunteer', 'leadership', 'research'],
  social: ['volunteer', 'leadership', 'research', 'contest'],
  science: ['olympiad', 'research', 'project', 'course'],
  media: ['project', 'art', 'internship', 'volunteer'],
  education: ['volunteer', 'leadership', 'course', 'project'],
  agro: ['research', 'project', 'volunteer', 'course'],
}

export const TONES_RAW: { id: ToneId; label: string; labelKk: string; hint: string; hintKk: string; emoji: string }[] = [
  { id: 'friendly', label: 'По-дружески', labelKk: 'Достарша', hint: 'просто и тепло, как со старшим другом', hintKk: 'қарапайым әрі жылы, үлкен достай', emoji: '🙂' },
  { id: 'mentor', label: 'Наставник', labelKk: 'Тәлімгер', hint: 'спокойно объясняет, почему именно так', hintKk: 'неге дәл солай екенін байсалды түсіндіреді', emoji: '🧭' },
  { id: 'coach', label: 'Коуч', labelKk: 'Коуч', hint: 'коротко и энергично, подталкивает к действию', hintKk: 'қысқа әрі қуатты, әрекетке итермелейді', emoji: '⚡' },
  { id: 'formal', label: 'Официально', labelKk: 'Ресми', hint: 'сухо и по делу, без лишних слов', hintKk: 'құрғақ әрі нақты, артық сөзсіз', emoji: '📋' },
]

export const TONE_LABEL = labelMap<ToneId, (typeof TONES_RAW)[number]>(TONES_RAW)
export function tones() { return localize(TONES_RAW) }
