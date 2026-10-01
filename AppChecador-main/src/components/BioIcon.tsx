import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { colors } from '@/theme/tokens';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

/**
 * Traduccion de los Material Symbols que usaba el prototipo web a Ionicons.
 *
 * El prototipo dependia de una webfont de Google, que en nativo no existe.
 * Concentrar el mapeo en un solo objeto permite rehacer un icono editando una
 * linea en vez de cazarlo por todos los componentes.
 */
const ICONS = {
  // Navegacion
  qr_code_scanner: 'qr-code-outline',
  history_toggle_off: 'time-outline',
  history: 'time-outline',
  badge: 'ribbon-outline',

  // Checador
  sensor_occupied: 'scan-circle-outline',
  center_focus_strong: 'scan-outline',
  verified_user: 'shield-checkmark-outline',
  verified: 'shield-checkmark',
  fingerprint: 'finger-print',
  autorenew: 'sync',
  sync: 'sync',
  hourglass_top: 'hourglass-outline',
  schedule: 'time-outline',
  domain: 'business-outline',
  my_location: 'locate-outline',
  security: 'shield-checkmark',
  check_circle: 'checkmark-circle',
  check: 'checkmark',
  restaurant: 'restaurant-outline',
  logout: 'log-out-outline',

  // Estado y avisos
  alert: 'alert-circle-outline',
  person: 'person-outline',
  lock: 'lock-closed-outline',
  warning: 'warning-outline',
  info: 'information-circle-outline',
  calendar_today: 'calendar-outline',
  calendar_month: 'calendar-outline',
  download: 'download-outline',

  // Linterna
  // Ionicons no tiene el par filled/outline para la linterna:
  // `flashlight-off` no existe. La distincion encendido/apagado se hace con
  // el par `flashlight` / `flashlight-outline`, que si existe.
  flashlight_on: 'flashlight',
  flashlight_off: 'flashlight-outline',
} satisfies Record<string, IoniconName>;

export type BioIconName = keyof typeof ICONS;

interface BioIconProps {
  name: BioIconName;
  size?: number;
  color?: string;
  /** Rellena el icono, equivalente a `fontVariationSettings: 'FILL' 1`. */
  filled?: boolean;
}

export function BioIcon({ name, size = 20, color = colors.slate[500], filled = false }: BioIconProps) {
  return <Ionicons name={ICONS[name]} size={size} color={color} />;
}
