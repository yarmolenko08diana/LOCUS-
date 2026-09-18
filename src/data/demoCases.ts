import type { Profile } from '../types'
import { L } from '../i18n/lang'

/**
 * Готовые примеры для демонстрации без заполнения анкеты.
 *
 * Один пример показывает только один сценарий, а продукт должен честно
 * работать и для сильного, и для среднего, и для слабого профиля. Три случая
 * рядом дают увидеть, что меняется в рекомендациях, оценке шансов и плане,
 * когда меняются баллы, язык, бюджет и достижения.
 */
export interface DemoCase {
  id: 'high' | 'medium' | 'low'
  /** Короткая подпись случая. */
  title: string
  titleKk: string
  /** Кто это и в какой точке находится. */
  summary: string
  summaryKk: string
  /** Что в этом профиле определяет исход. */
  driver: string
  driverKk: string
  profile: Profile
}

const year = new Date().getFullYear()

export const DEMO_CASES: DemoCase[] = [
  {
    id: 'high',
    title: 'Высокие шансы',
    titleKk: 'Жоғары мүмкіндік',
    summary: 'Аружан, 11 класс НИШ. Сильные баллы, IELTS 7.5 и победы на международном уровне.',
    summaryKk: 'Аружан, НЗМ 11-сынып. Күшті баллдар, IELTS 7.5 және халықаралық деңгейдегі жеңістер.',
    driver: 'Заявку читают целиком, поэтому олимпиады и исследование поднимают вузы с гибким приёмом.',
    driverKk: 'Өтінім тұтас оқылады, сондықтан олимпиадалар мен зерттеу икемді қабылдауы бар ЖОО-ны көтереді.',
    profile: {
      name: 'Аружан',
      stage: 'grade11',
      fields: ['it', 'science'],
      schoolSystem: 'nis',
      gpa: 4.9,
      strongSubjects: ['Математика', 'Информатика', 'Физика'],
      languages: ['kk', 'ru', 'en'],
      english: 'c1',
      exams: { ent: 132, nis: 94, ielts: 7.5, sat: 1480, planned: ['ent', 'ielts', 'sat'] },
      achievements: [
        { id: 'high-1', kind: 'olympiad', form: 'subject', level: 'international', award: 'silver', title: 'Международная олимпиада по информатике', year },
        { id: 'high-2', kind: 'research', form: 'labProject', level: 'national', award: 'gold', title: 'Республиканский конкурс научных проектов', year: year - 1 },
        { id: 'high-3', kind: 'hackathon', form: 'hackathonClassic', level: 'national', award: 'finalist', title: 'Финал республиканского хакатона', year },
        { id: 'high-4', kind: 'leadership', form: 'studentCouncil', level: 'school', award: 'participant', title: 'Президент школьного совета', year, hours: 120 },
      ],
      countries: ['KZ', 'SG', 'GB', 'HK'],
      relocation: true,
      budget: 'above15k',
      intakeYear: year + 1,
      priorities: ['prestige', 'employability'],
    },
  },
  {
    id: 'medium',
    title: 'Средние шансы',
    titleKk: 'Орташа мүмкіндік',
    summary: 'Дамир, 11 класс обычной школы. Баллы нормальные, английский на B1, бюджет ограничен.',
    summaryKk: 'Дәмір, қарапайым мектептің 11-сыныбы. Баллдары қалыпты, ағылшыны B1, бюджеті шектеулі.',
    driver: 'Всё решают язык и деньги: подтянуть IELTS и найти грант важнее, чем добавить ещё одну олимпиаду.',
    driverKk: 'Бәрін тіл мен ақша шешеді: IELTS-ті көтеру және грант табу тағы бір олимпиададан маңызды.',
    profile: {
      name: 'Дамир',
      stage: 'grade11',
      fields: ['engineering', 'it'],
      schoolSystem: 'kz',
      gpa: 4.3,
      strongSubjects: ['Математика', 'Физика'],
      languages: ['kk', 'ru'],
      english: 'b1',
      exams: { ent: 104, planned: ['ent', 'ielts'] },
      achievements: [
        { id: 'med-1', kind: 'olympiad', form: 'subject', level: 'city', award: 'bronze', title: 'Городская олимпиада по физике', year: year - 1 },
        { id: 'med-2', kind: 'volunteer', form: 'regularService', level: 'school', award: 'participant', title: 'Помощь в школьной робототехнической секции', year, hours: 40 },
      ],
      countries: ['KZ', 'TR', 'CZ', 'HU'],
      relocation: true,
      budget: 'upto6k',
      intakeYear: year + 1,
      priorities: ['cost', 'employability'],
    },
  },
  {
    id: 'low',
    title: 'Низкие шансы',
    titleKk: 'Төмен мүмкіндік',
    summary: 'Әсем, 10 класс. Баллы пока слабые, английского почти нет, платить за учёбу семья не может.',
    summaryKk: 'Әсем, 10-сынып. Баллдары әзірге әлсіз, ағылшын тілі жоқтың қасы, отбасы оқу ақысын төлей алмайды.',
    driver: 'Год в запасе — это главный ресурс: план начинается с языка и подготовки к ЕНТ, а не с подачи документов.',
    driverKk: 'Қордағы бір жыл — басты ресурс: жоспар құжат тапсырудан емес, тіл мен ҰБТ дайындығынан басталады.',
    profile: {
      name: 'Әсем',
      stage: 'grade10',
      fields: ['business', 'social'],
      schoolSystem: 'kz',
      gpa: 3.6,
      strongSubjects: ['История'],
      languages: ['kk', 'ru'],
      english: 'a2',
      exams: { planned: ['ent'] },
      achievements: [],
      countries: ['KZ'],
      relocation: false,
      budget: 'grant-only',
      intakeYear: year + 2,
      priorities: ['cost', 'closeToHome'],
    },
  },
]

export function demoCase(id: DemoCase['id']): DemoCase {
  return DEMO_CASES.find((c) => c.id === id) ?? DEMO_CASES[1]
}

/** Подпись случая на языке интерфейса. */
export function demoTitle(c: DemoCase): string {
  return L(c.title, c.titleKk)
}
