/**
 * Credenciales locales de acceso al checador.
 *
 * LEE ESTO ANTES DE MODIFICAR NADA:
 *
 * Este archivo NO es autenticación. Es una barrera de la app, no un candado.
 * Los motivos son dos y conviene tenerlos claros:
 *
 * 1. El backend (`huella.cleyvadev.com`) no expone ningún endpoint de login
 *    (verificado: `/api/login`, `/api/auth/login` y `/api/usuarios` devuelven
 *    404) y `POST /api/asistencias/marcar` recibe el `empleado_id` desde el
 *    cliente. Aunque esta pantalla fuera perfecta, alguien con `curl` podría
 *    registrar un marcaje como cualquier empleado.
 *
 * 2. Este archivo viaja DENTRO del bundle JavaScript. Quien descompile el APK
 *    lee los hashes y las salts. Por eso las contraseñas NO están en texto
 *    plano: se guardan como SHA-256 con salt por usuario.
 *
 * Aun asi resuelve el problema real de una app de practica: que un compañero
 * no marque por error como otro. Antes, la pantalla de identificacion dejaba
 * elegir a cualquiera de la lista; ahora la sesion queda atada a la credencial
 * verificada.
 *
 * Cuando el backend exponga auth real (bcrypt + token), este archivo se
 * elimina y lo unico que cambia es `signIn()` en AttendanceProvider: la
 * verificacion pasa a ser del servidor.
 */

/** Credencial verificada de un trabajador. */
export interface LocalCredential {
  /** Nombre de usuario. Se compara en minúsculas y sin espacios. */
  usuario: string;
  /** SHA-256 hex de `${salt}:${contrasena}`. Nunca la contraseña en claro. */
  hash: string;
  /** Salt aleatorio por usuario, en hex. Evita rainbow tables precalculadas. */
  salt: string;
  /**
   * Id numérico del empleado en la API. Es el valor que exige
   * `POST /api/asistencias/marcar`, y es lo que ata la sesión a una persona.
   */
  empleadoId: number;
  /** Solo para mostrar en Perfil y depuración. */
  nombre: string;
}

/**
 * Las cuentas que pueden abrir la app.
 *
 * Los `empleadoId` salen de `GET /api/empleados` y corresponden a fichas con
 * `estatus: "Activo"`. Si el backend da de baja a alguien, hay que borrar su
 * entrada acá: la app no lo puede detectar sola porque la validación de
 * estatus vive en `login()` del cliente de API.
 */
export const CREDENCIALES: readonly LocalCredential[] = [
  {
    usuario: 'ana',
    salt: '85d4749ae71d15004edc36e3305549a5',
    hash: 'e623899d19e3318dc9012eeadecfcf1faf35047897da9d7cb7c90a39fcc8ff90',
    empleadoId: 3,
    nombre: 'Ana Pérez',
  },
  {
    usuario: 'esteban',
    salt: '13afb9114783e441a7f57a9fbeedd5ed',
    hash: '78cdad55a5e3853c4dace7d350a03fa678d3971924d6815eadf4a3d51113c05a',
    empleadoId: 4,
    nombre: 'Esteban Gay',
  },
  {
    usuario: 'carlos',
    salt: 'aae324ac3bca7e712b9f1d9394aeb196',
    hash: 'caf74f80015378d5defbf582a69932c46c8e549c2ef78283cedd41af2eede73c',
    empleadoId: 7,
    nombre: 'Carlos González',
  },
] as const;

/** usernames válidos, para la ayuda de la pantalla de login. */
export const USUARIOS_CONOCIDOS: readonly string[] = CREDENCIALES.map((c) => c.usuario);