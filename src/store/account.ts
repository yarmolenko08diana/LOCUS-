/**
 * Локальный аккаунт.
 *
 * Qadam раздаётся как статика, без сервера: писем, синхронизации между
 * устройствами и восстановления пароля по почте здесь физически быть не может.
 * Поэтому аккаунт живёт в браузере, а интерфейс об этом прямо говорит — это
 * честнее, чем рисовать вход, который выглядит настоящим и ничего не хранит.
 *
 * Пароль не хранится: в localStorage лежит только соль и SHA-256 от «соль +
 * пароль». Проверить вход этого достаточно, а прочитать пароль из хранилища —
 * уже нет.
 */

const KEY = 'qadam.account.v1'

export interface Account {
  email: string
  /** Соль в hex: своя у каждого аккаунта. */
  salt: string
  /** SHA-256 от соли и пароля, в hex. */
  hash: string
  firstName: string
  lastName: string
  /** Год рождения, четыре цифры. */
  birthYear?: number
  /** Аватар как data:URL, уменьшенный до 128×128. */
  avatar?: string
  createdAt: string
}

/** Что видно в интерфейсе: без соли и хеша. */
export type AccountView = Omit<Account, 'salt' | 'hash'>

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function newSalt(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return toHex(bytes.buffer)
}

export async function hashPassword(salt: string, password: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`)
  return toHex(await crypto.subtle.digest('SHA-256', data))
}

export function loadAccount(): Account | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Account) : null
  } catch {
    // Приватный режим или повреждённые данные: продолжаем без аккаунта.
    return null
  }
}

export function saveAccount(account: Account): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(account))
  } catch {
    /* Сохранить не удалось — вход просто не переживёт перезагрузку. */
  }
}

export function clearAccount(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* no-op */
  }
}

export function view(account: Account): AccountView {
  const { salt: _salt, hash: _hash, ...rest } = account
  return rest
}

/** Как обращаться к человеку: имя из аккаунта важнее имени из анкеты. */
export function displayName(account: AccountView | null, fallback: string): string {
  const name = account?.firstName?.trim()
  return name && name.length > 0 ? name : fallback
}

/** Инициалы для аватара-заглушки. */
export function initials(account: AccountView): string {
  const a = account.firstName?.trim()?.[0] ?? ''
  const b = account.lastName?.trim()?.[0] ?? ''
  const both = `${a}${b}`.toLocaleUpperCase('ru')
  return both || account.email.slice(0, 1).toLocaleUpperCase('ru')
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}

/**
 * Аватар уменьшается до 128×128 и пережимается в JPEG: в localStorage
 * помещается около пяти мегабайт на весь домен, и оригинал с камеры
 * телефона вытеснил бы оттуда и анкету, и прогресс по плану.
 */
export function readAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('read failed'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('decode failed'))
      img.onload = () => {
        const size = 128
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('no canvas'))
        const side = Math.min(img.width, img.height)
        ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}
