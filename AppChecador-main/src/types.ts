export type TabType = 'checador' | 'historial' | 'perfil';

export type PunchType = 'entrada' | 'salida' | 'comida_salida' | 'comida_regreso';

export type PunchStatus = 'Puntual' | 'Retardo' | 'Registrado';

export interface Coordinates {
  latitude: number;
  longitude: number;
  /** Metros de precision horizontal reportados por el GPS. */
  accuracy: number;
}

/**
 * Un marcaje de asistencia.
 *
 * `timestamp` (epoch ms) es la unica fuente de verdad. El prototipo web
 * guardaba en paralelo `time` y `dateStr` ya formateados, y `dayGroup` con
 * valores fijos ('hoy' | 'ayer' | 'viernes'), lo que hacia imposible que los
 * filtros por periodo mostraran algo distinto. Todo eso se deriva ahora del
 * timestamp con src/lib/date.ts.
 */
export interface AttendanceRecord {
  id: string;
  type: PunchType;
  title: string;
  subtitle: string;
  /** Nombre del terminal donde se registro. */
  location: string;
  timestamp: number;
  status: PunchStatus;
  /** Metodo de autenticacion, ej. "QR + Face ID". */
  method: string;
  /** SHA-256 real del payload firmado. Ver src/lib/hash.ts. */
  hash: string;
  coordinates: Coordinates;
  /** Payload crudo escaneado del codigo QR. */
  scannedPayload: string;
}

export interface WorkSchedule {
  entryTime: string;
  /** Tolerancia de retardo en minutos. */
  toleranceMinutes: number;
  exitTime: string;
  payrollNote: string;
  workdays: string;
  hoursPerWeek: string;
  shiftName: string;
}

export interface DeviceInfo {
  model: string;
  /** Identificador estable del dispositivo, generado localmente. */
  uuid: string;
  isPrimary: boolean;
  biometricStatus: string;
  /** Radio de geocerca permitido, en metros. */
  geofenceRadius: number;
  geofenceStatus: string;
}

export interface UserProfile {
  id: string;
  name: string;
  role: string;
  department: string;
  status: string;
  securityLevel: string;
  /** Asset local. El avatar remoto del prototipo (lh3.googleusercontent.com) expira. */
  avatar: number;
  schedule: WorkSchedule;
  device: DeviceInfo;
  notificationsEnabled: boolean;
}

/**
 * Sesion del empleado autenticado al entrar.
 *
 * `empleadoId` es el id NUMERICO de la API (2, 3, 4...). Es el unico valor
 * que el backend acepta en POST /api/asistencias/marcar, y sale de la
 * credencial verificada en src/data/credentials.ts, no de una eleccion en
 * pantalla.
 *
 * Aclaracion importante: esto sigue SIN SER autenticacion real. La contrasena
 * se verifica contra un registro que viaja dentro del bundle y el backend
 * acepta cualquier `empleado_id` que le manden. Es una barrera de la app, no
 * un control de acceso. Cuando el backend exponga auth, este tipo no cambia:
 * lo que cambia es de donde sale la sesion (ver login() en lib/api/client.ts).
 */
export interface EmployeeSession {
  empleadoId: number;
  nombre: string;
  apellido: string;
  /** ISO 8601. Solo informativo: la sesion no expira sola. */
  iniciadaEn: string;
  /** Metodo de acceso, para mostrarlo en Perfil. */
  metodo: 'usuario-contrasena';
}

export interface ConnectedDevice {
  id: string;
  name: string;
  model: string;
  os: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
  status: 'Autorizado' | 'En revisión';
}

/** Terminal de acceso fisico contra el que se escanea el QR. */
export interface AccessTerminal {
  id: string;
  name: string;
  coordinates: Coordinates;
  geofenceRadius: number;
}
