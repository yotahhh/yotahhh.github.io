/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        primary: '#d4ceb8',
        secondary: '#888888',
        accent: '#ff00ff', // Will be dynamic later
      },
      fontFamily: {
        mono: ['"Noto Sans"', 'sans-serif'], // Remapping mono to Noto Sans so I don't have to edit every file
        sans: ['"Noto Sans"', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
      }
    },
  },
  plugins: [],
}
