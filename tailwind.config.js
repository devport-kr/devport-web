/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Softer dark palette with blue undertones
        surface: {
          DEFAULT: '#0f1419',
          elevated: '#161b22',
          card: '#1c2128',
          hover: '#262c36',
          border: '#30363d',
        },
        // Warm text colors
        text: {
          primary: '#f0f6fc',
          secondary: '#c9d1d9',
          muted: '#8b949e',
        },
        // Ocean blue accent
        accent: {
          DEFAULT: '#2f81f7',
          light: '#58a6ff',
          dark: '#1f6feb',
          subtle: 'rgba(47, 129, 247, 0.15)',
        },
      },
      fontFamily: {
        sans: ['"General Sans"', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 8px -2px rgba(0, 0, 0, 0.3)',
        'glow': '0 0 20px rgba(47, 129, 247, 0.15)',
        'menu': '0 16px 40px -12px rgba(0, 0, 0, 0.6)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-subtle': 'linear-gradient(to bottom, var(--tw-gradient-stops))',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'menu-in': 'menuIn 0.14s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        menuIn: {
          '0%': { opacity: '0', transform: 'translateY(-4px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
