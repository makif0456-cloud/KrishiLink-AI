/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',

  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],

  theme: {
    extend: {
      colors: {
        /* =================================================
           KRISHI — PRIMARY AGRICULTURE GREEN
           ================================================= */

        krishi: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },

        /* =================================================
           HARVEST / FARM GOLD
           ================================================= */

        'kisan-gold': '#facc15',

        'kisan-amber': '#f59e0b',

        /* =================================================
           NATURAL SECONDARY COLORS
           ================================================= */

        earth: {
          50: '#faf8f2',
          100: '#f4efe3',
          200: '#e7dcc6',
          300: '#d6c5a5',
          400: '#b89d70',
          500: '#967548',
          600: '#765936',
          700: '#5d452d',
          800: '#493727',
          900: '#3d3025',
        },

        leaf: {
          50: '#f4f8f1',
          100: '#e5efdf',
          200: '#cbdcc2',
          300: '#abc49d',
          400: '#82a971',
          500: '#628d52',
          600: '#4c733f',
          700: '#3d5d35',
          800: '#334b2f',
          900: '#2b3e28',
        },

        sky: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },

        /* =================================================
           DARK AGRICULTURE SURFACES
           ================================================= */

        darkbg: {
          DEFAULT: '#0c1510',
          surface: '#101b14',
          card: '#142119',
          hover: '#1a2a20',
          border: '#29392e',
          muted: '#9aaa9c',
          text: '#f2f7f2',
        },
      },

      fontFamily: {
        sans: [
          'Noto Sans Devanagari',
          'Inter',
          'Outfit',
          'sans-serif',
        ],

        display: [
          'Outfit',
          'Noto Sans Devanagari',
          'Inter',
          'sans-serif',
        ],
      },

      boxShadow: {
        'agri-sm':
          '0 1px 2px rgba(15, 23, 15, 0.04), 0 4px 12px rgba(15, 23, 15, 0.04)',

        'agri':
          '0 2px 5px rgba(15, 23, 15, 0.05), 0 12px 30px rgba(15, 23, 15, 0.05)',

        'agri-lg':
          '0 8px 18px rgba(15, 23, 15, 0.07), 0 25px 55px rgba(15, 23, 15, 0.06)',
      },

      borderRadius: {
        '4xl': '2rem',
      },

      animation: {
        'fade-in': 'fade-in 0.35s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
      },

      keyframes: {
        'fade-in': {
          '0%': {
            opacity: '0',
          },
          '100%': {
            opacity: '1',
          },
        },

        'slide-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(12px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
    },
  },

  plugins: [],
};
