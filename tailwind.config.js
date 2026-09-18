/**
 * Палитра объявлена через CSS-переменные, а не фиксированными hex.
 * Благодаря этому тёмная тема включается одним классом на <html>: значения
 * переменных переопределяются в index.css, а все компоненты остаются без
 * dark:-вариантов и не расходятся между собой.
 */
const token = (name) => `rgb(var(${name}) / <alpha-value>)`

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: token('--c-paper'),
        surface: token('--c-surface'),
        ink: {
          DEFAULT: token('--c-ink'),
          soft: token('--c-ink-soft'),
          muted: token('--c-ink-muted'),
        },
        line: token('--c-line'),
        brand: {
          50: token('--c-brand-50'),
          100: token('--c-brand-100'),
          200: token('--c-brand-200'),
          300: token('--c-brand-300'),
          400: token('--c-brand-400'),
          500: token('--c-brand-500'),
          600: token('--c-brand-600'),
          700: token('--c-brand-700'),
          900: token('--c-brand-900'),
        },
        mint: {
          50: token('--c-mint-50'),
          100: token('--c-mint-100'),
          500: token('--c-mint-500'),
          600: token('--c-mint-600'),
          700: token('--c-mint-700'),
        },
        coral: {
          50: token('--c-coral-50'),
          100: token('--c-coral-100'),
          500: token('--c-coral-500'),
          600: token('--c-coral-600'),
          700: token('--c-coral-700'),
        },
        sun: {
          50: token('--c-sun-50'),
          100: token('--c-sun-100'),
          500: token('--c-sun-500'),
          600: token('--c-sun-600'),
          700: token('--c-sun-700'),
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        card: '0 1px 2px rgb(var(--c-shadow) / 0.04), 0 8px 24px -12px rgb(var(--c-shadow) / 0.12)',
        lift: '0 2px 4px rgb(var(--c-shadow) / 0.05), 0 18px 40px -18px rgb(var(--c-shadow) / 0.25)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop': {
          '0%': { transform: 'scale(0.96)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.35s cubic-bezier(0.22,1,0.36,1) both',
        pop: 'pop 0.25s cubic-bezier(0.22,1,0.36,1) both',
      },
    },
  },
  plugins: [],
}
