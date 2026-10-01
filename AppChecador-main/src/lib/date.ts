import type { AttendanceRecord, PunchStatus, PunchType } from '@/types';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MESES_LARGOS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const pad = (n: number) => String(n).padStart(2, '0');

/** "14:32:07" en formato 24h. */
export function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** "02:32:07 PM" en formato 12h, como mostraba el prototipo. */
export function formatTime12(ts: number): string {
  const d = new Date(ts);
  const h24 = d.getHours();
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 || 12;
  return `${pad(h12)}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${suffix}`;
}

/** "Martes, 29 Sep" — cabecera de reloj del checador. */
export function formatClockDate(ts: number): string {
  const d = new Date(ts);
  return `${DIAS[d.getDay()]}, ${d.getDate()} ${MESES[d.getMonth()]}`;
}

/** Clave de calendario "YYYY-MM-DD" en hora local. */
export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const startOfDay = (ts: number) => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** "29 de Septiembre" */
export function formatLongDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getDate()} de ${MESES_LARGOS[d.getMonth()]}`;
}

/** "Mar 22 Sep" */
export function formatShortDate(ts: number): string {
  const d = new Date(ts);
  return `${DIAS_CORTOS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`;
}

/** "Hoy" | "Ayer" | "Mar 22 Sep" — etiqueta relativa de un dia. */
export function relativeDayLabel(ts: number, now: number = Date.now()): string {
  const key = dayKey(ts);
  if (key === dayKey(now)) return 'Hoy';
  if (key === dayKey(now - 24 * 60 * 60 * 1000)) return 'Ayer';
  return formatShortDate(ts);
}

export interface DayBucket {
  key: string;
  timestamp: number;
  /** "Hoy" | "Ayer" | "Mar 22 Sep" */
  relativeLabel: string;
  longDate: string;
  records: AttendanceRecord[];
}

/**
 * Agrupa registros por dia de calendario real, del mas reciente al mas viejo.
 *
 * El prototipo agrupaba con `dayGroup: 'hoy' | 'ayer' | 'viernes' | 'anteriores'`,
 * un enum fijo. Consecuencia directa: el filtro "Mes Actual" renderizaba
 * exactamente los mismos dos grupos que "Esta Semana". Agrupar por calendario
 * hace que el filtro signifique algo.
 */
export function groupByDay(records: AttendanceRecord[], now: number = Date.now()): DayBucket[] {
  const buckets = new Map<string, DayBucket>();

  for (const record of records) {
    const key = dayKey(record.timestamp);
    const existing = buckets.get(key);
    if (existing) {
      existing.records.push(record);
    } else {
      buckets.set(key, {
        key,
        timestamp: startOfDay(record.timestamp),
        relativeLabel: '',
        longDate: formatLongDate(record.timestamp),
        records: [record],
      });
    }
  }

  return [...buckets.values()]
    .map((bucket) => ({
      ...bucket,
      relativeLabel: relativeDayLabel(bucket.timestamp, now),
      records: bucket.records.sort((a, b) => b.timestamp - a.timestamp),
    }))
    .sort((a, b) => b.timestamp - a.timestamp);
}

export type PeriodFilter = 'semana' | 'mes' | 'anteriores';

/**
 * Que dias incluye cada periodo. Ahora los tres filtros son genuinamente
 * distintos porque el corte se calcula sobre la fecha, no sobre un enum.
 */
export function daysInPeriod(period: PeriodFilter, now: number = Date.now()): Set<string> {
  const today = startOfDay(now);
  const days = period === 'semana' ? 7 : period === 'mes' ? 30 : Infinity;
  if (days === Infinity) return new Set();

  const keys = new Set<string>();
  for (let i = 0; i < days; i++) {
    keys.add(dayKey(today - i * 24 * 60 * 60 * 1000));
  }
  return keys;
}

export function filterByPeriod(records: AttendanceRecord[], period: PeriodFilter, now?: number): AttendanceRecord[] {
  const keys = daysInPeriod(period, now);
  if (keys.size === 0) return records;
  return records.filter((r) => keys.has(dayKey(r.timestamp)));
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

export const punchTitle = (type: PunchType) => TITLES[type];
export const punchSubtitle = (type: PunchType) => SUBTITLES[type];

const timeToMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Deriva el estatus desde el horario real del colaborador.
 *
 * El prototipo fijaba "Puntual" como literal en toda la UI, incluso antes de
 * haber registrado nada. Ahora depende de la hora real contra el turno.
 */
export function deriveStatus(
  type: PunchType,
  timestamp: number,
  entryTime: string,
  toleranceMinutes: number,
): PunchStatus {
  if (type !== 'entrada') return 'Registrado';

  const d = new Date(timestamp);
  const actual = d.getHours() * 60 + d.getMinutes();
  const limite = timeToMinutes(entryTime) + toleranceMinutes;
  return actual <= limite ? 'Puntual' : 'Retardo';
}
