/**
 * Contrato de datos de la API de asistencia.
 *
 * Estos tipos reflejan lo que devuelve REALMENTE `huella.cleyvadev.com`, no lo
 * que 'idealmente' debería devolver. Hay tres desvíos importantes y todos están
 * documentados acá, porque ignorarlos produce bugs silenciosos:
 *
 * 1. `tipo` viaja como `'Entrada' | 'Salida'` con mayúscula inicial, mientras
 *    que la app usa `'entrada' | 'salida'` en minúscula. De ahí `toPunchType`.
 * 2. `estado` del servidor es `'A tiempo' | 'Retardo'`, y la app usa
 *    `'Puntual' | 'Retardo' | 'Registrado'`. De ahí `toPunchStatus`.
 * 3. `hora_entrada` viene como `'08:00:00'`, no como `'08:00'`. Hay que
 *    recortar o el cálculo de minutos del servidor no cierra.
 */

/** Turno laboral. */
export interface ApiHorario {
  id: number;
  nombre_turno: string;
  /** 'HH:MM:SS' — con segundos, a diferencia del resto de la app. */
  hora_entrada: string;
  tolerancia_minutos: number;
  hora_salida: string | null;
}

/** Empleado con su turno ya resuelto por el JOIN del backend. */
export interface ApiEmpleado {
  id: number;
  nombre: string;
  apellido: string;
  foto_url: string | null;
  horario_id: number;
  estatus: 'Activo' | 'Baja' | string;
  creado_en: string;
  horario_inicio: string | null;
  horario_fin: string | null;
  nombre_turno: string | null;
  hora_entrada: string | null;
}

/** Fila de la vista de asistencias de la semana. */
export interface ApiAsistencia {
  id: number;
  nombre: string;
  apellido: string;
  foto_url: string | null;
  /** 'Entrada' | 'Salida' — el backend rechaza cualquier otro valor. */
  tipo: string;
  /** ISO 8601 con Z. Ojo: es UTC. */
  fecha_hora: string;
  /** 'A tiempo' | 'Retardo' */
  estado: string;
}

/** Respuesta de `POST /api/asistencias/marcar`. */
export interface ApiMarkResponse {
  mensaje: string;
  empleado: string;
  tipo: string;
  estado: string;
  id_registro: number;
}

/**
 * La API no tiene endpoint por empleado: `/api/asistencias/semana` devuelve
 * todos los registros de los últimos 7 días de la empresa entera. Para una
 * empresa con 200 empleados eso son cientos de filas por cada carga del
 * historial, y el móvil las baja y filtra enteras.
 *
 * Por eso el cliente filtra por `empleado_id` aunque la API no lo mande: la
 * fila viene con nombre y apellido, no con el id. Se matchea por nombre.
 */
export interface ApiEmpleadoLookup {
  byName: Map<string, ApiEmpleado>;
  byId: Map<number, ApiEmpleado>;
}

export function indexEmpleados(empleados: ApiEmpleado[]): ApiEmpleadoLookup {
  const byName = new Map<string, ApiEmpleado>();
  const byId = new Map<number, ApiEmpleado>();

  for (const e of empleados) {
    byId.set(e.id, e);
    byName.set(`${e.nombre} ${e.apellido}`.trim(), e);
  }
  return { byName, byId };
}

/** '08:00:00' -> '08:00'. */
export function normalizeTime(value: string | null): string {
  if (!value) return '08:00';
  return value.slice(0, 5);
}