import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        olive: 'var(--olive)',
        sage: 'var(--sage)',
        cream: 'var(--cream)',
        champagne: 'var(--champagne)',
        beige: 'var(--beige)',
        ink: 'var(--ink)',
        rose: 'var(--rose)'
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        script: ['"Great Vibes"', 'cursive'],
        body: ['Montserrat', 'Arial', 'sans-serif']
      },
      boxShadow: {
        soft: '0 24px 70px rgba(52, 60, 47, 0.12)'
      }
    }
  },
  plugins: []
} satisfies Config;
