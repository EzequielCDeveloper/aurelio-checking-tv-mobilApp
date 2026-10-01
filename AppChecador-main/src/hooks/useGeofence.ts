import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

import { haptics } from '@/lib/haptics';
import { distanceMeters as haversine } from '@/lib/geo';
import type { AccessTerminal, Coordinates } from '@/types';

export type GeofenceState = 'idle' | 'locating' | 'resolved' | 'denied' | 'error';

export interface GeofenceReading {
  position: Coordinates;
  /** Metros hasta el centro del terminal. */
  distanceMeters: number;
  inside: boolean;
  radiusMeters: number;
}

export function useGeofence(terminal: AccessTerminal) {
  const [state, setState] = useState<GeofenceState>('idle');
  const [reading, setReading] = useState<GeofenceReading | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const watchId = useRef<Location.LocationSubscription | null>(null);

  const stopWatching = useCallback(() => {
    watchId.current?.remove();
    watchId.current = null;
  }, []);

  /**
   * Fija la posicion y la devuelve.
   *
   * Devolver el valor (y no solo exponerlo por state) es lo que permite
   * encadenar "ubicar -> validar -> firmar" en un mismo handler: leer
   * `reading` del render despues de un `await` daria el valor viejo.
   */
  const locate = useCallback(async (): Promise<GeofenceReading | null> => {
    setState('locating');
    setMessage(null);

    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      setState('denied');
      setMessage('Se necesita permiso de ubicacion para validar la geocerca.');
      haptics.warn();
      return null;
    }

    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords: Coordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? 0,
      };

      const distanceMeters = haversine(coords, terminal.coordinates);
      const next: GeofenceReading = {
        position: coords,
        distanceMeters,
        inside: distanceMeters <= terminal.geofenceRadius,
        radiusMeters: terminal.geofenceRadius,
      };

      setReading(next);
      setState('resolved');
      return next;
    } catch (error) {
      setState('error');
      setMessage(
        error instanceof Error
          ? 'No se pudo obtener la ubicacion. Revisa que el GPS este activado.'
          : 'No se pudo obtener la ubicacion.',
      );
      haptics.error();
      return null;
    }
  }, [terminal]);

  /**
   * Seguimiento continuo. La app no puede exigir que la marcacion caiga en el
   * primer fix del GPS: la senal suele tardar, y obligar a reintentar a mano
   * es peor que esperar unos segundos.
   */
  const watch = useCallback(async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      setState('denied');
      setMessage('Se necesita permiso de ubicacion para validar la geocerca.');
      return;
    }

    stopWatching();
    watchId.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, distanceInterval: 5, timeInterval: 5000 },
      (position) => {
        const coords: Coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy ?? 0,
        };
        const distanceMeters = haversine(coords, terminal.coordinates);
        setReading({
          position: coords,
          distanceMeters,
          inside: distanceMeters <= terminal.geofenceRadius,
          radiusMeters: terminal.geofenceRadius,
        });
        setState('resolved');
      },
    );
  }, [terminal, stopWatching]);

  useEffect(() => stopWatching, [stopWatching]);

  // El objeto cambia en cada render; `locate` es estable y es lo que el flujo
  // necesita encadenar.
  return { state, reading, message, locate, watch, stopWatching };
}
