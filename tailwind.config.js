/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#14181F',
          soft: '#2B323C',
        },
        muted: {
          DEFAULT: '#64707D',
          dark: '#8B97A4',
        },
        border: {
          DEFAULT: '#E4E9EE',
          dark: '#232B36',
        },
        canvas: {
          DEFAULT: '#F5F7FA',
          dark: '#0C0F14',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#131820',
        },
        brand: {
          DEFAULT: '#0AA5E8',
          tint: '#E6F6FD',
          dark: '#0888BE',
        },
        signal: {
          DEFAULT: '#FF7A1A',
          tint: '#FFF2E8',
        },
        success: {
          DEFAULT: '#12A150',
          tint: '#E7F7ED',
        },
        warning: {
          DEFAULT: '#E39B00',
          tint: '#FEF7E6',
        },
        danger: {
          DEFAULT: '#E5484D',
          tint: '#FEECEE',
        },
        chart: {
          1: '#0AA5E8',
          2: '#14181F',
          3: '#FF7A1A',
          4: '#8ED8F5',
          5: '#A7B1BC',
          6: '#12A150',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Montserrat', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        card: '12px',
        input: '8px',
        button: '8px',
      },
      boxShadow: {
        subtle: '0 1px 2px rgba(20, 24, 31, 0.06)',
        dropdown: '0 4px 12px rgba(20, 24, 31, 0.08)',
        modal: '0 12px 32px rgba(20, 24, 31, 0.12)',
      },
    },
  },
  plugins: [],
};
