export const USER_EMAIL_DOMAIN = 'reparto.local'

export function usernameToEmail(input: string): string {
  const clean = input.trim().toLowerCase()
  return clean.includes('@') ? clean : `${clean}@${USER_EMAIL_DOMAIN}`
}
