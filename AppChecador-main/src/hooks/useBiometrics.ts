import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useEffect, useState } from 'react';

import { haptics } from '@/lib/haptics';

export type BiometricKind = 'face' | 'fingerprint' | 'iris' | 'passcode' | 'none';

export interface BiometricCapability {
  kind: BiometricKind;
  label: string;
  available: boolean;
  enrolled: boolean;
  securityLevel: LocalAuthentication.SecurityLevel;
  /**
   * Face ID no funciona dentro de Expo Go: Apple no expone el sensor a apps
   * cargadas como JS. Requiere development build. Sin esto, `authenticateAsync`
   * cae silenciosamente al passcode y uno cree que Face ID anda roto.
   */
  requiresDevBuild: boolean;
}

const UNKNOWN: BiometricCapability = {
  kind: 'none',
  label: 'Sin biometria',
  available: false,
  enrolled: false,
  securityLevel: LocalAuthentication.SecurityLevel.NONE,
  requiresDevBuild: false,
};

function describe(types: LocalAuthentication.AuthenticationType[]): Pick<BiometricCapability, 'kind' | 'label'> {
  // Prioridad: facial > huella > iris, siguiendo lo que espera el usuario.
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return { kind: 'face', label: 'Face ID' };
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return { kind: 'fingerprint', label: 'Huella dactilar' };
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return { kind: 'iris', label: 'Reconocimiento de iris' };
  }
  return { kind: 'none', label: 'Sin biometria' };
}

export function useBiometrics() {
  const [capability, setCapability] = useState<BiometricCapability>(UNKNOWN);
  const [isChecking, setIsChecking] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [hasHardware, enrolled, types] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        LocalAuthentication.supportedAuthenticationTypesAsync(),
      ]);
      const { kind, label } = describe(types);
      const securityLevel = await LocalAuthentication.getEnrolledLevelAsync();

      setCapability({
        kind,
        label,
        available: hasHardware,
        enrolled,
        securityLevel,
        requiresDevBuild: kind === 'face',
      });
    } catch {
      setCapability(UNKNOWN);
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Lectura de un sistema externo (el sensor biometrico del dispositivo) al
  // montar. El efecto es el mecanismo correcto aqui y `refresh` es async: los
  // `setState` ocurren DESPUES de los `await`, nunca de forma sincrona. La
  // regla `set-state-in-effect` no puede ver a traves de la referencia de
  // `refresh` y lo marca igual, asi que la exception queda documentada en vez
  // de desactivar la regla para todo el archivo.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  /**
   * Lanza el prompt del sistema. Devuelve `{ success }` sin tirar: que el
   * usuario cancele es un resultado valido, no una excepcion.
   */
  const authenticate = useCallback(
    async (reason: string): Promise<{ success: boolean; error?: string }> => {
      if (!capability.available || !capability.enrolled) {
        haptics.error();
        return { success: false, error: 'Biometria no disponible o no configurada en el dispositivo.' };
      }

      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: reason,
          cancelLabel: 'Cancelar',
          // Se permite el fallback a passcode: en un checador bloquear al
          // empleado porque el sensor falle es peor que permitirlo.
          disableDeviceFallback: false,
        });

        if (result.success) {
          haptics.success();
          return { success: true };
        }

        haptics.error();
        return { success: false, error: describeError(result.error) };
      } catch (error) {
        haptics.error();
        return { success: false, error: error instanceof Error ? error.message : 'Fallo la autenticacion.' };
      }
    },
    [capability],
  );

  return { capability, isChecking, authenticate, refresh };
}

function describeError(error: LocalAuthentication.LocalAuthenticationError | undefined): string {
  switch (error) {
    case 'user_cancel':
    case 'system_cancel':
    case 'app_cancel':
      return 'Autenticacion cancelada.';
    case 'not_enrolled':
      return 'No hay datos biometricos registrados en este dispositivo.';
    case 'lockout':
      return 'Demasiados intentos. Desbloquea el dispositivo e intenta de nuevo.';
    case 'authentication_failed':
      return 'No se pudo verificar tu identidad.';
    case 'not_available':
      return 'Este dispositivo no tiene sensor biometrico.';
    default:
      return 'No se pudo completar la autenticacion.';
  }
}
