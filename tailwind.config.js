/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./*.html', './main.js'],
  theme: {
    extend: {
      colors: {
        deepNoir: 'var(--bg-deep)',
        anthracite: 'var(--bg-card)',
        brandRed: '#D90429',
        metallicGray: 'var(--text-gray)',
        white: 'var(--text-white)',
        pureWhite: '#FFFFFF',
      },
    },
  },
  plugins: [],
};
