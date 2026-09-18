/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FBFAF8',
        surface: '#FFFFFF',
        ink: {
          DEFAULT: '#15171C',
          soft: '#3F444E',
          muted: '#767C8A',
        },
        line: '#E7E4DE',
        brand: {
          50: '#EEF0FF',
          100: '#E0E3FF',
          200: '#C6CBFF',
          300: '#A3ABFF',
          400: '#7C84F7',
          500: '#5B5BE6',
          600: '#4A45CE',
          700: '#3B37A6',
          900: '#221F63',
        },
        mint: {
          50: '#E9F9F2',
          100: '#CFF3E4',
          500: '#12A87A',
          600: '#0C8C64',
          700: '#096B4D',
        },
        coral: {
          50: '#FFF0F1',
          100: '#FFDCDF',
          500: '#EF5F6B',
          600: '#D6404D',
          700: '#A82B36',
        },
        sun: {
          50: '#FFF6E5',
          100: '#FFEAC2',
          500: '#E39413',
          600: '#BC7708',
          700: '#8E5A06',
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
        card: '0 1px 2px rgba(21,23,28,0.04), 0 8px 24px -12px rgba(21,23,28,0.12)',
        lift: '0 2px 4px rgba(21,23,28,0.05), 0 18px 40px -18px rgba(21,23,28,0.25)',
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
