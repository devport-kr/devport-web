/** @type {import('tailwindcss').Config} */

// Manifest design system. Color values live as RGB channels in src/index.css (:root),
// so opacity modifiers like `bg-accent/10` keep working.
const token = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // Radius scale is deliberately tight: 3px for nearly everything, 6px for sheets/modals.
    borderRadius: {
      none: '0',
      sm: '2px',
      DEFAULT: '3px',
      md: '3px',
      lg: '3px',
      xl: '4px',
      '2xl': '4px',
      '3xl': '6px',
      '4xl': '6px',
      full: '9999px',
    },
    extend: {
      colors: {
        page: token('page'),
        // Blue-ink surfaces, darkest to lightest
        surface: {
          DEFAULT: token('surface'),
          sunken: token('sunken'),
          elevated: token('elevated'),
          card: token('card'),
          hover: token('hover'),
          border: token('border'),
          'border-strong': token('border-strong'),
        },
        text: {
          primary: token('text'),
          secondary: token('text-2'),
          muted: token('text-3'),
        },
        // Ocean blue for text, links and markers
        accent: {
          DEFAULT: token('accent'),
          light: token('accent-light'),
          dark: token('accent-dark'),
          subtle: 'rgb(var(--c-accent) / 0.14)',
        },
        // Filled buttons. White on action passes WCAG AA (4.6:1).
        action: {
          DEFAULT: token('action'),
          hover: token('action-hover'),
        },
        // Harbor amber: trending, live and top ranks only. Never for buttons or links.
        signal: {
          DEFAULT: token('signal'),
        },
        danger: token('danger'),
        success: token('success'),
        // Article categories. Equal lightness; use as dots and labels, not filled badges.
        cat: {
          ai: '#b495ff',
          devops: '#4fc3dc',
          cloud: '#e59866',
          db: '#4cc38a',
          security: '#f0727e',
          frontend: '#5fd4c0',
          backend: '#9bd36a',
          mobile: '#ec8fc4',
          data: '#7aa9ff',
          arch: '#a3a8ff',
          chain: '#e2c65a',
          other: '#8a96a8',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans KR"', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
        label: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.06em' }],
      },
      boxShadow: {
        'soft': '0 12px 32px -16px rgba(0, 0, 0, 0.7)',
        'overlay': '0 24px 48px -24px rgba(0, 0, 0, 0.85)',
        'glow': '0 0 0 1px rgb(var(--c-accent) / 0.25)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-subtle': 'linear-gradient(to bottom, var(--tw-gradient-stops))',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
