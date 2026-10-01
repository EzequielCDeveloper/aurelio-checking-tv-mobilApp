import { Ionicons } from '@expo/vector-icons';
import { Text, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Contenedor de pantalla blanco con padding de safe area.
 * Reemplaza al `<div class="app-container">` del prototipo.
 */
export function Screen({
  children,
  className,
  ...props
}: ViewProps & { children: React.ReactNode; className?: string }) {
  return (
    <View className={`flex-1 bg-white ${className ?? ''}`} {...props}>
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
        {children}
      </SafeAreaView>
    </View>
  );
}

/** Marca: escudo + nombre. Sin imagen: el logo del prototipo era una URL rota. */
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <View className="flex-row items-center">
      <View className="h-10 w-10 items-center justify-center rounded-2xl bg-primary shadow-brand-soft">
        <Ionicons name="shield-checkmark" size={20} color="#ffffff" />
      </View>
      {!compact && (
        <View className="ml-2.5">
          <Text className="font-display text-[16px] leading-tight text-ink">BioCheck</Text>
          <Text className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary">
            Sentinel
          </Text>
        </View>
      )}
    </View>
  );
}

/** Encabezado reutilizable con marca, titulo, subtitulo y accion opcional. */
export function Header({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between border-b border-line px-4 py-3">
      <View className="flex-row items-center">
        <Brand />
        <View className="ml-4">
          <Text className="text-[13px] font-semibold text-ink">{title}</Text>
          {subtitle ? <Text className="text-[10px] text-ink-soft">{subtitle}</Text> : null}
        </View>
      </View>
      {right}
    </View>
  );
}

export function PageHeading({
  eyebrow,
  title,
  detail,
  right,
}: {
  eyebrow?: string;
  title: string;
  detail?: string;
  right?: React.ReactNode;
}) {
  return (
    <View className="mb-5 flex-row items-center justify-between">
      <View className="flex-1 pr-4">
        {eyebrow ? (
          <Text className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
            {eyebrow}
          </Text>
        ) : null}
        <Text className="font-display text-[24px] leading-7 text-ink">{title}</Text>
        {detail ? <Text className="mt-1 text-[12px] leading-5 text-ink-soft">{detail}</Text> : null}
      </View>
      {right}
    </View>
  );
}
