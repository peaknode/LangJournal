/**
 * Neo-Stationery Atelier Design System Theme
 * 프리미엄 문구류 워크숍을 연상케 하는 고급 디지털 다이어리 테마
 */

export const DESIGN_TOKENS = {
  colors: {
    primary: '#506300',
    primaryContainer: '#cffc00',
    onPrimaryContainer: '#1a1d00',

    secondary: '#aa2c32',
    secondaryContainer: '#f9dedc',
    onSecondary: '#ffffff',
    onSecondaryContainer: '#42000b',

    tertiary: '#66518c',
    tertiaryContainer: '#eaddff',
    onTertiary: '#ffffff',
    onTertiaryContainer: '#21005e',

    surface: '#f7f6f2',
    surfaceContainerLow: '#f1f0ed',
    surfaceContainerLowest: '#ffffff',
    onSurface: '#2e2f2d',
    outlineVariant: '#c8c7c3',
  },

  typography: {
    fontDisplay: "'Lexend', sans-serif",
    fontBody: "'Plus Jakarta Sans', sans-serif",

    sizes: {
      displayLg: '3.5rem',
      displayMd: '2.25rem',
      displaySm: '1.875rem',
      headlineLg: '1.875rem',
      headlineMd: '1.5rem',
      headlineSm: '1.25rem',
      titleLg: '1.25rem',
      titleMd: '1.125rem',
      titleSm: '1rem',
      bodyLg: '1.125rem',
      bodyMd: '1rem',
      bodySm: '0.875rem',
      labelLg: '0.875rem',
      labelMd: '0.75rem',
      labelSm: '0.625rem',
    },

    weights: {
      bold: 700,
      semibold: 600,
      medium: 500,
      normal: 400,
    },

    lineHeights: {
      tight: '1.1',
      snug: '1.2',
      normal: '1.5',
      relaxed: '1.6',
      generous: '1.75',
    },

    letterSpacing: {
      tighter: '-0.02em',
      tight: '-0.01em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
    },
  },

  radius: {
    sm: '0.5rem',
    md: '1rem',
    lg: '2rem',
    xl: '3rem',
    full: '9999px',
  },

  shadows: {
    ambient: '0 6px 24px rgba(46, 47, 45, 0.06)',
    ambientLg: '0 8px 32px rgba(46, 47, 45, 0.08)',
    sticker: '0 2px 0 rgba(207, 252, 0, 0.3)',
    stickerDark: '0 2px 0 rgba(80, 99, 0, 0.3)',
  },

  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '2.5rem',
    xxl: '3rem',
    card: '3rem',
    cardLarge: '4rem',
  },
} as const;

/**
 * 컴포넌트 스타일 프리셋
 */
export const COMPONENT_PRESETS = {
  button: {
    primary: {
      className:
        'bg-primary-container text-on-primary-container hover:opacity-80 rounded-[3rem] px-8 py-3 shadow-sticker transition-all',
    },
    secondary: {
      className:
        'bg-secondary-container text-on-secondary-container hover:opacity-90 rounded-lg px-4 py-2 transition-all',
    },
    ghost: {
      className: 'hover:bg-surface-container-low text-on-surface rounded-lg px-4 py-2 transition-all',
    },
  },

  card: {
    container: 'bg-surface-container-low rounded-xl p-8 space-y-6',
    item: 'bg-surface-container-lowest rounded-xl p-6',
    divider: 'h-8',
  },

  input: {
    diary: 'bg-surface-container-lowest rounded-[2rem] px-4 py-3 focus-visible:ring-4 focus-visible:ring-primary/20 transition-all',
  },

  bubble: {
    user: 'bg-secondary-container text-on-secondary-container px-4 py-3 rounded-[2rem_2rem_0.5rem_2rem]',
    ai: 'bg-tertiary-container text-on-tertiary-container px-4 py-3 rounded-[2rem_0.5rem_2rem_2rem]',
  },

  chip: {
    default: 'inline-flex items-center px-4 py-2 rounded-full bg-surface-container-high text-on-surface font-medium text-sm',
    selected: 'bg-tertiary-container text-on-tertiary-container',
  },
} as const;

/**
 * 색상 팔레트를 CSS 변수로 생성
 */
export function getCSSVariables(): Record<string, string> {
  return {
    '--primary': DESIGN_TOKENS.colors.primary,
    '--primary-container': DESIGN_TOKENS.colors.primaryContainer,
    '--on-primary-container': DESIGN_TOKENS.colors.onPrimaryContainer,
    '--secondary': DESIGN_TOKENS.colors.secondary,
    '--secondary-container': DESIGN_TOKENS.colors.secondaryContainer,
    '--on-secondary': DESIGN_TOKENS.colors.onSecondary,
    '--on-secondary-container': DESIGN_TOKENS.colors.onSecondaryContainer,
    '--tertiary': DESIGN_TOKENS.colors.tertiary,
    '--tertiary-container': DESIGN_TOKENS.colors.tertiaryContainer,
    '--on-tertiary': DESIGN_TOKENS.colors.onTertiary,
    '--on-tertiary-container': DESIGN_TOKENS.colors.onTertiaryContainer,
    '--surface': DESIGN_TOKENS.colors.surface,
    '--surface-container-low': DESIGN_TOKENS.colors.surfaceContainerLow,
    '--surface-container-lowest': DESIGN_TOKENS.colors.surfaceContainerLowest,
    '--on-surface': DESIGN_TOKENS.colors.onSurface,
    '--outline-variant': DESIGN_TOKENS.colors.outlineVariant,
  };
}
