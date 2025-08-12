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
          50: '#f5f7ff',
          100: '#ebf0ff',
          500: '#667eea',
          600: '#5a67d8',
          700: '#4c51bf',
        },
        secondary: {
          500: '#764ba2',
          600: '#6b46c1',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-in-out forwards',
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { 
            opacity: '0', 
            transform: 'scale(0.95) translateY(10px)' 
          },
          '100%': { 
            opacity: '1', 
            transform: 'scale(1) translateY(0)' 
          },
        },
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
