import type { Diagnosis, Profile } from '../types'

/**
 * Необязательный слой LLM.
 *
 * Архитектурное решение: вся логика подбора, объяснений и плана — детерминированная
 * и объяснимая (см. engine/match.ts). LLM здесь не принимает решений и не выдумывает
 * фактов: он получает уже готовую диагностику и только переписывает её более живым
 * языком. Если слой выключен, недоступен, отвечает медленно или ошибкой —
 * пользователь видит исходный текст движка, и сценарий не ломается.
 *
 * Ключ на клиенте не хранится: VITE_LLM_ENDPOINT указывает на серверный прокси.
 */

const ENABLED = import.meta.env.VITE_LLM_ENABLED === 'true'
const ENDPOINT = import.meta.env.VITE_LLM_ENDPOINT ?? ''
const TIMEOUT_MS = 6000

export interface RephraseResult {
  text: string
  /** Откуда взят текст: движок или языковая модель. Показывается пользователю. */
  source: 'engine' | 'llm'
}

export function llmAvailable(): boolean {
  return ENABLED && ENDPOINT.length > 0
}

/**
 * Просит модель переформулировать резюме профиля. Факты передаются готовыми,
 * модель не должна добавлять новые: это единственный способ не получить
 * выдуманные баллы и дедлайны в тексте для абитуриента.
 */
export async function rephraseDiagnosis(
  profile: Profile,
  diagnosis: Diagnosis,
): Promise<RephraseResult> {
  const fallback: RephraseResult = { text: diagnosis.summary, source: 'engine' }
  if (!llmAvailable()) return fallback

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        task: 'rephrase-admission-diagnosis',
        language: 'ru',
        constraints: [
          'Не добавляй факты, которых нет во входных данных',
          'Не обещай поступление и не называй вероятностей',
          'Максимум три предложения, обращение на «ты»',
        ],
        facts: {
          stage: profile.stage,
          goal: diagnosis.goal,
          strengths: diagnosis.strengths,
          constraints: diagnosis.constraints,
          summary: diagnosis.summary,
        },
      }),
    })

    if (!response.ok) return fallback
    const data: unknown = await response.json()
    const text = (data as { text?: unknown })?.text
    if (typeof text !== 'string' || text.trim().length < 20) return fallback
    return { text: text.trim(), source: 'llm' }
  } catch {
    // Таймаут, офлайн или недоступный прокси — показываем текст движка.
    return fallback
  } finally {
    window.clearTimeout(timer)
  }
}
