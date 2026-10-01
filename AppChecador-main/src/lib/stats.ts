import type { AttendanceRecord } from '@/types';
import { dayKey } from './date';

export interface AttendanceStats {
  /** Porcentaje de entradas dentro de la tolerancia. 0 si no hay entradas. */
  punctualityPercent: number;
  punctualCount: number;
  lateCount: number;
  /** Dias de calendario con al menos un marcaje. */
  totalDays: number;
  /** Minutos trabajados: suma de (salida - entrada) en dias con ambos extremos. */
  workedMinutes: number;
  /** Minutos de descanso: suma de (regreso - salida a comida). */
  breakMinutes: number;
  /** Dias con entrada y salida, base de workedMinutes. */
  completeDays: number;
}

/**
 * Metricas calculadas sobre los registros reales.
 *
 * El prototipo fijaba "95% de puntualidad", "1 retardo" y "20 dias" como
 * literales en el JSX, jamas derivados de `records`. Aqui salen de los datos.
 */
export function computeStats(records: AttendanceRecord[]): AttendanceStats {
  const byDay = new Map<string, AttendanceRecord[]>();
  for (const record of records) {
    const key = dayKey(record.timestamp);
    const list = byDay.get(key);
    if (list) list.push(record);
    else byDay.set(key, [record]);
  }

  const entries = records.filter((r) => r.type === 'entrada');
  const punctualCount = entries.filter((r) => r.status === 'Puntual').length;
  const lateCount = entries.filter((r) => r.status === 'Retardo').length;

  let workedMinutes = 0;
  let breakMinutes = 0;
  let completeDays = 0;

  for (const dayRecords of byDay.values()) {
    const sorted = [...dayRecords].sort((a, b) => a.timestamp - b.timestamp);
    const entry = sorted.find((r) => r.type === 'entrada');
    const exit = sorted.find((r) => r.type === 'salida');
    const breakStart = sorted.find((r) => r.type === 'comida_salida');
    const breakEnd = sorted.find((r) => r.type === 'comida_regreso');

    // Un dia cuenta como completo solo si se puede medir el tramo.
    if (entry && exit && exit.timestamp > entry.timestamp) {
      workedMinutes += Math.round((exit.timestamp - entry.timestamp) / 60_000);
      completeDays += 1;
    }

    if (breakStart && breakEnd && breakEnd.timestamp > breakStart.timestamp) {
      breakMinutes += Math.round((breakEnd.timestamp - breakStart.timestamp) / 60_000);
    }
  }

  return {
    punctualityPercent: entries.length === 0 ? 0 : Math.round((punctualCount / entries.length) * 100),
    punctualCount,
    lateCount,
    totalDays: byDay.size,
    workedMinutes,
    breakMinutes,
    completeDays,
  };
}

/** "7h 32m" */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return '0h 00m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}
