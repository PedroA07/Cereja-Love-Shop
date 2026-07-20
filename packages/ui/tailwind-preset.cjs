/**
 * Cereja Love Shop — Tailwind preset compartilhado (§6.9)
 * Estende o Tailwind com a paleta da marca e tokens de forma/tipografia.
 * Consumido por apps/web e apps/admin via `presets: [require('@cereja/ui/tailwind-preset')]`.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        cereja: {
          DEFAULT: '#a80c0c',
          600: '#920a0a',
          700: '#7c0808',
        },
        vinho: '#540000',
        terracota: '#a83c24',
        rose: '#9c6054',
        nude: {
          DEFAULT: '#c0a890',
          200: '#d9cbb8',
        },
        creme: {
          DEFAULT: '#e4d8b4',
          200: '#f0e9d2',
        },
        offwhite: '#fcfcfc',
        ink: '#242418',
        // aliases semânticos
        primary: '#a80c0c',
        'primary-hover': '#540000',
      },
      fontFamily: {
        serif: ['var(--font-display)', 'Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['var(--font-body)', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '0.375rem',
        md: '0.75rem',
        lg: '1.25rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(36,36,24,0.04), 0 8px 24px rgba(84,0,0,0.06)',
        card: '0 2px 8px rgba(36,36,24,0.06)',
      },
      ringColor: {
        DEFAULT: '#a80c0c',
      },
    },
  },
};
