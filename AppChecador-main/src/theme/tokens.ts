/**
 * Paleta y espaciados de BioCheck Sentinel.
 *
 * La escala de marca vive tambien en tailwind.config.js (para las clases
 * `brand-*`); aqui estan los valores crudos que necesitan JS, tipografia y
 * anything que no se pueda expresar como className.
 */
export const colors = {
  brand: {
    50: '#f2f6ff',
    100: '#e3ecff',
    200: '#c7d9ff',
    300: '#9dbbff',
    400: '#6692ff',
    500: '#0052ff',
    600: '#0047d1',
    700: '#003aab',
    800: '#002d85',
    900: '#00205e',
  },
  scan: {
    300: '#38bdf8',
    400: '#22d3ee',
  },
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  emerald: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
  },
  amber: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
  },
  rose: {
    50: '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    600: '#e11d48',
    700: '#be123c',
  },
  cyan: {
    300: '#67e8f9',
    400: '#22d3ee',
  },
  surface: '#f7f9ff',
  card: '#ffffff',
  line: '#dce5f5',
  ink: '#101828',
  inkSoft: '#526078',
  inkFaint: '#8491a8',
} as const;

export const fonts = {
  display: 'SpaceGrotesk_700Bold',
  /** 'Menlo' resuelve en iOS y web; en Android cae a la monoespaciada del sistema. */
  mono: 'Menlo',
} as const;

export const layout = {
  headerHeight: 64,
  tabBarHeight: 64,
  /** Ancho maximo de contenido, equivalente al `max-w-md` del prototipo web. */
  maxContentWidth: 448,
} as const;
