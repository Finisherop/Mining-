/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdff',
          100: '#ccf7fe',
          200: '#99eefd',
          300: '#5ddefa',
          400: '#22c5f0',
          500: '#06a9d6',
          600: '#0886b4',
          700: '#0e6b92',
          800: '#155877',
          900: '#164a65',
        },
        secondary: {
          50: '#fef7ff',
          100: '#fdeeff',
          200: '#fcdcff',
          300: '#f9bbff',
          400: '#f48aff',
          500: '#ec58ff',
          600: '#d935ee',
          700: '#b821d2',
          800: '#9620ab',
          900: '#7a1c87',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        }
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(135deg, #0b0f1a 0%, #1b1330 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        'gradient-neon': 'linear-gradient(135deg, #22c5f0 0%, #ec58ff 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'bounce-subtle': 'bounce-subtle 1s ease-in-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'confetti': 'confetti 0.5s ease-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(34, 197, 240, 0.4)',
            transform: 'scale(1)'
          },
          '50%': { 
            boxShadow: '0 0 40px rgba(34, 197, 240, 0.8)',
            transform: 'scale(1.02)'
          },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'confetti': {
          '0%': { transform: 'scale(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'scale(1.2) rotate(180deg)', opacity: '0' },
        },
      }
    },
  },
  plugins: [],
}