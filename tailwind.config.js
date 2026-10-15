/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors');

// Semantic colours come from CSS variables (src/styles.css), so a dark theme later only
// redefines the variables.
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        canvas: v('canvas'),
        surface: v('surface'),
        sunken: v('sunken'),
        line: { DEFAULT: v('line'), strong: v('line-strong') },
        fg: { DEFAULT: v('fg'), 2: v('fg-2'), 3: v('fg-3') },
        brand: colors.teal,
        money: { 50: '#FEF8E7', 100: '#FCEFC7', 500: '#D49A0B', 600: '#B07A00', 700: '#8C6100' },
      },
      boxShadow: {
        card: '0 1px 2px rgba(28,25,23,.04), 0 1px 1px rgba(28,25,23,.02)',
        lift: '0 12px 32px -12px rgba(28,25,23,.18)',
      },
      keyframes: {
        'slide-up': { from: { transform: 'translateY(12px)', opacity: '0' }, to: { transform: 'none', opacity: '1' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'pulse-soft': { '0%,100%': { opacity: '1' }, '50%': { opacity: '.4' } },
      },
      animation: {
        'slide-up': 'slide-up .22s ease-out',
        'fade-in': 'fade-in .18s ease-out',
        'pulse-soft': 'pulse-soft 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
