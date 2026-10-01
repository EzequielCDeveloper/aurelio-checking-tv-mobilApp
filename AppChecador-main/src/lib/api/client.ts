import type {
  AttendanceRecord,
  Coordinates,
  EmployeeSession,
  PunchType,
  UserProfile,
} from '@/types';
import {
  toApiTipo,
  toAttendanceRecord,
  toScheduleFields,
  indexEmpleados,
  type RecordSigner,
} from './mapper';
import type {
  ApiAsistencia,
  ApiEmpleado,
  ApiHorario,
  ApiMarkResponse,
} from './types';

/**
 * Cliente de la API de asistencia.
 *
 * La API vive detrÃ¡s de Cloudflare y no exige autenticaciÃ³n: `GET
 * /api/empleados` responde 200 sin credenciales. Eso alcanza para leer, pero
 * es una decisión del backend, no de esta app. Cuando agreguen auth, el lugar
 * Ãºnico a tocar es `request()`.
 */

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://huella.cleyvadev.com';

const TIMEOUT_MS = 12_000;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** El empleado fue dado de baja o no existe. */
  get isNotFound(): boolean {
    return this.status === 404;
  }

  /** El servidor rechazÃ³ los datos (ej. tipo de marcaje invÃ¡lido). */
  get isValidation(): boolean {
    return this.status === 400;
  }
}

/** El backend no respondiÃ³ a tiempo o no hay red. */
export class NetworkError extends Error {
  constructor(message = 'No se pudo conectar con el servidor.') {
    super(message);
    this.name = 'NetworkError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...init?.headers,
      },
    });
  } catch (error) {
    // AbortError y TypeError de fetch llegan como excepciÃ³n: sin red, DNS
    // caÃ­do, o timeout. Todos son el mismo problema para el usuario.
    const message =
      error instanceof Error && error.name === 'AbortError'
        ? 'El servidor tardÃ³ demasiado en responder.'
        : 'No se pudo conectar con el servidor.';
    throw new NetworkError(message);
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      // Un HTML de error de nginx o un 502 de Cloudflare no son JSON.
      body = text.slice(0, 200);
    }
  }

  if (!response.ok) {
    const detail =
      body && typeof body === 'object' && 'error' in body
        ? String((body as { error: unknown }).error)
        : `HTTP ${response.status}`;
    throw new ApiError(detail, response.status, body);
  }

  return body as T;
}

/** Ping barato para saber si el backend estÃ¡ vivo. */
export async function checkHealth(): Promise<boolean> {
  try {
    const body = await request<{ status: string }>('/health');
    return body.status === 'ok';
  } catch {
    return false;
  }
}

export async function fetchHorarios(): Promise<ApiHorario[]> {
  return request<ApiHorario[]>('/api/horarios');
}

export async function fetchEmpleados(): Promise<ApiEmpleado[]> {
  return request<ApiEmpleado[]>('/api/empleados');
}

/**
 * Historial de la semana. El endpoint devuelve los registros de TODA la
 * empresa; se filtran por nombre del empleado porque la fila no trae el id.
 */
export async function fetchWeekAttendance(
  empleado: ApiEmpleado | null,
  signLocal: RecordSigner,
  fallbackCoordinates: Coordinates,
): Promise<AttendanceRecord[]> {
  const rows = await request<ApiAsistencia[]>('/api/asistencias/semana');
  const fullName = empleado ? `${empleado.nombre} ${empleado.apellido}`.trim() : null;

  // El indice se arma con el listado completo para poder resolver nombres
  // sin un request extra.
  const index = indexEmpleados(await safeEmpleados());

  const mapped = await Promise.all(
    rows
      .filter((row) => !fullName || `${row.nombre} ${row.apellido}`.trim() === fullName)
      .map((row) => toAttendanceRecord(row, index, fallbackCoordinates, signLocal)),
  );

  return mapped.sort((a, b) => b.timestamp - a.timestamp);
}

let cachedEmpleados: ApiEmpleado[] | null = null;

/** Listado cacheado en memoria: se pide una vez por sesiÃ³n. */
export async function safeEmpleados(): Promise<ApiEmpleado[]> {
  if (cachedEmpleados) return cachedEmpleados;
  cachedEmpleados = await fetchEmpleados();
  return cachedEmpleados;
}

export interface MarkResult {
  recordId: number;
  estado: string;
  empleado: string;
}

/**
 * Registra el marcaje. El estado (`A tiempo` / `Retardo`) lo calcula el
 * servidor con su propio reloj; la app nunca lo decide por su cuenta.
 */
export async function markAttendance(
  empleadoId: number,
  punch: PunchType,
): Promise<MarkResult> {
  const body = await request<ApiMarkResponse>('/api/asistencias/marcar', {
    method: 'POST',
    body: JSON.stringify({ empleado_id: empleadoId, tipo: toApiTipo(punch) }),
  });

  return {
    recordId: body.id_registro,
    estado: body.estado,
    empleado: body.empleado,
  };
}

/** Construye el perfil de la app desde la ficha del backend. */
export function profileFromEmpleado(
  empleado: ApiEmpleado,
  horario: ApiHorario | null,
  extras: { avatar: number; uuid: string },
): UserProfile {
  return {
    id: String(empleado.id),
    name: `${empleado.nombre} ${empleado.apellido}`.trim(),
    role: horario?.nombre_turno ?? 'Sin turno',
    department: 'â€”',
    status: empleado.estatus,
    securityLevel: 'L2 - Autenticado',
    avatar: extras.avatar,
    schedule: {
      ...toScheduleFields(empleado),
      toleranceMinutes: horario?.tolerancia_minutos ?? 10,
      payrollNote: 'Descanso de comida: 60 min dentro del turno.',
      workdays: 'Lunes a Viernes',
      hoursPerWeek: '48 h',
      shiftName: horario?.nombre_turno ?? 'Sin turno',
    },
    device: {
      model: 'Dispositivo registrado',
      uuid: extras.uuid,
      isPrimary: true,
      biometricStatus: 'Por verificar',
      geofenceRadius: 150,
      geofenceStatus: 'Por verificar',
    },
    notificationsEnabled: true,
  };
}

/**
 * Abre sesion para un empleado ya autenticado por la app.
 *
 * OJO con el alcance de esta funcion: la contrasena se verifica contra el
 * registro local (src/lib/auth.ts), NO contra el servidor, porque la API no
 * tiene endpoint de login. Lo que hace esta parte es confirmar contra la base
 * que la ficha existe y sigue `Activo` — si el backend dio de baja a alguien
 * despues de instalada la app, el acceso se cae igual.
 *
 * En cuanto el backend exponga auth real, la verificacion de la contrasena se
 * corre entera al servidor y esta funcion deja de existir: `empleado_id` tiene
 * que deducirse del token, no venir del telefono.
 */
export async function login(empleadoId: number): Promise<EmployeeSession> {
  const empleados = await fetchEmpleados();
  const empleado = empleados.find((e) => e.id === empleadoId);

  if (!empleado) {
    throw new ApiError('Ese empleado no existe en el servidor.', 404);
  }
  if (empleado.estatus?.toLowerCase() !== 'activo') {
    throw new ApiError('El empleado no esta activo.', 403);
  }

  return {
    empleadoId: empleado.id,
    nombre: empleado.nombre,
    apellido: empleado.apellido,
    iniciadaEn: new Date().toISOString(),
    metodo: 'usuario-contrasena',
  };
}

export { toApiTipo, toPunchStatus, toPunchType } from './mapper';
export type { ApiEmpleado, ApiHorario, ApiAsistencia } from './types';
