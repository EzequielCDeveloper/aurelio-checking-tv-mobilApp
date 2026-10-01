import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import avatarAsset from '@/assets/avatar.png';
import { DEFAULT_PROFILE, DEFAULT_TERMINAL } from '@/data/config';
import {
  ApiError,
  fetchEmpleados,
  fetchHorarios,
  fetchWeekAttendance,
  login as apiLogin,
  markAttendance,
  profileFromEmpleado,
} from '@/lib/api/client';
import { verificarCredenciales } from '@/lib/auth';
import { toPunchStatus } from '@/lib/api/mapper';
import { punchSubtitle, punchTitle } from '@/lib/date';
import { deviceFingerprint, signPunch } from '@/lib/hash';
import { haptics } from '@/lib/haptics';
import { sounds } from '@/lib/sounds';
import { storage } from '@/lib/storage';
import type {
  AccessTerminal,
  AttendanceRecord,
  Coordinates,
  EmployeeSession,
  PunchType,
  UserProfile,
} from '@/types';

export interface RecordPunchInput {
  type: PunchType;
  coordinates: Coordinates;
  scannedPayload: string;
  method: string;
}

interface AttendanceContextValue {
  profile: UserProfile;
  /**
   * Terminal activo, leido de AsyncStorage. Cambiar de sede NO requiere
   * recompilar: se calibra desde Perfil y persiste entre arranques.
   */
  terminal: AccessTerminal;
  records: AttendanceRecord[];
  isLoading: boolean;
  /** Ultimo marcaje creado en esta sesion, para confirmar en pantalla. */
  latestRecord: AttendanceRecord | null;
  /** Empleado identificado. `null` mientras no hay sesion. */
  session: EmployeeSession | null;
  /** `true` cuando el servidor no responde y se opera con datos locales. */
  isOffline: boolean;
  /** Ultimo error de la API, si hubo. */
  apiError: string | null;
  /**
   * Verifica usuario y contrasena contra el registro local y abre sesion.
   *
   * El `empleado_id` NO viene de la pantalla: sale de la credencial
   * verificada. Eso es lo que hace que ya no se pueda marcar como otra persona
   * eligiendola de una lista.
   */
  signIn: (usuario: string, contrasena: string) => Promise<void>;
  recordPunch: (input: RecordPunchInput) => Promise<AttendanceRecord>;
  toggleNotifications: () => void;
  refreshProfileDevice: () => Promise<void>;
  saveTerminal: (terminal: AccessTerminal) => Promise<void>;
  logout: () => Promise<void>;
  /** Vuelve a pedir datos al servidor. */
  refresh: () => Promise<void>;
}

const AttendanceContext = createContext<AttendanceContextValue | null>(null);

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>({
    ...DEFAULT_PROFILE,
    avatar: avatarAsset,
    device: {
      model: 'Dispositivo registrado',
      uuid: 'PENDIENTE',
      isPrimary: true,
      biometricStatus: 'Por verificar',
      geofenceRadius: DEFAULT_TERMINAL.geofenceRadius,
      geofenceStatus: 'Por verificar',
    },
  });
  const [terminal, setTerminal] = useState<AccessTerminal>(DEFAULT_TERMINAL);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [latestRecord, setLatestRecord] = useState<AttendanceRecord | null>(null);
  const [session, setSession] = useState<EmployeeSession | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  /**
   * Descarga perfil e historial del servidor y los deja en estado.
   *
   * Se separa de la carga inicial para poder reutilizarla en `refresh()` sin
   * volver a leer la sesion ni el terminal de disco.
   */
  const syncFromServer = useCallback(
    async (activeSession: EmployeeSession, resolvedTerminal: AccessTerminal) => {
      const deviceUuid = profile.device.uuid === 'PENDIENTE'
        ? await deviceFingerprint()
        : profile.device.uuid;

      const [empleados, horarios] = await Promise.all([fetchEmpleados(), fetchHorarios()]);
      const empleado = empleados.find((e) => e.id === activeSession.empleadoId);

      if (!empleado) {
        // El empleado fue borrado del servidor con la app abierta.
        throw new ApiError('El empleado ya no existe en el servidor.', 404);
      }

      const horario = horarios.find((h) => h.id === empleado.horario_id) ?? null;

      const nextProfile: UserProfile = {
        ...profileFromEmpleado(empleado, horario, { avatar: avatarAsset, uuid: deviceUuid }),
        device: {
          ...profile.device,
          uuid: deviceUuid,
          geofenceRadius: resolvedTerminal.geofenceRadius,
        },
      };

      const remote = await fetchWeekAttendance(
        empleado,
        (input) => signPunch(input).then((s) => s.hash),
        resolvedTerminal.coordinates,
      );

      setProfile(nextProfile);
      setRecords(remote);
      setIsOffline(false);
      setApiError(null);
      void storage.saveProfile(nextProfile);
      void storage.saveRecords(remote);
    },
    [profile],
  );

  // Carga inicial: sesion -> terminal -> servidor (o local si no hay red).
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [storedSession, storedTerminal, storedRecords] = await Promise.all([
        storage.loadSession(),
        storage.loadTerminal(),
        storage.loadRecords(),
      ]);

      const resolvedTerminal = storedTerminal ?? DEFAULT_TERMINAL;

      let resolvedProfile: UserProfile = {
        ...DEFAULT_PROFILE,
        avatar: avatarAsset,
        device: {
          model: 'Dispositivo registrado',
          uuid: 'PENDIENTE',
          isPrimary: true,
          biometricStatus: 'Por verificar',
          geofenceRadius: resolvedTerminal.geofenceRadius,
          geofenceStatus: 'Por verificar',
        },
      };

      if (storedSession) {
        try {
          // El perfil del servidor reemplaza al local por completo: nombre,
          // turno y tolerancia salen de la base, no del prototipo.
          const empleados = await fetchEmpleados();
          const horarios = await fetchHorarios();
          const empleado = empleados.find((e) => e.id === storedSession.empleadoId);

          if (empleado) {
            const deviceUuid = await deviceFingerprint();
            const horario = horarios.find((h) => h.id === empleado.horario_id) ?? null;
            resolvedProfile = {
              ...profileFromEmpleado(empleado, horario, {
                avatar: avatarAsset,
                uuid: deviceUuid,
              }),
              device: {
                ...resolvedProfile.device,
                uuid: deviceUuid,
                geofenceRadius: resolvedTerminal.geofenceRadius,
              },
            };
            void storage.saveProfile(resolvedProfile);
          }

          const remote = await fetchWeekAttendance(
            empleado ?? null,
            (input) => signPunch(input).then((s) => s.hash),
            resolvedTerminal.coordinates,
          );

          // Se sobreescribe el cache local aunque venga vacio: un historial
          // limpio del servidor es la verdad, y un cache viejo con marcajes
          // que el servidor ya no tiene es peor que no mostrar nada.
          void storage.saveRecords(remote);

          if (!cancelled) {
            setRecords(remote);
            setIsOffline(false);
          }
        } catch (error) {
          // Servidor caido: se arranca con lo que hay en disco. La app no debe
          // dejar de funcionar por una outage del backend.
          if (!cancelled) {
            setIsOffline(true);
            setApiError(error instanceof Error ? error.message : 'No se pudo sincronizar con el servidor.');
            setRecords(storedRecords);
          }
        }
      } else if (storedRecords.length > 0) {
        resolvedProfile = (await storage.loadProfile()) ?? resolvedProfile;
        if (!cancelled) setRecords(storedRecords);
      }

      if (cancelled) return;
      setSession(storedSession);
      setProfile(resolvedProfile);
      setTerminal(resolvedTerminal);
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(
    async (usuario: string, contrasena: string) => {
      // Primero la credencial: si falla, no se toca la red ni se abre sesion.
      const credencial = await verificarCredenciales(usuario, contrasena);

      // Despues se confirma contra el servidor que la ficha siga vigente.
      const nextSession = await apiLogin(credencial.empleadoId);
      await storage.saveSession(nextSession);
      setSession(nextSession);

      try {
        await syncFromServer(nextSession, terminal);
      } catch (error) {
        setIsOffline(true);
        setApiError(error instanceof Error ? error.message : 'No se pudo sincronizar con el servidor.');
      }
    },
    [syncFromServer, terminal],
  );

  const refresh = useCallback(async () => {
    const activeSession = session ?? (await storage.loadSession());
    if (!activeSession) return;
    try {
      await syncFromServer(activeSession, terminal);
    } catch (e) {
      setApiError(e instanceof ApiError ? e.message : 'No se pudo sincronizar.');
      setIsOffline(true);
    }
  }, [session, syncFromServer, terminal]);

  const logout = useCallback(async () => {
    await storage.clearSession();
    setSession(null);
    setLatestRecord(null);
    setRecords([]);
    setIsOffline(false);
    setApiError(null);
    setProfile({
      ...DEFAULT_PROFILE,
      avatar: avatarAsset,
      device: {
        model: 'Dispositivo registrado',
        uuid: 'PENDIENTE',
        isPrimary: true,
        biometricStatus: 'Por verificar',
        geofenceRadius: terminal.geofenceRadius,
        geofenceStatus: 'Por verificar',
      },
    });
  }, [terminal.geofenceRadius]);

  /** Persiste un terminal nuevo y lo refleja de inmediato en el perfil. */
  const saveTerminal = useCallback(async (next: AccessTerminal) => {
    setTerminal(next);
    await storage.saveTerminal(next);
    setProfile((prev) => {
      const updated: UserProfile = {
        ...prev,
        device: { ...prev.device, geofenceRadius: next.geofenceRadius },
      };
      void storage.saveProfile(updated);
      return updated;
    });
  }, []);

  const recordPunch = useCallback(
    async ({ type, coordinates, scannedPayload, method }: RecordPunchInput) => {
      // Sin sesion no hay `empleado_id` que enviar. Se corta aca en vez de
      // mandar `undefined` y que el servidor lo rechace con un 400 opaco.
      if (!session) {
        throw new ApiError('Identificate antes de registrar un marcaje.', 401);
      }

      // 1. El servidor es la fuente de verdad de hora y estado. Se registra
      //    primero y el registro local se arma con lo que DEVUELVE, no con lo
      //    que la app cree. Si el celular tiene la hora mal, el estado sale
      //    igual bien.
      const server = await markAttendance(session.empleadoId, type);
      const serverTimestamp = Date.now();

      const { hash } = await signPunch({
        userId: String(session.empleadoId),
        type,
        timestamp: serverTimestamp,
        location: terminal.name,
        coordinates,
        scannedPayload,
      });

      const record: AttendanceRecord = {
        id: `srv-${server.recordId}`,
        type,
        title: punchTitle(type),
        subtitle: punchSubtitle(type),
        location: terminal.name,
        timestamp: serverTimestamp,
        status: toPunchStatus(server.estado),
        method,
        hash,
        coordinates,
        scannedPayload,
      };

      setRecords((prev) => {
        const next = [record, ...prev];
        void storage.saveRecords(next);
        return next;
      });
      setLatestRecord(record);
      haptics.success();
      sounds.success();

      return record;
    },
    [session, terminal],
  );

  const toggleNotifications = useCallback(() => {
    setProfile((prev) => {
      const next = { ...prev, notificationsEnabled: !prev.notificationsEnabled };
      void storage.saveProfile(next);
      return next;
    });
  }, []);

  /** Sincroniza el bloque de dispositivo con lo que reportan los sensores. */
  const refreshProfileDevice = useCallback(async () => {
    setProfile((prev) => {
      const next: UserProfile = {
        ...prev,
        device: {
          ...prev.device,
          biometricStatus: 'Verificado en la ultima marcacion',
          geofenceStatus: 'Activa',
        },
      };
      void storage.saveProfile(next);
      return next;
    });
  }, []);

  const value = useMemo<AttendanceContextValue>(
    () => ({
      profile,
      terminal,
      records,
      isLoading,
      latestRecord,
      session,
      isOffline,
      apiError,
      signIn,
      recordPunch,
      toggleNotifications,
      refreshProfileDevice,
      saveTerminal,
      logout,
      refresh,
    }),
    [
      profile,
      terminal,
      records,
      isLoading,
      latestRecord,
      session,
      isOffline,
      apiError,
      signIn,
      recordPunch,
      toggleNotifications,
      refreshProfileDevice,
      saveTerminal,
      logout,
      refresh,
    ],
  );

  return <AttendanceContext.Provider value={value}>{children}</AttendanceContext.Provider>;
}

export function useAttendance(): AttendanceContextValue {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance debe usarse dentro de <AttendanceProvider>.');
  }
  return context;
}
