import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BioIcon } from '@/components/BioIcon';
import { QrScanner } from '@/components/QrScanner';
import { Screen } from '@/components/Screen';
import { Card, FilledButton } from '@/components/ui';
import { useAttendance } from '@/context/AttendanceProvider';
import { GEOFENCE_ENFORCED } from '@/data/config';
import { useBiometrics } from '@/hooks/useBiometrics';
import { useGeofence } from '@/hooks/useGeofence';
import { punchTitle } from '@/lib/date';
import { haptics } from '@/lib/haptics';
import { validateScan } from '@/lib/qr';
import { colors } from '@/theme/tokens';
import type { PunchType } from '@/types';

type Step = 'scan' | 'geofence' | 'biometrics' | 'signing' | 'done';

const STEP_COPY: Record<Step, { title: string; detail: string }> = {
  scan: { title: 'Escaneando', detail: 'Acerca el codigo QR del terminal' },
  geofence: { title: 'Validando ubicación', detail: 'Obteniendo tu posición por GPS' },
  biometrics: { title: 'Verificando identidad', detail: 'Confirmá con tu biometría' },
  signing: { title: 'Firmando marcaje', detail: 'Generando hash SHA-256' },
  done: { title: 'Listo', detail: '' },
};

export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const { profile, recordPunch, refreshProfileDevice, session, terminal } = useAttendance();
  const [step, setStep] = useState<Step>('scan');
  const [error, setError] = useState<string | null>(null);
  const { capability, authenticate } = useBiometrics();
  // Se desestructura `locate`: la regla de deps exige el objeto `geofence`
  // entero, que se recrea en cada render y rearmaria el callback sin motivo.
  const { locate } = useGeofence(terminal);

  /** Que marcaje corresponde a la hora actual, contra el turno configurado. */
  const punchTypeForNow = useCallback((): PunchType => {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const [exitH, exitM] = profile.schedule.exitTime.split(':').map(Number);

    return minutes >= exitH * 60 + exitM ? 'salida' : 'entrada';
  }, [profile.schedule.exitTime]);

  /**
   * El QR solo habilita el intento: geocerca y biometria se validan aparte.
   * Aceptar el codigo y firmar en el mismo paso seria marcaje automatico.
   */
  const handleScanned = useCallback(
    async (raw: string) => {
      const result = validateScan(raw, { terminalId: terminal.id, userId: profile.id });

      if (!result.ok) {
        haptics.error();
        setError(result.detail);
        return;
      }

      try {
        setError(null);
        setStep('geofence');
        const reading = await locate();
        if (!reading) {
          haptics.error();
          setError('No se pudo determinar tu ubicación.');
          setStep('scan');
          return;
        }

        if (GEOFENCE_ENFORCED && !reading.inside) {
          haptics.error();
          setError(
            `Estas a ${Math.round(reading.distanceMeters)} m del terminal. ` +
              `El radio permitido es de ${reading.radiusMeters} m.`,
          );
          setStep('scan');
          return;
        }

        setStep('biometrics');
        const auth = await authenticate('Confirmá tu marcaje de asistencia');
        if (!auth.success) {
          setError(auth.error ?? 'No se pudo verificar tu identidad.');
          setStep('scan');
          return;
        }

        setStep('signing');
        const type = punchTypeForNow();
        await recordPunch({
          type,
          coordinates: reading.position,
          scannedPayload: raw,
          method: `QR + ${capability.label}`,
        });
        await refreshProfileDevice();
        setStep('done');
      } catch (cause) {
        haptics.error();
        setError(cause instanceof Error ? cause.message : 'No se pudo registrar el marcaje.');
        setStep('scan');
      }
    },
    [
      profile.id,
      terminal.id,
      locate,
      authenticate,
      recordPunch,
      refreshProfileDevice,
      capability.label,
      punchTypeForNow,
    ],
  );

  if (session === null) {
    return <Redirect href="/login" />;
  }

  if (step === 'done') {
    return (
      <Screen className="justify-center px-6">
        <Card className="items-center border-brand-100 px-6 py-8">
          <View className="h-20 w-20 items-center justify-center rounded-3xl bg-success-soft">
            <BioIcon name="check_circle" size={42} color={colors.emerald[600]} />
          </View>
          <Text className="mt-5 font-display text-[22px] text-ink">Marcaje registrado</Text>
          <Text className="mt-2 text-center text-[12px] leading-5 text-ink-soft">
            {punchTitle(punchTypeForNow())}. La firma SHA-256 quedó guardada.
          </Text>
          <View className="mt-7 w-full">
            <FilledButton label="Volver al checador" icon="check" onPress={() => router.back()} />
          </View>
        </Card>
      </Screen>
    );
  }

  if (step !== 'scan') {
    const copy = STEP_COPY[step];
    return (
      <Screen className="items-center justify-center px-8">
        <View className="h-20 w-20 items-center justify-center rounded-3xl bg-primary-soft">
          <ActivityIndicator size="large" color={colors.brand[500]} />
        </View>
        <Text className="mt-5 font-display text-[18px] text-ink">{copy.title}</Text>
        <Text className="mt-1 text-center text-[12px] leading-5 text-ink-soft">{copy.detail}</Text>
        <View className="mt-6 h-1 w-24 overflow-hidden rounded-full bg-brand-100">
          <View className="h-full w-2/3 rounded-full bg-primary" />
        </View>
      </Screen>
    );
  }

  return (
    <View className="flex-1">
      <StatusBar style="light" />
      <QrScanner active onScanned={handleScanned} onClose={() => router.back()} />
      {error ? (
        <View
          className="absolute left-4 right-4 flex-row items-center rounded-2xl border border-danger/20 bg-danger-soft p-3.5 shadow-card"
          style={{ top: insets.top + 12 }}
        >
          <BioIcon name="warning" size={20} color={colors.rose[700]} />
          <Text className="ml-2.5 flex-1 text-[11px] font-semibold leading-4 text-danger-ink">{error}</Text>
        </View>
      ) : null}
    </View>
  );
}
