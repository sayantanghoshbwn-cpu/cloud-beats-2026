/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#070a0c', // deepest background
          900: '#0c1013', // surface / sidebars
          850: '#11171b', // cards
          800: '#172025', // card hover / input borders
          700: '#233038', // active states
          600: '#344752',
          400: '#64748b',
          200: '#94a3b8',
          100: '#e2e8f0',
        },
        neonGreen: {
          DEFAULT: '#00f59b',
          400: '#2ef8aa',
          500: '#00f59b',
          600: '#00c77d',
          dark: '#059669',
        },
        neonPurple: {
          DEFAULT: '#a855f7',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
        }
      },
      boxShadow: {
        'neon-green': '0 0 20px -3px rgba(0, 245, 155, 0.4)',
        'neon-purple': '0 0 20px -3px rgba(168, 85, 247, 0.4)',
        'neon-combo': '0 0 25px -5px rgba(0, 245, 155, 0.3), 0 0 25px -5px rgba(168, 85, 247, 0.3)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'obsidian-gradient': 'linear-gradient(135deg, #0c1013 0%, #070a0c 100%)',
        'glow-green-purple': 'linear-gradient(135deg, rgba(0, 245, 155, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
      }
    },
  },
  plugins: [],
}

