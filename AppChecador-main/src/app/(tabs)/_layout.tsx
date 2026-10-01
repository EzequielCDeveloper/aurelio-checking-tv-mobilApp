import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAttendance } from '@/context/AttendanceProvider';
import { colors } from '@/theme/tokens';

function TabIcon({
  name,
  label,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  label: string;
  focused: boolean;
}) {
  return (
    <View className={`min-w-20 items-center justify-center rounded-2xl px-4 py-1.5 ${focused ? 'bg-primary-soft' : ''}`}>
      <Ionicons name={name} size={22} color={focused ? colors.brand[500] : colors.slate[400]} />
      <Text
        className="mt-0.5 text-[10px] font-semibold"
        style={{ color: focused ? colors.brand[500] : colors.slate[400] }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { session, isLoading } = useAttendance();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color={colors.brand[500]} />
      </View>
    );
  }

  if (session === null) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.line,
          borderTopWidth: 1,
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 7,
          shadowColor: colors.ink,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Checador',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'scan-circle' : 'scan-circle-outline'} label="Checador" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historial',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'time' : 'time-outline'} label="Historial" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'person-circle' : 'person-circle-outline'} label="Perfil" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
