// Las cuentas viven en Supabase Auth como <usuario>@reparto.local.
// Si lo tecleado ya trae @, se usa tal cual (admin original con su email real).
export const DOMINIO_USUARIOS = 'reparto.local'

export function usuarioAEmail(texto: string): string {
  const limpio = texto.trim().toLowerCase()
  return limpio.includes('@') ? limpio : `${limpio}@${DOMINIO_USUARIOS}`
}
