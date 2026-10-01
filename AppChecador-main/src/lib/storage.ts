import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import { DEFAULT_TERMINAL } from '@/data/config';
import type { AccessTerminal, AttendanceRecord, EmployeeSession, UserProfile } from '@/types';

const RECORDS_KEY = 'biocheck.records.v1';
const PROFILE_KEY = 'biocheck.profile.v1';
const TERMINAL_KEY = 'biocheck.terminal.v1';
const SESSION_KEY = 'biocheck.session.v1';

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    // Datos corruptos o almacenamiento inaccesible: se arranca limpio en vez
    // de dejar la app inutilizable.
    return fallback;
  }
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Sin persistencia: la app sigue funcionando en memoria.
  }
}

/**
 * Sesion activa: que empleado se identifico y cuando.
 *
 * Va en SecureStore, no en AsyncStorage. En Android SecureStore cifra el valor
 * con el Keystore del sistema, asi que la sesion no queda como texto plano en
 * SharedPreferences como el resto de los datos de la app.
 *
 * La clave del id es el `empleado_id` NUMERICO de la API, no el `id` de texto
 * que usa el QR local. Son dos identificadores distintos y confundirlos hace
 * que el POST /api/asistencias/marcar falle con 404.
 */
async function loadSession(): Promise<EmployeeSession | null> {
  try {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    // La sesion vieja vivia en AsyncStorage con la misma clave. Como los dos
    // almacenes estan separados no hay colision: se lee la nueva y se borra la
    // vieja para no dejar una copia en claro dando vueltas.
    await AsyncStorage.removeItem(SESSION_KEY).catch(() => undefined);
    return raw ? (JSON.parse(raw) as EmployeeSession) : null;
  } catch {
    return null;
  }
}

async function saveSession(session: EmployeeSession): Promise<void> {
  try {
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Sin persistencia: la sesion vive solo en memoria y se pierde al cerrar.
  }
}

/** Cierra sesion. El terminal y el perfil se conservan. */
async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY).catch(() => undefined);
  await AsyncStorage.removeItem(SESSION_KEY).catch(() => undefined);
}

export const storage = {
  loadRecords: () => readJson<AttendanceRecord[]>(RECORDS_KEY, []),
  saveRecords: (records: AttendanceRecord[]) => writeJson(RECORDS_KEY, records),

  loadProfile: () => readJson<UserProfile | null>(PROFILE_KEY, null),
  saveProfile: (profile: UserProfile) => writeJson(PROFILE_KEY, profile),

  loadTerminal: () => readJson<AccessTerminal>(TERMINAL_KEY, DEFAULT_TERMINAL),
  saveTerminal: (terminal: AccessTerminal) => writeJson(TERMINAL_KEY, terminal),

  loadSession,
  saveSession,
  clearSession,

  async resetTerminal(): Promise<void> {
    await AsyncStorage.removeItem(TERMINAL_KEY);
  },

  /** Borra marcajes y conserva el perfil y el terminal. */
  async clearRecords(): Promise<void> {
    await AsyncStorage.removeItem(RECORDS_KEY);
  },
};