/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", 
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        // Custom color theme (Indigo & Slate - Light Mode)
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#2563eb', // indigo-600
          600: '#2563eb', // indigo-600
          700: '#1d4ed8', // indigo-700
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-in-out forwards',
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { 
            opacity: '0', 
            transform: 'scale(0.98)' 
          },
          '100%': { 
            opacity: '1', 
            transform: 'scale(1)' 
          },
        },
      },
    },
  },
  plugins: [],
}
