import type {
  AchievementAward, AchievementKind, AchievementLevel, BudgetTier, CountryCode,
  EnglishLevel, ExamId, FieldId, LanguageCode, Priority, SchoolSystem, Stage, ToneId,
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
  { code: 'JP', label: 'Япония', flag: '🇯🇵', note: 'стипендия MEXT, программы на английском' },
  { code: 'SG', label: 'Сингапур', flag: '🇸🇬', note: 'MOE Tuition Grant, сильные вузы' },
  { code: 'HK', label: 'Гонконг (Китай)', flag: '🇭🇰', note: 'английский, стипендии вузов' },
  { code: 'GE', label: 'Грузия', flag: '🇬🇪', note: 'безвизовый въезд, недорого' },
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
  { code: 'cs', label: 'Чешский' },
  { code: 'pl', label: 'Польский' },
  { code: 'hu', label: 'Венгерский' },
  { code: 'it', label: 'Итальянский' },
  { code: 'zh', label: 'Китайский' },
  { code: 'ko', label: 'Корейский' },
  { code: 'ja', label: 'Японский' },
  { code: 'ka', label: 'Грузинский' },
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
  { id: 'ib', label: 'IB Diploma', hint: 'международный диплом, принимают напрямую' },
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

export const SCHOOL_SYSTEMS: { id: SchoolSystem; label: string; hint: string }[] = [
  { id: 'kz', label: 'Обычная школа', hint: 'аттестат по 5-балльной шкале' },
  { id: 'nis', label: 'НИШ', hint: 'итоговый балл по 100-балльной шкале' },
  { id: 'ib', label: 'IB', hint: 'диплом International Baccalaureate, 24–45' },
  { id: 'other', label: 'Другая система', hint: 'колледж, зарубежная школа, экстернат' },
]

export const SCHOOL_SYSTEM_LABEL: Record<SchoolSystem, string> = Object.fromEntries(
  SCHOOL_SYSTEMS.map((s) => [s.id, s.label]),
) as Record<SchoolSystem, string>

export const ACHIEVEMENT_KINDS: {
  id: AchievementKind; label: string; hint: string; emoji: string
}[] = [
  { id: 'olympiad', label: 'Олимпиада', emoji: '🥇', hint: 'предметная олимпиада или турнир' },
  { id: 'research', label: 'Исследование', emoji: '🔬', hint: 'научный проект, статья, конференция' },
  { id: 'hackathon', label: 'Хакатон', emoji: '💻', hint: 'командная разработка за выходные' },
  { id: 'contest', label: 'Конкурс или соревнование', emoji: '🏆', hint: 'кейс-чемпионат, дебаты, робототехника' },
  { id: 'project', label: 'Свой проект', emoji: '🚀', hint: 'приложение, сайт, инициатива' },
  { id: 'course', label: 'Курс с сертификатом', emoji: '📜', hint: 'онлайн-курс или программа' },
  { id: 'volunteer', label: 'Волонтёрство', emoji: '🤝', hint: 'помощь фондам и сообществу' },
  { id: 'leadership', label: 'Лидерство', emoji: '🧭', hint: 'ученический совет, клуб, команда' },
  { id: 'internship', label: 'Стажировка', emoji: '🏢', hint: 'работа или практика в организации' },
  { id: 'sport', label: 'Спорт', emoji: '🏅', hint: 'разряд, сборная, соревнования' },
  { id: 'art', label: 'Творчество', emoji: '🎭', hint: 'музыка, театр, изобразительное искусство' },
]

export const ACHIEVEMENT_KIND_LABEL: Record<AchievementKind, string> = Object.fromEntries(
  ACHIEVEMENT_KINDS.map((k) => [k.id, k.label]),
) as Record<AchievementKind, string>

export const ACHIEVEMENT_KIND_EMOJI: Record<AchievementKind, string> = Object.fromEntries(
  ACHIEVEMENT_KINDS.map((k) => [k.id, k.emoji]),
) as Record<AchievementKind, string>

export const ACHIEVEMENT_LEVELS: { id: AchievementLevel; label: string; weight: number }[] = [
  { id: 'school', label: 'Школьный', weight: 0.2 },
  { id: 'city', label: 'Городской', weight: 0.4 },
  { id: 'region', label: 'Областной', weight: 0.6 },
  { id: 'national', label: 'Республиканский', weight: 0.85 },
  { id: 'international', label: 'Международный', weight: 1 },
]

export const ACHIEVEMENT_LEVEL_LABEL: Record<AchievementLevel, string> = Object.fromEntries(
  ACHIEVEMENT_LEVELS.map((l) => [l.id, l.label]),
) as Record<AchievementLevel, string>

export const ACHIEVEMENT_LEVEL_WEIGHT: Record<AchievementLevel, number> = Object.fromEntries(
  ACHIEVEMENT_LEVELS.map((l) => [l.id, l.weight]),
) as Record<AchievementLevel, number>

export const ACHIEVEMENT_AWARDS: { id: AchievementAward; label: string; weight: number }[] = [
  { id: 'participant', label: 'Участие', weight: 0.45 },
  { id: 'finalist', label: 'Финалист', weight: 0.7 },
  { id: 'bronze', label: '3 место', weight: 0.85 },
  { id: 'silver', label: '2 место', weight: 0.93 },
  { id: 'gold', label: '1 место', weight: 1 },
]

export const ACHIEVEMENT_AWARD_LABEL: Record<AchievementAward, string> = Object.fromEntries(
  ACHIEVEMENT_AWARDS.map((a) => [a.id, a.label]),
) as Record<AchievementAward, string>

export const ACHIEVEMENT_AWARD_WEIGHT: Record<AchievementAward, number> = Object.fromEntries(
  ACHIEVEMENT_AWARDS.map((a) => [a.id, a.weight]),
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

export const TONES: { id: ToneId; label: string; hint: string; emoji: string }[] = [
  { id: 'friendly', label: 'По-дружески', hint: 'просто и тепло, как со старшим другом', emoji: '🙂' },
  { id: 'mentor', label: 'Наставник', hint: 'спокойно объясняет, почему именно так', emoji: '🧭' },
  { id: 'coach', label: 'Коуч', hint: 'коротко и энергично, подталкивает к действию', emoji: '⚡' },
  { id: 'formal', label: 'Официально', hint: 'сухо и по делу, без лишних слов', emoji: '📋' },
]

export const TONE_LABEL: Record<ToneId, string> = Object.fromEntries(
  TONES.map((t) => [t.id, t.label]),
) as Record<ToneId, string>
