import { deriveStatus, punchSubtitle, punchTitle } from '@/lib/date';
import { signPunch } from '@/lib/hash';
import type { AccessTerminal, AttendanceRecord, PunchType, UserProfile } from '@/types';
import { DEFAULT_PROFILE, DEFAULT_TERMINAL } from './config';

/** PRNG determinista: el historial de ejemplo es igual en cada arranque. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;
const WORKDAYS_OF_HISTORY = 18;

function atTime(ts: number, hh: number, mm: number): number {
  const d = new Date(ts);
  d.setHours(hh, mm, 0, 0);
  return d.getTime();
}

/** Dia habil anterior (lunes a viernes) al timestamp dado. */
function previousWorkday(ts: number): number {
  let cursor = ts - DAY_MS;
  for (let guard = 0; guard < 7; guard++) {
    const day = new Date(cursor).getDay();
    if (day !== 0 && day !== 6) return cursor;
    cursor -= DAY_MS;
  }
  return cursor;
}

const PLAN: { type: PunchType; hour: number; minute: number }[] = [
  { type: 'entrada', hour: 8, minute: 0 },
  { type: 'comida_salida', hour: 13, minute: 30 },
  { type: 'comida_regreso', hour: 14, minute: 30 },
  { type: 'salida', hour: 17, minute: 0 },
];

/**
 * Historial de demostracion: los ultimos dias habiles, cada uno con entrada,
 * comida, regreso y salida. Los hashes son SHA-256 reales, igual que los de
 * una marcacion nueva.
 */
export async function buildSeedRecords(
  user: UserProfile = DEFAULT_PROFILE as UserProfile,
  now: number = Date.now(),
  terminal: AccessTerminal = DEFAULT_TERMINAL,
): Promise<AttendanceRecord[]> {
  const random = mulberry32(0x5eed);
  const records: AttendanceRecord[] = [];

  let cursor = previousWorkday(now);
  for (let day = 0; day < WORKDAYS_OF_HISTORY; day++) {
    // Un retardo cada seis dias laborables, para que las metricas no salgan
    // todas en 100% y el filtro "Retardos" tenga algo que mostrar.
    const isLate = day > 0 && day % 6 === 0;

    for (const step of PLAN) {
      let timestamp = atTime(cursor, step.hour, step.minute);
      if (step.type === 'entrada') {
        timestamp += Math.round(random() * 4) * 60_000;
        if (isLate) timestamp += 18 * 60_000;
      } else {
        timestamp += Math.round(random() * 9) * 60_000;
      }

      const status = deriveStatus(
        step.type,
        timestamp,
        user.schedule.entryTime,
        user.schedule.toleranceMinutes,
      );
      const scannedPayload = `BIOCHECK:${terminal.id}:${user.id}`;
      const { hash } = await signPunch({
        userId: user.id,
        type: step.type,
        timestamp,
        location: terminal.name,
        coordinates: terminal.coordinates,
        scannedPayload,
      });

      records.push({
        id: `${terminal.id}-${timestamp}`,
        type: step.type,
        title: punchTitle(step.type),
        subtitle: punchSubtitle(step.type),
        location: terminal.name,
        timestamp,
        status,
        method: 'QR + Biometria',
        hash,
        coordinates: terminal.coordinates,
        scannedPayload,
      });
    }

    cursor = previousWorkday(cursor);
  }

  return records.sort((a, b) => b.timestamp - a.timestamp);
}
