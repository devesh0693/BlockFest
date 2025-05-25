/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Adjust according to your project structure
  ],
  darkMode: 'class', // Or 'media' if you prefer OS setting
  theme: {
    extend: {
      colors: {
        'primary-dark': '#0a0a23', // Deep dark blue/purple
        'secondary-dark': '#1b1b32', // Slightly lighter dark
        'accent-glow': '#6f42c1', // Neon purple for glows
        'accent-light': '#a779e9', // Lighter purple
        'text-main': '#f5f6f7',   // Off-white text
        'text-secondary': '#cacfd6', // Greyish text
        'success': '#28a745',
        'error': '#dc3545',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Example modern font
      },
      boxShadow: {
        'glow-sm': '0 0 5px rgba(111, 66, 193, 0.7)', // accent-glow
        'glow-md': '0 0 15px rgba(111, 66, 193, 0.7)',
        'glow-lg': '0 0 25px rgba(111, 66, 193, 0.8)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: { '0%': { transform: 'translateY(20px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
        pulseGlow: {
          '0%, 100%': { opacity: 1, boxShadow: '0 0 15px rgba(111, 66, 193, 0.7)' }, // glow-md
          '50%': { opacity: 0.8, boxShadow: '0 0 25px rgba(111, 66, 193, 0.9)' }, // glow-lg
        }
      }
    },
  },
  plugins: [],
}