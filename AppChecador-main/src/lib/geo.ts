import type { AccessTerminal, Coordinates } from '@/types';

const EARTH_RADIUS_M = 6_371_000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Distancia en metros entre dos coordenadas (haversine). */
export function distanceMeters(a: Coordinates, b: Coordinates): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export interface GeofenceResult {
  inside: boolean;
  distanceMeters: number;
  radiusMeters: number;
}

/**
 * Verifica si una posicion cae dentro de la geocerca de un terminal.
 *
 * Reemplaza el chip que decia "GPS: Oficina Central (Dentro de Geocerca) —
 * Precision +-2m" con valores fijos, sin consultar la posicion real.
 */
export function checkGeofence(position: Coordinates, terminal: AccessTerminal): GeofenceResult {
  // Nombre distinto al de la funcion: `const distanceMeters = distanceMeters(...)`
  // se shadowea a si mismo y rompe la inicializacion.
  const distance = distanceMeters(position, terminal.coordinates);
  return {
    inside: distance <= terminal.geofenceRadius,
    distanceMeters: distance,
    radiusMeters: terminal.geofenceRadius,
  };
}

/** "12 m" | "1.4 km" */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
