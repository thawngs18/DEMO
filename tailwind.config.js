/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          cyan: '#00f0ff',
          green: '#00ff41',
          red: '#ff003c',
          dark: '#020617',
          panel: 'rgba(15, 23, 42, 0.75)',
        },
      },
      boxShadow: {
        'glow-cyan': '0 0 15px #00f0ff, 0 0 30px rgba(0, 240, 255, 0.3)',
        'glow-red': '0 0 15px #ff003c, 0 0 30px rgba(255, 0, 60, 0.3)',
        'glow-green': '0 0 15px #00ff41, 0 0 30px rgba(0, 255, 65, 0.3)',
        'glow-cyan-sm': '0 0 8px #00f0ff, 0 0 16px rgba(0, 240, 255, 0.2)',
        'glow-red-sm': '0 0 8px #ff003c, 0 0 16px rgba(255, 0, 60, 0.2)',
        'glow-green-sm': '0 0 8px #00ff41, 0 0 16px rgba(0, 255, 65, 0.2)',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'pulse-glow-fast': 'pulseGlow 0.8s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
