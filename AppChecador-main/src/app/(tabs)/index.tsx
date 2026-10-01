import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';

import { PageHeading, Screen } from '@/components/Screen';
import { Toast, type ToastPayload } from '@/components/Toast';
import { Card, Chip, EmptyState, IconTile, SectionTitle, StatusPill } from '@/components/ui';
import { GEOFENCE_ENFORCED } from '@/data/config';
import { useAttendance } from '@/context/AttendanceProvider';
import { useBiometrics } from '@/hooks/useBiometrics';
import { useClock } from '@/hooks/useClock';
import { useGeofence } from '@/hooks/useGeofence';
import { formatTime, relativeDayLabel } from '@/lib/date';
import { colors } from '@/theme/tokens';

export default function ChecadorScreen() {
  const { profile, terminal, records, isLoading, latestRecord, isOffline, apiError, refresh } =
    useAttendance();
  const now = useClock();
  const geofence = useGeofence(terminal);
  const biometrics = useBiometrics();

  const lastRecord = records[0] ?? null;
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const [toastedId, setToastedId] = useState<string | null>(null);

  // Aviso al volver del scanner: el marcaje se registro en otra pantalla y sin
  // feedback el empleado no sabe si quedo guardado.
  //
  // Se ajusta DURANTE el render y no en un efecto: el toast no es estado
  // derivado que se sincroniza, es la reaccion a un evento (llego un marcaje
  // nuevo). Hacerlo en un efecto obligaba a un segundo render en cascada para
  // pintar algo que ya se sabe. Es el patron que React documenta para "ajustar
  // estado cuando cambia una prop", y `toastedId` evita que se repita.
  if (latestRecord && latestRecord.id !== toastedId) {
    setToastedId(latestRecord.id);
    setToast({
      tone: 'success',
      title: latestRecord.title,
      detail: `Registrado a las ${formatTime(latestRecord.timestamp).slice(0, 5)}`,
    });
  }

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  /** El backend actual solo admite entrada y salida de jornada. */
  const nextPunch = useMemo(() => {
    const minutes = hour * 60 + now.getMinutes();
    const [entryH, entryM] = profile.schedule.entryTime.split(':').map(Number);
    const [exitH, exitM] = profile.schedule.exitTime.split(':').map(Number);
    const entry = entryH * 60 + entryM;
    const exit = exitH * 60 + exitM;

    if (minutes < entry) return 'entrada';
    return minutes < exit ? 'entrada' : 'salida';
  }, [hour, now, profile.schedule.entryTime, profile.schedule.exitTime]);

  const NEXT_LABEL: Record<string, string> = {
    entrada: 'Registrar entrada',
    salida: 'Registrar salida',
  };

  if (isLoading) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator color={colors.brand[500]} size="large" />
        <Text className="mt-3 text-[12px] text-ink-soft">Preparando tu jornada...</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <PageHeading
          eyebrow={greeting}
          title={profile.name}
          detail={`${profile.role} · ${profile.department}`}
          right={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir mi perfil"
              onPress={() => router.push('/profile')}
              className="rounded-full border-2 border-brand-100 p-0.5"
            >
              <Image
                source={profile.avatar}
                style={{ width: 44, height: 44, borderRadius: 22 }}
              />
            </Pressable>
          }
        />

        {isOffline || apiError ? (
          <View className="mb-4 flex-row rounded-2xl border border-warning/30 bg-warning-soft p-3.5">
            <Ionicons name="cloud-offline-outline" size={20} color={colors.amber[700]} />
            <View className="ml-3 flex-1">
              <Text className="text-[11px] leading-4 text-warning-ink">
                {apiError ?? 'Sin conexión. Se muestran los datos guardados en el dispositivo.'}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void refresh()}
                className="mt-1 min-h-8 justify-center self-start"
              >
                <Text className="text-[11px] font-bold text-primary">
                  Reintentar sincronización
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* Reloj: el prototipo lo actualizaba con un interval que seteaba
            estado en el padre y rerenderizaba la pantalla completa. */}
        <Card className="overflow-hidden border-brand-100 bg-primary-soft px-5 py-5">
          <View className="flex-row items-center justify-between">
            <Text className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
              {relativeDayLabel(now.getTime())}
            </Text>
            <View className="flex-row items-center rounded-full bg-white px-2.5 py-1">
              <View className="h-1.5 w-1.5 rounded-full bg-success" />
              <Text className="ml-1.5 text-[9px] font-semibold text-ink-soft">En línea</Text>
            </View>
          </View>
          <Text className="mt-2 font-display text-[48px] leading-[54px] text-ink">
            {formatTime(now.getTime())}
          </Text>
          <View className="mt-2 flex-row items-center">
            <Ionicons name="business-outline" size={14} color={colors.brand[500]} />
            <Text className="ml-1.5 flex-1 text-[11px] text-ink-soft">
              Turno {profile.schedule.shiftName} · {terminal.name}
            </Text>
          </View>
        </Card>

        <View className="mt-3 flex-row gap-2.5">
          <Chip label="Entrada" value={profile.schedule.entryTime} tone="primary" />
          <Chip label="Tolerancia" value={`${profile.schedule.toleranceMinutes} min`} />
          <Chip label="Salida" value={profile.schedule.exitTime} />
        </View>

        <SectionTitle>Verificación</SectionTitle>
        <Card>
          {/*
            Estos chipsaben decir "Verificado" / "Dentro de geocerca" siempre,
            sin consultar ningun sensor. Ahora cada estado se deriva de lo que
            reportan los hooks; "sin comprobar" es un estado valido y visible.
          */}
          <StatusRow
            icon="my_location"
            label="Geocerca"
            value={
              geofence.state === 'resolved' && geofence.reading
                ? `${Math.round(geofence.reading.distanceMeters)} m del centro · radio ${geofence.reading.radiusMeters} m`
                : GEOFENCE_ENFORCED
                  ? `Sin comprobar · radio ${terminal.geofenceRadius} m`
                  : 'Desactivada en esta compilación'
            }
            ok={geofence.reading?.inside ?? false}
            pending={geofence.state !== 'resolved'}
          />
          <Divider />
          <StatusRow
            icon="fingerprint"
            label="Biometría"
            value={
              biometrics.isChecking
                ? 'Comprobando sensor...'
                : biometrics.capability.enrolled
                  ? `${biometrics.capability.label} registrada`
                  : 'Sin biometría en este dispositivo'
            }
            ok={biometrics.capability.enrolled && biometrics.capability.available}
            pending={biometrics.isChecking}
          />
          <Divider />
          <StatusRow
            icon="domain"
            label="Credencial"
            value={`${profile.id} · ${profile.department}`}
            ok
          />
        </Card>

        <SectionTitle>Acción principal</SectionTitle>
        <Card className="items-center border-brand-100 py-7">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={NEXT_LABEL[nextPunch]}
            onPress={() => router.push('/scanner')}
            className="h-36 w-36 items-center justify-center rounded-full border-[3px] border-brand-200 bg-primary-soft shadow-brand-glow"
          >
            <View className="h-28 w-28 items-center justify-center rounded-full bg-primary">
              <Ionicons name="scan-circle" size={46} color="#ffffff" />
            </View>
          </Pressable>
          <Text className="mt-5 text-[15px] font-bold text-ink">{NEXT_LABEL[nextPunch]}</Text>
          <Text className="mt-1 text-center text-[11px] leading-5 text-ink-soft">
            Escaneá el QR del terminal para validar tu ubicación y biometría
          </Text>
        </Card>

        <SectionTitle>Último marcaje</SectionTitle>
        {lastRecord ? (
          <Card>
            <View className="flex-row items-center">
              <IconTile
                name={lastRecord.type === 'entrada' ? 'schedule' : 'logout'}
                tone={lastRecord.status === 'Retardo' ? 'danger' : 'success'}
              />
              <View className="ml-3 flex-1">
                <Text className="text-[13px] font-bold text-ink">{lastRecord.title}</Text>
                <Text className="text-[11px] text-ink-soft">
                  {relativeDayLabel(lastRecord.timestamp)} ·{' '}
                  {formatTime(lastRecord.timestamp)}
                </Text>
              </View>
              <StatusPill status={lastRecord.status} />
            </View>

            <View className="mt-3 rounded-2xl border border-brand-100 bg-primary-soft p-3">
              <Text className="text-[9px] font-semibold uppercase tracking-wide text-ink-soft">
                Firma SHA-256
              </Text>
              <Text className="mt-0.5 font-mono text-[10px] text-primary">
                {lastRecord.hash}
              </Text>
            </View>

            <View className="mt-2 flex-row items-center">
              <Ionicons name="navigate-circle-outline" size={14} color={colors.slate[500]} />
              <Text className="ml-1 text-[10px] text-ink-soft">{lastRecord.location}</Text>
            </View>
          </Card>
        ) : (
          <EmptyState
            icon="history"
            title="Todavía no hay marcajes"
            detail="Tu próxima entrada o salida aparecerá acá con su firma digital."
          />
        )}

        <SectionTitle>Detalle de jornada</SectionTitle>
        <Card>
          <InfoLine label="Terminal" value={terminal.name} />
          <Divider />
          <InfoLine label="Turno" value={profile.schedule.shiftName} />
          <Divider />
          <InfoLine label="Días" value={profile.schedule.workdays} />
          <Divider />
          <InfoLine label="Carga semanal" value={profile.schedule.hoursPerWeek} />
          <Divider />
          <InfoLine label="Descanso" value={profile.schedule.payrollNote} />
        </Card>
      </ScrollView>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </Screen>
  );
}

function StatusRow({
  icon,
  label,
  value,
  ok,
  pending = false,
}: {
  icon: Parameters<typeof IconTile>[0]['name'];
  label: string;
  value: string;
  ok: boolean;
  pending?: boolean;
}) {
  return (
    <View className="flex-row items-center py-1.5">
      <IconTile name={icon} tone={pending ? 'muted' : ok ? 'success' : 'warning'} />
      <View className="ml-3 flex-1">
        <Text className="text-[12px] font-semibold text-ink">{label}</Text>
        <Text className="text-[10px] text-ink-soft">{value}</Text>
      </View>
      {pending ? (
        <ActivityIndicator size="small" color={colors.slate[400]} />
      ) : (
        <Ionicons
          name={ok ? 'checkmark-circle' : 'alert-circle'}
          size={18}
          color={ok ? colors.emerald[600] : colors.amber[600]}
        />
      )}
    </View>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <Text className="text-[11px] text-ink-soft">{label}</Text>
      <Text className="text-[11px] font-semibold text-ink">{value}</Text>
    </View>
  );
}

function Divider() {
  return <View className="my-1 h-px bg-line" />;
}
