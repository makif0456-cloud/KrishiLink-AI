/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Deep Agricultural Greens
        krishi: {
          50: '#f2f9f1',
          100: '#e1f2df',
          200: '#c4e5c1',
          300: '#99d294',
          400: '#67b760',
          500: '#388e3c', // Primary Brand Green
          600: '#2e7d32',
          700: '#1b5e20',
          800: '#144617',
          900: '#0d3010',
          950: '#061a08',
        },
        // Golden Harvest & Amber
        kisan: {
          gold: '#f59e0b',
          amber: '#d97706',
          soil: '#78350f',
          sand: '#fef3c7',
          terracotta: '#c2410c',
          sky: '#0284c7'
        },
        // Forest Night Surfaces for Dark Theme
        darkbg: {
          base: '#0c1610',
          surface: '#14231a',
          card: '#1a2e22',
          border: '#243e2e',
          hover: '#20392a',
          text: '#f1f5f9',
          muted: '#94a3b8'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'Noto Sans Devanagari', 'system-ui', 'sans-serif'],
        hindi: ['Noto Sans Devanagari', 'sans-serif']
      },
      boxShadow: {
        'farmer': '0 4px 20px -2px rgba(27, 94, 32, 0.12)',
        'farmer-lg': '0 10px 25px -3px rgba(27, 94, 32, 0.18)',
        'gold-glow': '0 0 15px 2px rgba(245, 158, 11, 0.35)',
        'dark-card': '0 4px 20px -2px rgba(0, 0, 0, 0.5)'
      },
      borderRadius: {
        'xl': '14px',
        '2xl': '18px',
        '3xl': '24px'
      }
    },
  },
  plugins: [],
}
