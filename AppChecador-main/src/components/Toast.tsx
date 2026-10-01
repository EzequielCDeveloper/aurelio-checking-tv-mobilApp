import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme/tokens';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastPayload {
  title: string;
  detail?: string;
  tone: ToastTone;
}

const TONE = {
  success: { bg: '#047857', icon: 'checkmark-circle', glyph: 'notifications' },
  error: { bg: '#be123c', icon: 'alert-circle', glyph: 'warning' },
  info: { bg: colors.brand[600], icon: 'information-circle', glyph: 'notifications' },
} as const;

const AUTO_DISMISS_MS = 4200;

/**
 * Notificacion flotante. El prototipo hacia `setTimeout` para ocultarla pero
 * no limpiaba el timer al desmontar, y el toast persistia sobre otras pantallas.
 * Aqui el timer se libera solo.
 */
export function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastPayload | null;
  onDismiss: () => void;
}) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;
  const tone = TONE[toast.tone];

  return (
    <Animated.View
      pointerEvents="box-none"
      style={{ bottom: insets.bottom + 96, left: 16, right: 16, position: 'absolute' }}
    >
      <Pressable
        accessibilityRole="alert"
        onPress={onDismiss}
        className="flex-row items-center rounded-2xl p-3.5 shadow-nav"
        style={{ backgroundColor: tone.bg }}
      >
        <Ionicons name={tone.icon as never} size={20} color="#ffffff" />
        <View className="ml-3 flex-1">
          <Text className="text-[12px] font-bold text-white">{toast.title}</Text>
          {toast.detail ? (
            <Text className="mt-0.5 text-[11px] text-white/80">{toast.detail}</Text>
          ) : null}
        </View>
        <Ionicons name="close" size={16} color="rgba(255,255,255,0.7)" />
      </Pressable>
    </Animated.View>
  );
}
