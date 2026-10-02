export const MIN_PASSWORD_LENGTH = 6

const USERNAME_RE = /^[a-z0-9._-]{3,30}$/

export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase()
}

export function isValidUsername(input: string): boolean {
  return USERNAME_RE.test(normalizeUsername(input))
}

export function roleLabel(role: 'driver' | 'admin'): string {
  return role === 'admin' ? 'Encargado' : 'Repartidor'
}
