/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#070C18',
          card: '#0D1527',
          surface: '#121D36',
          border: '#1E2D4F',
          cyan: '#00F2FE',
          blue: '#3B82F6',
          electric: '#2563EB',
          purple: '#8B5CF6',
          glow: '#00D4FF',
          accent: '#06B6D4'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glowPulse: {
          '0%': { boxShadow: '0 0 15px rgba(0, 242, 254, 0.2)' },
          '100%': { boxShadow: '0 0 30px rgba(0, 242, 254, 0.5)' }
        }
      }
    },
  },
  plugins: [],
}
