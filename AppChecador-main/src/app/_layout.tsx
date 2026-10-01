import { ActivityIndicator, View } from 'react-native';
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk/700Bold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '../../global.css';

import { AttendanceProvider } from '@/context/AttendanceProvider';
import { colors } from '@/theme/tokens';

function RootNavigator() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.card },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="scanner" options={{ animation: 'fade' }} />
      <Stack.Screen name="login" options={{ gestureEnabled: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ SpaceGrotesk_700Bold });

  if (!fontsLoaded && !fontError) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color={colors.brand[500]} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AttendanceProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </AttendanceProvider>
    </SafeAreaProvider>
  );
}
