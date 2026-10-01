import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { BioIcon, type BioIconName } from '@/components/BioIcon';
import { colors } from '@/theme/tokens';
import type { AttendanceRecord } from '@/types';

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View className={`rounded-3xl border border-line bg-card p-4 shadow-card ${className ?? ''}`}>
      {children}
    </View>
  );
}

export function SectionTitle({ children, action }: { children: string; action?: React.ReactNode }) {
  return (
    <View className="mb-3 mt-6 flex-row items-center justify-between px-1">
      <Text className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-soft">
        {children}
      </Text>
      {action}
    </View>
  );
}

const STATUS_TONE = {
  Puntual: {
    bg: 'bg-success-soft',
    fg: colors.emerald[700],
    icon: 'checkmark-circle',
  },
  Retardo: {
    bg: 'bg-danger-soft',
    fg: colors.rose[700],
    icon: 'alert-circle',
  },
  Registrado: {
    bg: 'bg-muted-soft',
    fg: colors.slate[500],
    icon: 'ellipse-outline',
  },
} as const satisfies Record<AttendanceRecord['status'], { bg: string; fg: string; icon: string }>;

export function StatusPill({ status }: { status: AttendanceRecord['status'] }) {
  const tone = STATUS_TONE[status];
  return (
    <View className={`flex-row items-center self-start rounded-full px-2 py-1 ${tone.bg}`}>
      <Ionicons name={tone.icon as never} size={11} color={tone.fg} />
      <Text className="ml-1 text-[10px] font-semibold" style={{ color: tone.fg }}>
        {status}
      </Text>
    </View>
  );
}

export function Chip({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'primary' | 'success' | 'danger';
}) {
  const tones = {
    default: 'border-line bg-card',
    primary: 'border-primary/20 bg-primary-soft',
    success: 'border-success/20 bg-success-soft',
    danger: 'border-danger/20 bg-danger-soft',
  } as const;
  return (
    <View className={`min-h-16 flex-1 justify-center rounded-2xl border px-3 py-2.5 ${tones[tone]}`}>
      <Text className="text-[9px] font-semibold uppercase tracking-wide text-ink-soft">{label}</Text>
      <Text className="mt-0.5 text-[12px] font-semibold text-ink">{value}</Text>
    </View>
  );
}

/**
 * IMPORTANTE (NativeWind): nunca agregues ni quites clases que usen *features*
 * CSS (sombra, `animate-*`, `transition-*`, `container-*`, variables, pseudo
 * clases `:active/:hover/:focus`) de forma condicional despues del primer
 * render.
 *
 * En desarrollo, `react-native-css-interop` recorre las props del componente
 * para avisar que hay que "upgradearlo" a Pressable/Animated. Ese recorrido usa
 * `Object.entries()` sin try/catch sobre un objeto que contiene getters, y al
 * tocar el valor por defecto de `NavigationStateContext` de React Navigation
 * dispara: "Couldn't find a navigation context".
 * El `className` base declara siempre las features y el estado solo cambia
 * colores/opacidad, que no participan de ese mecanismo.
 */
export function FilledButton({
  label,
  onPress,
  icon,
  tone = 'primary',
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  icon?: BioIconName;
  tone?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
}) {
  const tones = {
    primary: 'bg-primary',
    ghost: 'border border-line bg-card',
    danger: 'bg-danger',
  } as const;
  const fg = tone === 'ghost' ? colors.ink : '#ffffff';
  const blocked = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!blocked }}
      disabled={blocked}
      onPress={onPress}
      className={`min-h-12 flex-row items-center justify-center rounded-2xl px-5 py-3.5 shadow-brand-soft ${tones[tone]} ${
        blocked ? 'opacity-50' : ''
      }`}
    >
      {loading ? (
        <Text className="text-[13px] font-bold" style={{ color: fg }}>
          Verificando...
        </Text>
      ) : (
        <>
          {icon ? <BioIcon name={icon} size={16} color={fg} /> : null}
          <Text className={`text-[13px] font-bold ${icon ? 'ml-2' : ''}`} style={{ color: fg }}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const TILE_TONE = {
  primary: { bg: 'bg-primary-soft', color: colors.brand[500] },
  success: { bg: 'bg-success-soft', color: colors.emerald[600] },
  danger: { bg: 'bg-danger-soft', color: colors.rose[600] },
  warning: { bg: 'bg-warning-soft', color: colors.amber[600] },
  muted: { bg: 'bg-muted-soft', color: colors.slate[500] },
} as const;

export function IconTile({
  name,
  tone = 'primary',
}: {
  name: BioIconName;
  tone?: keyof typeof TILE_TONE;
}) {
  const style = TILE_TONE[tone];
  return (
    <View className={`h-11 w-11 items-center justify-center rounded-2xl ${style.bg}`}>
      <BioIcon name={name} size={20} color={style.color} />
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  detail,
}: {
  icon: BioIconName;
  title: string;
  detail: string;
}) {
  return (
    <Card className="items-center px-6 py-9">
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft">
        <BioIcon name={icon} size={25} color={colors.brand[500]} />
      </View>
      <Text className="mt-4 text-center text-[14px] font-bold text-ink">{title}</Text>
      <Text className="mt-1 max-w-[280px] text-center text-[11px] leading-5 text-ink-soft">
        {detail}
      </Text>
    </Card>
  );
}
