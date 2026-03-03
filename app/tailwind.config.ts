import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base:    '#0d0d0d',
          surface: '#1a1818',
          raised:  '#231f1f',
        },
        red: {
          ember: '#CC2200',
          deep:  '#8B0000',
          flare: '#FF4422',
          dim:   '#4A1010',
        },
        gold: {
          bright: '#D4A017',
          muted:  '#B8860B',
          dim:    '#6B5000',
        },
        parchment: '#F5ECD7',
      },
      fontFamily: {
        display: ['Cinzel Decorative', 'Cinzel', 'serif'],
        serif:   ['Cinzel', 'IM Fell English', 'serif'],
        body:    ['IM Fell English', 'Georgia', 'serif'],
      },
      boxShadow: {
        'card':       '0 0 0 1px #B8860B, 0 0 0 3px #4A3800, 0 4px 24px rgba(0,0,0,0.8)',
        'card-hover': '0 0 0 1px #D4A017, 0 0 0 3px #6B5000, 0 0 20px rgba(212,160,23,0.25)',
        'gold-glow':  '0 0 12px rgba(212,160,23,0.5)',
        'red-glow':   '0 0 16px rgba(204,34,0,0.6)',
        'life':       '0 0 24px rgba(212,160,23,0.3)',
      },
      backgroundImage: {
        'stone': "url('/textures/stone.png')",
      },
    },
  },
} satisfies Config
