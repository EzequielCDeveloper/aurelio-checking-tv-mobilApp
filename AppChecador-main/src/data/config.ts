import type { AccessTerminal } from '@/types';

/**
 * Terminal por defecto.
 *
 * Estas coordenadas son un SEMILLA, no la configuracion real: si lo fueran,
 * cambiar de sede exigiria recompilar la app. El terminal vivo vive en
 * AsyncStorage (`storage.loadTerminal`) y se calibra desde la pantalla de
 * Perfil, que es la unica forma de que esto sirva para mas de una oficina.
 *
 * El valor inicial solo importa la primera vez que se abre la app.
 */
export const DEFAULT_TERMINAL: AccessTerminal = {
  id: 'TERM-A-001',
  name: 'Torniquete Principal - Edificio A',
  coordinates: {
    latitude: 19.432608,
    longitude: -99.133209,
    accuracy: 0,
  },
  geofenceRadius: 150,
};

export const TERMINAL_ID = DEFAULT_TERMINAL.id;

/**
 * Bloquea el marcaje fuera de la geocerca.
 *
 * Importante: esto NO es un flag de prueba. Es una decision de negocio. Un
 * checador que permite marcar desde el living no sirve de nada, asi que en
 * produccion va en `true` siempre.
 *
 * Bajarlo a `false` desactiva la geocerca por completo: el flujo sigue
 * calculando distancia y la muestra, pero deja de rechazar. Sirve para
 * develops; no sirve para produccion.
 */
export const GEOFENCE_ENFORCED = true;

/**
 * Radio maximo permitido para la geocerca.
 *
 * Un GPS de consumo tiene entre 5 y 30 m de error tipico en exteriores, y
 * mucho mas en interiores. Un radio menor a ~80 m produce falsos rechazos
 * en el mismo edificio. 150 m cubre un recinto con margen razonable.
 */
export const MIN_GEOFENCE_RADIUS = 50;
export const MAX_GEOFENCE_RADIUS = 1000;
export const DEFAULT_GEOFENCE_RADIUS = 150;

export const DEFAULT_PROFILE = {
  id: 'BC-2291',
  name: 'Aurelio Mendoza',
  role: 'Analista de Sistemas',
  department: 'Tecnologia e Innovacion',
  status: 'Activo',
  securityLevel: 'L2 - Autenticado',
  schedule: {
    entryTime: '08:00',
    toleranceMinutes: 10,
    exitTime: '17:00',
    payrollNote: 'Descanso de comida: 60 min dentro del turno.',
    workdays: 'Lunes a Viernes',
    hoursPerWeek: '48 h',
    shiftName: 'Turno Matutino',
  },
  notificationsEnabled: true,
} satisfies Omit<import('@/types').UserProfile, 'avatar' | 'device'>;