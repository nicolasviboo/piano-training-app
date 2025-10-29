/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
      },
      animation: {
        'flash-red': 'flash-red 0.5s ease-in-out',
      },
      keyframes: {
        'flash-red': {
          '0%, 100%': { backgroundColor: 'transparent' },
          '50%': { backgroundColor: '#ef4444' },
        },
      },
    },
  },
  plugins: [],
}

