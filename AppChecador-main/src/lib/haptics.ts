import * as Haptics from 'expo-haptics';

/**
 * Retroceso tactil.
 *
 * En un checador de asistencia el toque importa: acerte o falle la marcacion,
 * el dedo tiene que sentir el resultado sin mirar la pantalla.
 * Es la pieza que en el web no existia y que en nativo sale gratis.
 */
const safe = (fn: () => Promise<void>) => {
  fn().catch(() => {
    // El dispositivo no tiene motor haptico: no es un error.
  });
};

export const haptics = {
  tick: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** La app entra en modo escaneo. */
  scan: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  /** Marcacion aceptada. */
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** Marcacion rechazada o permiso denegado. */
  error: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  /** Patron de tres pulsos: QR invalido. */
  warn: () =>
    safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};
