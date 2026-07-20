/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('@cereja/ui/tailwind-preset')],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './features/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
};
