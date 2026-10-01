import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Image, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';

import { PageHeading, Screen } from '@/components/Screen';
import { Card, FilledButton, IconTile, SectionTitle } from '@/components/ui';
import { useAttendance } from '@/context/AttendanceProvider';
import {
  GEOFENCE_ENFORCED,
  MAX_GEOFENCE_RADIUS,
  MIN_GEOFENCE_RADIUS,
} from '@/data/config';
import { useBiometrics } from '@/hooks/useBiometrics';
import { useGeofence } from '@/hooks/useGeofence';
import { haptics } from '@/lib/haptics';
import { colors } from '@/theme/tokens';

export default function ProfileScreen() {
  const { profile, terminal, toggleNotifications, saveTerminal, logout } = useAttendance();
  const { capability, isChecking } = useBiometrics();
  const geofence = useGeofence(terminal);
  const logoutInFlight = useRef(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const changeEmployee = async () => {
    if (logoutInFlight.current) return;
    logoutInFlight.current = true;
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      logoutInFlight.current = false;
      setIsLoggingOut(false);
    }
  };

  const setRadius = (radius: number) => {
    const clamped = Math.min(MAX_GEOFENCE_RADIUS, Math.max(MIN_GEOFENCE_RADIUS, radius));
    haptics.tick();
    void saveTerminal({ ...terminal, geofenceRadius: clamped });
  };

  /** Reubica el centro de la geocerca a donde estoy parado ahora. */
  const recalibrate = async () => {
    const reading = await geofence.locate();
    if (!reading) return;
    haptics.success();
    await saveTerminal({
      ...terminal,
      coordinates: reading.position,
    });
  };

  const rename = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    void saveTerminal({ ...terminal, name: trimmed });
  };

  const reading = geofence.reading;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <PageHeading
          eyebrow="Cuenta"
          title="Mi perfil"
          detail="Identidad, dispositivo y configuración del terminal"
        />

        <Card className="flex-row items-center border-brand-100 bg-primary-soft p-5">
          <View className="rounded-full border-2 border-white p-0.5 shadow-card">
            <Image source={profile.avatar} style={{ width: 68, height: 68, borderRadius: 34 }} />
          </View>
          <View className="ml-4 flex-1">
            <Text className="font-display text-[17px] text-ink">{profile.name}</Text>
            <Text className="mt-0.5 text-[11px] text-ink-soft">
              {profile.role} · {profile.department}
            </Text>
            <View className="mt-2 self-start rounded-full border border-brand-200 bg-white px-3 py-1">
              <Text className="text-[9px] font-bold uppercase tracking-wide text-primary">
                {profile.securityLevel}
              </Text>
            </View>
          </View>
        </Card>

        <SectionTitle>Dispositivo</SectionTitle>
        <Card>
          <View className="flex-row items-center">
            <IconTile name="my_location" tone="primary" />
            <View className="ml-3 flex-1">
              <Text className="text-[12px] font-semibold text-ink">Identificador del equipo</Text>
              <Text className="font-mono text-[10px] text-ink-soft">{profile.device.uuid}</Text>
            </View>
          </View>

          <View className="mt-3 flex-row items-center">
            <IconTile
              name="fingerprint"
              tone={capability.available && capability.enrolled ? 'success' : 'warning'}
            />
            <View className="ml-3 flex-1">
              <Text className="text-[12px] font-semibold text-ink">
                {isChecking ? 'Verificando sensor...' : capability.label}
              </Text>
              <Text className="text-[10px] text-ink-soft">
                {capability.requiresDevBuild
                  ? 'Requiere development build: Face ID no existe en Expo Go.'
                  : capability.enrolled
                    ? 'Biometría activa en este dispositivo'
                    : 'Sin biometría registrada en este dispositivo'}
              </Text>
            </View>
          </View>
        </Card>

        <SectionTitle>Terminal asignado</SectionTitle>
        <Card>
          <Text className="text-[10px] leading-4 text-ink-soft">
            La geocerca se mide contra estas coordenadas. Se calibra una vez por sede y
            queda guardada en el dispositivo.
          </Text>

          <View className="mt-3">
            <Text className="text-[9px] font-semibold uppercase tracking-wide text-ink-soft">
              ID del terminal
            </Text>
            <View className="mt-1 self-start rounded-xl border border-brand-100 bg-primary-soft px-2.5 py-1.5">
              <Text className="font-mono text-[11px] font-semibold text-primary">
                {terminal.id}
              </Text>
            </View>
          </View>

          <View className="mt-3">
            <Text className="text-[9px] font-semibold uppercase tracking-wide text-ink-soft">
              Nombre
            </Text>
            <TextInput
              value={terminal.name}
              onChangeText={rename}
              onEndEditing={() => rename(terminal.name)}
              placeholder="Torniquete Principal"
              placeholderTextColor={colors.slate[400]}
              className="mt-1 min-h-12 rounded-xl border border-line bg-white px-3 py-2 text-[12px] text-ink"
            />
          </View>

          <View className="mt-3">
            <Text className="text-[9px] font-semibold uppercase tracking-wide text-ink-soft">
              Coordenadas del centro
            </Text>
            <Text className="mt-1 font-mono text-[11px] text-ink">
              {terminal.coordinates.latitude.toFixed(6)}, {terminal.coordinates.longitude.toFixed(6)}
            </Text>
          </View>

          <View className="mt-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-[9px] font-semibold uppercase tracking-wide text-ink-soft">
                Radio permitido
              </Text>
              <Text className="text-[12px] font-bold text-ink">{terminal.geofenceRadius} m</Text>
            </View>

            <View className="mt-2 flex-row items-center gap-2">
              <Stepper
                icon="remove"
                onPress={() => setRadius(terminal.geofenceRadius - 25)}
              />
              <View className="flex-1">
                <View className="h-1.5 w-full rounded-full bg-line" />
                <View
                  className="absolute h-1.5 rounded-full bg-primary"
                  style={{
                    left: 0,
                    width: `${
                      ((terminal.geofenceRadius - MIN_GEOFENCE_RADIUS) /
                        (MAX_GEOFENCE_RADIUS - MIN_GEOFENCE_RADIUS)) *
                      100
                    }%`,
                  }}
                />
              </View>
              <Stepper icon="add" onPress={() => setRadius(terminal.geofenceRadius + 25)} />
            </View>

            <Text className="mt-1.5 text-[9px] leading-4 text-ink-faint">
              Permitido: {MIN_GEOFENCE_RADIUS}–{MAX_GEOFENCE_RADIUS} m. Menos de 80 m produce
              falsos rechazos por error de GPS en interiores.
            </Text>
          </View>

          <Divider />

          <View className="flex-row items-center">
            <IconTile name="my_location" tone={reading?.inside ? 'success' : 'muted'} />
            <View className="ml-3 flex-1">
              <Text className="text-[12px] font-semibold text-ink">Tu posición actual</Text>
              <Text className="text-[10px] text-ink-soft">
                {geofence.state === 'locating'
                  ? 'Obteniendo fix GPS...'
                  : reading
                    ? `${Math.round(reading.distanceMeters)} m del centro · ${
                        reading.inside ? 'dentro' : 'fuera'
                      }`
                    : 'Sin fix GPS'}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => void geofence.locate()}
              className="min-h-10 justify-center rounded-xl border border-brand-200 bg-primary-soft px-3"
            >
              <Text className="text-[10px] font-semibold text-primary">Medir</Text>
            </Pressable>
          </View>

          {geofence.message ? (
            <Text className="mt-2 text-[10px] text-danger-ink">{geofence.message}</Text>
          ) : null}

          <View className="mt-4 rounded-2xl border border-warning/30 bg-warning-soft p-3.5">
            <Text className="text-[10px] font-semibold text-warning-ink">
              Recalibrar en esta ubicación
            </Text>
            <Text className="mt-0.5 text-[10px] text-warning-ink">
              Usalo si cambiaste de sede. Parate en el torniquete y tocá recalibrar.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void recalibrate()}
              className="mt-3 min-h-11 items-center justify-center rounded-xl bg-primary px-4 py-2.5"
            >
              <Text className="text-[12px] font-bold text-white">
                Usar mi posición actual como sede
              </Text>
            </Pressable>
          </View>

          <Text className="mt-3 text-[9px] text-ink-faint">
            {GEOFENCE_ENFORCED
              ? 'Validación activa: un marcaje fuera del radio se rechaza.'
              : 'Validación desactivada en esta compilación.'}
          </Text>
        </Card>

        <SectionTitle>Preferencias</SectionTitle>
        <Card>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <IconTile name="info" tone="muted" />
              <View className="ml-3">
                <Text className="text-[12px] font-semibold text-ink">Notificaciones</Text>
                <Text className="text-[10px] text-ink-soft">Avisos de marcaje y retardos</Text>
              </View>
            </View>
            <Switch
              value={profile.notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ true: colors.brand[500] }}
            />
          </View>
        </Card>

        <View className="mt-5">
          <FilledButton
            label="Cambiar empleado"
            icon="logout"
            tone="ghost"
            disabled={isLoggingOut}
            onPress={() => void changeEmployee()}
          />
        </View>

        <Text className="mt-6 text-center text-[10px] text-ink-faint">
          BioCheck Sentinel v1.0.0 · marcajes firmados con SHA-256
        </Text>
      </ScrollView>
    </Screen>
  );
}

function Stepper({
  icon,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="h-11 w-11 items-center justify-center rounded-xl border border-brand-200 bg-primary-soft"
    >
      <Ionicons name={icon} size={17} color={colors.brand[500]} />
    </Pressable>
  );
}

function Divider() {
  return <View className="my-3 h-px bg-line" />;
}
