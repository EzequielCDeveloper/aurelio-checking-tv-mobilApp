import { CREDENCIALES, type LocalCredential } from '@/data/credentials';
import { sha256Hex } from '@/lib/hash';

/**
 * Verificación de usuario y contraseña contra el registro local.
 *
 * Ver src/data/credentials.ts para qué esto NO es autenticación real. Acá solo
 * vive la lógica de comparar credenciales sin filtrar información.
 */

/** Error de credenciales. Un solo mensaje para usuario y contraseña. */
export class AuthError extends Error {
  constructor(message = 'Usuario o contraseña incorrectos.') {
    super(message);
    this.name = 'AuthError';
  }
}

/** Error de bloqueo temporal por intentos fallidos. */
export class ThrottledError extends Error {
  constructor(readonly segundosRestantes: number) {
    super(`Demasiados intentos. Probá de nuevo en ${segundosRestantes} s.`);
    this.name = 'ThrottledError';
  }
}

const MAX_INTENTOS = 5;
const BLOQUEO_MS = 30_000;

let intentosFallidos = 0;
let bloqueadoHasta = 0;

/**
 * Freno a fuerza bruta.
 *
 * Vive en memoria a propósito: si se persistiera, reiniciar la app lo
 * esquivaría igual, y en un teléfono ajeno el bloqueo no sirve para nada.
 * Solo evita que alguien pruebe 50 contraseñas seguidas de corrido.
 */
function registrarFallo(): void {
  intentosFallidos += 1;
  if (intentosFallidos >= MAX_INTENTOS) {
    bloqueadoHasta = Date.now() + BLOQUEO_MS;
    intentosFallidos = 0;
  }
}

function segundosDeEspera(): number {
  const restante = bloqueadoHasta - Date.now();
  return restante <= 0 ? 0 : Math.ceil(restante / 1000);
}

export function estaBloqueado(): boolean {
  return segundosDeEspera() > 0;
}

/**
 * Compara dos hex sin filtrar por tiempo.
 *
 * Un `===` normal corta en el primer carácter distinto, y eso convierte la
 * verificación en un oráculo de timing. No es explotable acá, pero cuesta
 * tres líneas y evita que alguien lo reporte como falla en una revisión.
 */
function igualEnTiempoConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i += 1) {
    diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diferencia === 0;
}

/**
 * Verifica usuario y contraseña.
 *
 * Devuelve la credencial o lanza `AuthError` / `ThrottledError`. El mensaje de
 * error es idéntico exista o no el usuario, para no dejar adivinar qué
 * usernames están dados de alta.
 */
export async function verificarCredenciales(
  usuario: string,
  contrasena: string,
): Promise<LocalCredential> {
  const espera = segundosDeEspera();
  if (espera > 0) throw new ThrottledError(espera);

  const normalizado = usuario.trim().toLowerCase();
  const credencial = CREDENCIALES.find((c) => c.usuario === normalizado);

  if (!credencial || contrasena.length === 0) {
    registrarFallo();
    throw new AuthError();
  }

  const calculado = await sha256Hex(`${credencial.salt}:${contrasena}`);

  if (!igualEnTiempoConstante(calculado, credencial.hash)) {
    registrarFallo();
    throw new AuthError();
  }

  intentosFallidos = 0;
  return credencial;
}

/** Exposto para la pantalla de login y los tests. */
export { CREDENCIALES };