/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        alexandria: ['Alexandria', 'sans-serif'],
        sans: ['Inter', 'sans-serif']
      },
      colors: {
        primary: {
          50: '#f0f8ff',
          100: '#e0f0ff',
          200: '#bae1ff',
          300: '#7cc8ff',
          400: '#36acff',
          500: '#0c91f1',
          600: '#0074ce',
          700: '#005ca7',
          800: '#024e89',
          900: '#084271',
          950: '#0367df',
        },
        accent: {
          50: '#fffbf0',
          100: '#fff4d6',
          200: '#ffe7ad',
          300: '#ffd574',
          400: '#ffbe39',
          500: '#ffa500',
          600: '#f28500',
          700: '#d16200',
          800: '#a84d02',
          900: '#8a4008',
          950: '#4a1f00',
        },
      },
      typography: {
        DEFAULT: {
          css: {
            'img': {
              'max-width': '700px',
              'margin': '2rem auto',
              'display': 'block',
              'border-radius': '0.75rem',
              'box-shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            },
          },
        },
      },
    },
  },
  plugins: [],
}