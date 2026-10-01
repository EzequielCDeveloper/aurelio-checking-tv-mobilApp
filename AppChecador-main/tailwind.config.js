/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Fuente unica de verdad para el azul de marca. El codigo web lo
        // repetia como #0052FF / #0052ff en ~20 lugares; aqui queda centralizado.
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
        // --- Paleta semantica ---
        // Los componentes no hablan de hex ni de escalas: hablan de superficies
        // y de intención (éxito / peligro). Así un cambio de tema es una línea.
        surface: '#f7f9ff',
        card: '#ffffff',
        line: '#dce5f5',
        ink: {
          DEFAULT: '#101828',
          soft: '#526078',
          faint: '#8491a8',
        },
        primary: {
          DEFAULT: '#0052ff',
          soft: '#f2f6ff',
          deep: '#003aab',
        },
        success: {
          DEFAULT: '#10b981',
          soft: '#ecfdf5',
          ink: '#047857',
        },
        danger: {
          DEFAULT: '#e11d48',
          soft: '#fff1f2',
          ink: '#be123c',
        },
        warning: {
          DEFAULT: '#f59e0b',
          soft: '#fffbeb',
          ink: '#b45309',
        },
        muted: {
          DEFAULT: '#64748b',
          soft: '#f1f5f9',
        },
      },
      fontFamily: {
        // Space Grotesk solo se usaba con font-bold en el diseño original.
        display: ['SpaceGrotesk_700Bold'],
        // 'Menlo' resuelve en iOS, web y Android cae a 'monospace'.
        mono: ['Menlo', 'Courier', 'monospace'],
      },
      boxShadow: {
        header: '0 2px 10px rgba(16,24,40,0.05)',
        nav: '0 -4px 18px rgba(16,24,40,0.08)',
        torch: '0 0 24px rgba(251,191,36,0.3)',
        scanline: '0 0 12px #38bdf8',
        'brand-glow': '0 4px 12px rgba(0,82,255,0.25)',
        'brand-soft': '0 4px 12px rgba(0,82,255,0.20)',
        card: '0 5px 16px rgba(20,52,110,0.07)',
      },
    },
  },
  corePlugins: {
    // React Native no tiene ring (box-shadow exterior). Se usa border.
    ringWidth: false,
    ringColor: false,
    ringOffsetWidth: false,
    ringOffsetColor: false,
    // Backdrop blur se resuelve con expo-blur, no con clases.
    backdropFilter: false,
    // drop-shadow no existe en RN.
    dropShadow: false,
    // Sin animaciones CSS: los loops van con Reanimated.
    animation: false,
    float: false,
    clear: false,
  },
};
