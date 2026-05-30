/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./*.html'],
  theme: {
    extend: {
      colors: {
        rouge: {
          DEFAULT: '#d4293a',
          dark:    '#a81f2d',
          light:   'rgba(212,41,58,0.08)',
        },
      },
      fontFamily: {
        titre: ['Cormorant Garamond', 'serif'],
        corps: ['DM Sans', 'sans-serif'],
      },
      boxShadow: {
        rouge:    '0 10px 36px rgba(212,41,58,0.28)',
        'rouge-ring': '0 0 0 3px rgba(212,41,58,0.12)',
      },
    },
  },
  plugins: [],
};
