// Traduce errores de Supabase (Auth y PostgREST) a mensajes para el repartidor.

interface ErrorConCodigo {
  code?: string
  message?: string
}

export function mensajeDeError(e: unknown): string {
  const { code, message = '' } = (e ?? {}) as ErrorConCodigo

  if (/failed to fetch|networkerror|load failed|network request failed/i.test(message)) {
    return 'Sin conexión. Revisa la señal e inténtalo otra vez.'
  }

  switch (code) {
    case 'invalid_credentials':
      return 'Usuario o contraseña incorrectos.'
    case 'user_banned':
      return 'Tu cuenta está desactivada. Habla con el encargado.'
    case '42501':
    case 'PGRST116':
      return 'No se guardó: la ruta ya está cerrada o no es de hoy.'
    case '23505':
      return 'Ya iniciaste la ruta de hoy.'
    case '23514':
      return 'Revisa los datos: los kilos deben ser mayores a cero.'
  }

  return 'Algo salió mal. Inténtalo otra vez.'
}
