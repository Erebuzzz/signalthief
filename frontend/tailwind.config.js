/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        amber: {
          DEFAULT: '#ff6b00',
          light: '#ff8c33',
          dark: '#cc5500',
        },
        terminal: {
          black: '#0a0a0a',
          darker: '#050505',
          panel: '#111111',
          border: '#222222',
          green: '#00ff41',
          'green-dim': '#00cc33',
          amber: '#ff6b00',
          'amber-dim': '#cc5500',
          red: '#ff3333',
          white: '#e0e0e0',
          dim: '#666666',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        body: ['"IBM Plex Mono"', '"Source Code Pro"', 'monospace'],
        display: ['"VT323"', '"Courier New"', 'monospace'],
      },
      animation: {
        'scanline': 'scanline 8s linear infinite',
        'blink': 'blink 1s step-end infinite',
        'glitch': 'glitch 0.3s ease infinite',
        'flicker': 'flicker 0.15s infinite',
        'typewriter': 'typewriter 2s steps(20) forwards',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 1px)' },
          '40%': { transform: 'translate(2px, -1px)' },
          '60%': { transform: 'translate(-1px, -1px)' },
          '80%': { transform: 'translate(1px, 1px)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        typewriter: {
          '0%': { width: '0' },
          '100%': { width: '100%' },
        },
      },
    },
  },
  plugins: [],
};