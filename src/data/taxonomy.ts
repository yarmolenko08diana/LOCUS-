import type {
  BudgetTier, CountryCode, EnglishLevel, ExamId, FieldId,
  LanguageCode, Priority, Stage,
} from '../types'

export const FIELDS: { id: FieldId; label: string; hint: string; emoji: string }[] = [
  { id: 'it', label: 'IT и данные', hint: 'разработка, ИИ, кибербезопасность', emoji: '💻' },
  { id: 'engineering', label: 'Инженерия', hint: 'нефтегаз, робототехника, строительство', emoji: '⚙️' },
  { id: 'medicine', label: 'Медицина', hint: 'лечебное дело, фармация, биомед', emoji: '🩺' },
  { id: 'business', label: 'Бизнес', hint: 'менеджмент, маркетинг, предпринимательство', emoji: '📈' },
  { id: 'economics', label: 'Экономика и финансы', hint: 'финансы, аналитика, банкинг', emoji: '🏦' },
  { id: 'design', label: 'Дизайн и архитектура', hint: 'UX, графика, среда', emoji: '🎨' },
  { id: 'law', label: 'Право', hint: 'юриспруденция, международное право', emoji: '⚖️' },
  { id: 'social', label: 'Общество и политика', hint: 'международные отношения, психология', emoji: '🌍' },
  { id: 'science', label: 'Наука', hint: 'математика, физика, химия, биология', emoji: '🔬' },
  { id: 'media', label: 'Медиа', hint: 'журналистика, кино, digital', emoji: '🎬' },
  { id: 'education', label: 'Образование', hint: 'педагогика, языки', emoji: '📚' },
  { id: 'agro', label: 'Агро и экология', hint: 'агрономия, экология, устойчивое развитие', emoji: '🌱' },
]

export const FIELD_LABEL: Record<FieldId, string> = Object.fromEntries(
  FIELDS.map((f) => [f.id, f.label]),
) as Record<FieldId, string>

export const COUNTRIES: { code: CountryCode; label: string; flag: string; note: string }[] = [
  { code: 'KZ', label: 'Казахстан', flag: '🇰🇿', note: 'дом, грант ЕНТ' },
  { code: 'RU', label: 'Россия', flag: '🇷🇺', note: 'русский язык, квоты' },
  { code: 'TR', label: 'Турция', flag: '🇹🇷', note: 'стипендия Türkiye Bursları' },
  { code: 'CZ', label: 'Чехия', flag: '🇨🇿', note: 'бесплатно на чешском' },
  { code: 'PL', label: 'Польша', flag: '🇵🇱', note: 'недорого, ЕС' },
  { code: 'HU', label: 'Венгрия', flag: '🇭🇺', note: 'Stipendium Hungaricum' },
  { code: 'DE', label: 'Германия', flag: '🇩🇪', note: 'почти без платы за обучение' },
  { code: 'NL', label: 'Нидерланды', flag: '🇳🇱', note: 'англоязычный бакалавриат' },
  { code: 'IT', label: 'Италия', flag: '🇮🇹', note: 'низкая плата, стипендии' },
  { code: 'GB', label: 'Великобритания', flag: '🇬🇧', note: 'топ-рейтинги, дорого' },
  { code: 'US', label: 'США', flag: '🇺🇸', note: 'financial aid, SAT' },
  { code: 'AE', label: 'ОАЭ', flag: '🇦🇪', note: 'кампусы вузов, английский' },
  { code: 'CN', label: 'Китай', flag: '🇨🇳', note: 'CSC-стипендии' },
  { code: 'KR', label: 'Южная Корея', flag: '🇰🇷', note: 'GKS-стипендии' },
  { code: 'MY', label: 'Малайзия', flag: '🇲🇾', note: 'дёшево, английский' },
]

export const COUNTRY_LABEL: Record<CountryCode, string> = Object.fromEntries(
  COUNTRIES.map((c) => [c.code, c.label]),
) as Record<CountryCode, string>

export const COUNTRY_FLAG: Record<CountryCode, string> = Object.fromEntries(
  COUNTRIES.map((c) => [c.code, c.flag]),
) as Record<CountryCode, string>

export const LANGUAGES: { code: LanguageCode; label: string }[] = [
  { code: 'kk', label: 'Казахский' },
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'Английский' },
  { code: 'tr', label: 'Турецкий' },
  { code: 'de', label: 'Немецкий' },
]

export const LANGUAGE_LABEL: Record<LanguageCode, string> = Object.fromEntries(
  LANGUAGES.map((l) => [l.code, l.label]),
) as Record<LanguageCode, string>

export const ENGLISH_LEVELS: { id: EnglishLevel; label: string; hint: string }[] = [
  { id: 'none', label: 'Почти нет', hint: 'пока не использую' },
  { id: 'a2', label: 'A2', hint: 'базовый' },
  { id: 'b1', label: 'B1', hint: 'понимаю и говорю' },
  { id: 'b2', label: 'B2', hint: 'учусь и читаю свободно' },
  { id: 'c1', label: 'C1+', hint: 'уровень выше среднего' },
]

export const ENGLISH_RANK: Record<EnglishLevel, number> = {
  none: 0, a2: 1, b1: 2, b2: 3, c1: 4,
}

/** Ориентировочное соответствие уровня и балла IELTS для оценки шансов. */
export const ENGLISH_TO_IELTS: Record<EnglishLevel, number> = {
  none: 0, a2: 4, b1: 5, b2: 6.5, c1: 7.5,
}

export const STAGES: { id: Stage; label: string; hint: string }[] = [
  { id: 'grade9', label: '9 класс', hint: 'есть 2–3 года на подготовку' },
  { id: 'grade10', label: '10 класс', hint: 'год на экзамены и портфолио' },
  { id: 'grade11', label: '11 класс', hint: 'подача уже в этом цикле' },
  { id: 'graduate', label: 'Выпускник', hint: 'год перерыва или пересдача' },
]

export const STAGE_LABEL: Record<Stage, string> = Object.fromEntries(
  STAGES.map((s) => [s.id, s.label]),
) as Record<Stage, string>

/** Сколько лет до подачи документов от текущего этапа. */
export const STAGE_YEARS_TO_APPLY: Record<Stage, number> = {
  grade9: 2, grade10: 1, grade11: 0, graduate: 0,
}

export const BUDGETS: { id: BudgetTier; label: string; hint: string; max: number }[] = [
  { id: 'grant-only', label: 'Только грант', hint: 'платить за обучение не получится', max: 0 },
  { id: 'upto2k', label: 'До $2 000 в год', hint: 'небольшой бюджет семьи', max: 2000 },
  { id: 'upto6k', label: 'До $6 000 в год', hint: 'средний бюджет', max: 6000 },
  { id: 'upto15k', label: 'До $15 000 в год', hint: 'зарубежные программы реальны', max: 15000 },
  { id: 'above15k', label: 'Больше $15 000', hint: 'бюджет почти не ограничивает', max: 60000 },
]

export const BUDGET_MAX: Record<BudgetTier, number> = Object.fromEntries(
  BUDGETS.map((b) => [b.id, b.max]),
) as Record<BudgetTier, number>

export const BUDGET_LABEL: Record<BudgetTier, string> = Object.fromEntries(
  BUDGETS.map((b) => [b.id, b.label]),
) as Record<BudgetTier, string>

export const PRIORITIES: { id: Priority; label: string; hint: string }[] = [
  { id: 'cost', label: 'Низкая стоимость', hint: 'грант или минимальная плата' },
  { id: 'prestige', label: 'Сильный вуз', hint: 'имя и рейтинг важны' },
  { id: 'employability', label: 'Работа после выпуска', hint: 'практика и трудоустройство' },
  { id: 'closeToHome', label: 'Ближе к дому', hint: 'не хочу далеко уезжать' },
  { id: 'community', label: 'Среда и сообщество', hint: 'студенческая жизнь, люди' },
]

export const PRIORITY_LABEL: Record<Priority, string> = Object.fromEntries(
  PRIORITIES.map((p) => [p.id, p.label]),
) as Record<Priority, string>

export const EXAMS: { id: ExamId; label: string; hint: string }[] = [
  { id: 'ent', label: 'ЕНТ', hint: 'нужен для грантов Казахстана' },
  { id: 'ielts', label: 'IELTS', hint: 'английский для зарубежных программ' },
  { id: 'sat', label: 'SAT', hint: 'США и часть международных вузов' },
  { id: 'toefl', label: 'TOEFL', hint: 'альтернатива IELTS' },
  { id: 'localExam', label: 'Экзамен вуза', hint: 'внутренний экзамен или собеседование' },
  { id: 'portfolio', label: 'Портфолио', hint: 'дизайн, архитектура, медиа' },
]

export const EXAM_LABEL: Record<ExamId, string> = Object.fromEntries(
  EXAMS.map((e) => [e.id, e.label]),
) as Record<ExamId, string>

export const SUBJECTS = [
  'Математика', 'Физика', 'Информатика', 'Химия', 'Биология',
  'История', 'География', 'Английский', 'Казахский язык', 'Русский язык',
  'Литература', 'Право', 'Экономика', 'Черчение и рисунок',
]

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
