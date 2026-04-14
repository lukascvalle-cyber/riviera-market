import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        coral: {
          DEFAULT: '#D4622A',
          50: '#FBF0EA',
          100: '#F5D9CB',
          200: '#EBB397',
          300: '#E18D63',
          400: '#D4622A',
          500: '#B5511E',
          600: '#934116',
          700: '#70310F',
          800: '#4E2109',
          900: '#2B1104',
        },
        ocean: {
          DEFAULT: '#1B6CA8',
          50: '#E8F2FA',
          100: '#C5DCF1',
          200: '#8BBAE3',
          300: '#5197D4',
          400: '#1B6CA8',
          500: '#165A8C',
          600: '#114870',
          700: '#0C3654',
          800: '#082438',
          900: '#04121C',
        },
        sand: {
          DEFAULT: '#F7F0E4',
          50: '#FEFCF8',
          100: '#F7F0E4',
          200: '#EDE0C8',
          300: '#E3D0AC',
          400: '#D9C090',
          500: '#CFAF74',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
