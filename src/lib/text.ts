/** Русское склонение числительных: plural(2, 'программа', 'программы', 'программ'). */
export function plural(n: number, one: string, few: string, many: string): string {
  const mod100 = Math.abs(n) % 100
  const mod10 = mod100 % 10
  if (mod100 >= 11 && mod100 <= 14) return many
  if (mod10 === 1) return one
  if (mod10 >= 2 && mod10 <= 4) return few
  return many
}

export function countOf(n: number, one: string, few: string, many: string): string {
  return `${n} ${plural(n, one, few, many)}`
}

/** Перечисление с союзом «и» вместо последней запятой. */
export function listOf(items: string[], max = 3): string {
  const cut = items.slice(0, max)
  if (cut.length === 0) return ''
  if (cut.length === 1) return cut[0]
  return cut.slice(0, -1).join(', ') + ' и ' + cut[cut.length - 1]
}

/** Строчная первая буква, но только если слово не начинается с заглавной аббревиатуры. */
export function softLower(s: string): string {
  if (s.length > 1 && s[0] === s[0].toUpperCase() && s[1] === s[1].toUpperCase()) return s
  return s[0].toLowerCase() + s.slice(1)
}
