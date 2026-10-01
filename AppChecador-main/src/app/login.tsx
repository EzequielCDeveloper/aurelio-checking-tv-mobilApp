import { useCallback, useState } from 'react';
import { Redirect } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { USUARIOS_CONOCIDOS } from '@/data/credentials';
import { BioIcon } from '@/components/BioIcon';
import { Brand, Screen } from '@/components/Screen';
import { FilledButton } from '@/components/ui';
import { useAttendance } from '@/context/AttendanceProvider';
import { ApiError, NetworkError } from '@/lib/api/client';
import { AuthError, ThrottledError } from '@/lib/auth';
import { colors } from '@/theme/tokens';

/**
 * Ingreso con usuario y contrasena.
 *
 * Antes esta pantalla era una lista de empleados y cualquiera elegia a quien
 * queria. Ahora la sesion queda atada a la credencial verificada: el
 * `empleado_id` lo aporta la contrasena, no la eleccion del usuario.
 *
 * La contrasena se verifica contra el registro local (src/lib/auth.ts). NO es
 * autenticacion real: el backend no tiene login y el bundle viaja al telefono
 * con los hashes adentro. Ver la nota larga de src/data/credentials.ts.
 */
export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, session } = useAttendance();
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = useCallback(async () => {
    if (usuario.trim().length === 0 || contrasena.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      await signIn(usuario, contrasena);
    } catch (e) {
      // El mensaje de credenciales es generico a proposito: no revela si el
      // usuario existe o si la contrasena esta mal.
      if (e instanceof ThrottledError || e instanceof AuthError) {
        setError(e.message);
      } else if (e instanceof NetworkError) {
        setError('No se pudo conectar con el servidor de asistencia.');
      } else if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError('No se pudo iniciar sesión.');
      }
      setLoading(false);
    }
  }, [contrasena, signIn, usuario]);

  const puedeEnviar = usuario.trim().length > 0 && contrasena.length > 0 && !loading;

  if (session !== null) {
    return <Redirect href="/" />;
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-5 pt-3">
            <View className="mb-7 flex-row items-center justify-between">
              <Brand />
              <View className="rounded-full border border-brand-100 bg-primary-soft px-3 py-1.5">
                <Text className="text-[9px] font-bold uppercase tracking-[0.12em] text-primary">
                  Acceso seguro
                </Text>
              </View>
            </View>

            <View className="rounded-3xl border border-brand-100 bg-primary-soft px-5 py-5">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-brand-soft">
                <BioIcon name="fingerprint" size={26} color="#ffffff" />
              </View>
              <Text className="mt-5 font-display text-[25px] leading-8 text-ink">
                Iniciar sesión
              </Text>
              <Text className="mt-1 text-[12px] leading-5 text-ink-soft">
                Ingresá con tu usuario para marcar asistencia.
              </Text>
            </View>
          </View>

          <View className="px-5">
            {error ? (
              <View className="mt-4 flex-row items-start gap-2 rounded-xl border border-danger bg-danger-soft p-3">
                <BioIcon name="alert" size={16} color={colors.rose[600]} />
                <Text className="flex-1 text-[12px] leading-5 text-danger-ink">{error}</Text>
              </View>
            ) : null}

            <View className="mt-5">
              <Text className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-soft">
                Usuario
              </Text>
              <View className="flex-row items-center rounded-2xl border border-line bg-card px-4 shadow-card">
                <BioIcon name="person" size={17} color={colors.slate[400]} />
                <TextInput
                  className="ml-3 flex-1 py-3.5 text-[14px] font-semibold text-ink"
                  value={usuario}
                  onChangeText={setUsuario}
                  placeholder="ana"
                  placeholderTextColor={colors.slate[400]}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  editable={!loading}
                />
              </View>
            </View>

            <View className="mt-4">
              <Text className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-soft">
                Contraseña
              </Text>
              <View className="flex-row items-center rounded-2xl border border-line bg-card px-4 shadow-card">
                <BioIcon name="lock" size={17} color={colors.slate[400]} />
                <TextInput
                  className="ml-3 flex-1 py-3.5 text-[14px] font-semibold text-ink"
                  value={contrasena}
                  onChangeText={setContrasena}
                  placeholder="••••••••"
                  placeholderTextColor={colors.slate[400]}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="go"
                  onSubmitEditing={() => {
                    void handleLogin();
                  }}
                  editable={!loading}
                />
              </View>
            </View>

            <View className="mt-6">
              <FilledButton
                label="Entrar"
                icon="fingerprint"
                onPress={() => {
                  void handleLogin();
                }}
                disabled={!puedeEnviar}
                loading={loading}
              />
            </View>

            <Text className="mt-4 text-center text-[10px] leading-4 text-ink-faint">
              Cuentas de prueba: {USUARIOS_CONOCIDOS.join(' · ')}
            </Text>
            <Text className="mt-1 text-center text-[10px] leading-4 text-ink-faint">
              La contraseña se verifica en el teléfono. Para producción hace falta
              autenticación en el servidor.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={{ height: Math.max(insets.bottom, 0) }} />
    </Screen>
  );
}