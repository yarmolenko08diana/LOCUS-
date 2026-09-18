import type { Program } from '../../types'
import { KZ_PROGRAMS } from './kz'
import { CIS_PROGRAMS } from './cis'
import { TURKIYE_GULF_PROGRAMS } from './turkiyeGulf'
import { EUROPE_PROGRAMS } from './europe'
import { ASIA_PROGRAMS } from './asia'
import { AMERICAS_PROGRAMS } from './americas'

/**
 * ДЕМОНСТРАЦИОННЫЕ ДАННЫЕ.
 *
 * Стоимость, пороги и периоды подачи собраны как учебный набор для прототипа и
 * округлены. Ни одно значение нельзя считать подтверждённым требованием вуза:
 * у каждой программы есть ссылка на официальную страницу приёма, и интерфейс
 * везде показывает пометку «демо-данные». Перед реальной подачей документов
 * данные нужно сверять с источником.
 */
export const DATA_DISCLAIMER =
  'Демо-данные: цифры округлены и приведены для прототипа. Сверяйте с официальным сайтом вуза.'

export const PROGRAMS: Program[] = [
  ...KZ_PROGRAMS,
  ...CIS_PROGRAMS,
  ...TURKIYE_GULF_PROGRAMS,
  ...EUROPE_PROGRAMS,
  ...ASIA_PROGRAMS,
  ...AMERICAS_PROGRAMS,
]
