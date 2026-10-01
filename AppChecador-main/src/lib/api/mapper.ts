import type { AttendanceRecord, Coordinates, PunchStatus, PunchType } from '@/types';
import {
  indexEmpleados,
  normalizeTime,
  type ApiAsistencia,
  type ApiEmpleado,
  type ApiEmpleadoLookup,
} from './types';

/**
 * Adaptador entre el formato de la API y el de la app.
 *
 * La app muestra "Puntual" y el servidor responde "A tiempo". Parece cosmético
 * pero no lo es: si la app calculase el estatus por su cuenta, un celular con
 * la reloj mal sincronizada registraría "Puntual" llegando tarde. La fuente de
 * verdad es el servidor, y estas funciones solo traducen su respuesta.
 */

/** 'Entrada' -> 'entrada'. Cualquier valor desconocido cae en 'entrada'. */
export function toPunchType(apiTipo: string): PunchType {
  const normalized = apiTipo.trim().toLowerCase();
  switch (normalized) {
    case 'entrada':
      return 'entrada';
    case 'salida':
      return 'salida';
    case 'comida_salida':
    case 'salida a comida':
    case 'comida':
      return 'comida_salida';
    case 'comida_regreso':
    case 'regreso de comida':
      return 'comida_regreso';
    default:
      return 'entrada';
  }
}

/** 'A tiempo' -> 'Puntual'. */
export function toPunchStatus(apiEstado: string): PunchStatus {
  const normalized = apiEstado.trim().toLowerCase();
  if (normalized === 'retardo') return 'Retardo';
  if (normalized === 'a tiempo' || normalized === 'puntual') return 'Puntual';
  return 'Registrado';
}

/** Inversa de `toPunchType`, para enviar al backend. */
export function toApiTipo(punch: PunchType): 'Entrada' | 'Salida' {
  // El backend solo valida estos dos valores: cualquier otro devuelve 400.
  // Los marcajes de comida no tienen soporte en el backend actual.
  return punch === 'salida' ? 'Salida' : 'Entrada';
}

const TITLES: Record<PunchType, string> = {
  entrada: 'Entrada Registrada',
  salida: 'Salida de Jornada',
  comida_salida: 'Salida a Comida',
  comida_regreso: 'Regreso de Comida',
};

const SUBTITLES: Record<PunchType, string> = {
  entrada: 'Inicio de turno',
  salida: 'Cierre de turno',
  comida_salida: 'Inicio de descanso',
  comida_regreso: 'Fin de descanso',
};

/**
 * Firma un registro que viene del servidor. La forma de la funcion replica la
 * de `signPunch`, para que el cliente pueda inyectarla sin adaptadores.
 */
export type RecordSigner = (input: {
  userId: string;
  type: PunchType;
  timestamp: number;
  location: string;
  coordinates: Coordinates;
  scannedPayload: string;
}) => Promise<string>;

/**
 * Convierte una fila de la API en un registro de la app.
 *
 * La fila viene sin hash ni coordenadas: el backend no los guarda. Se
 * firma igual en el cliente para que el registro tenga una firma verificable,
 * pero queda claro que es local, no del servidor.
 */
export async function toAttendanceRecord(
  row: ApiAsistencia,
  index: ApiEmpleadoLookup,
  fallbackCoordinates: Coordinates,
  signLocal: RecordSigner,
): Promise<AttendanceRecord> {
  const type = toPunchType(row.tipo);
  const fullName = `${row.nombre} ${row.apellido}`.trim();
  const empleado = index.byName.get(fullName);
  const timestamp = new Date(row.fecha_hora).getTime();
  const location = 'Terminal del servidor';

  const hash = await signLocal({
    userId: empleado ? String(empleado.id) : fullName,
    type,
    timestamp,
    location,
    coordinates: fallbackCoordinates,
    scannedPayload: `API:${row.id}`,
  });

  return {
    id: `srv-${row.id}`,
    type,
    title: TITLES[type],
    subtitle: SUBTITLES[type],
    location,
    timestamp,
    status: toPunchStatus(row.estado),
    method: 'QR + Biometria',
    hash,
    coordinates: fallbackCoordinates,
    scannedPayload: `API:${row.id}`,
  };
}

/** Construye el perfil del empleado autenticado a partir de su ficha. */
export function toScheduleFields(empleado: ApiEmpleado) {
  return {
    entryTime: normalizeTime(empleado.hora_entrada),
    // El backend expone la tolerancia en el horario; si el empleado no tiene
    // turno resuelto, 10 min es el default de la empresa.
    toleranceMinutes: 10,
    exitTime: '17:00',
    shiftName: empleado.nombre_turno ?? 'Sin turno',
  };
}

export { indexEmpleados, normalizeTime };