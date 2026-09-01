/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      opacity: {
        '2':  '0.02',
        '3':  '0.03',
        '4':  '0.04',
        '6':  '0.06',
        '8':  '0.08',
        '12': '0.12',
      },
      colors: {
        'x-dark': '#06060f',
        'x-navy': '#0d0d1e',
        'x-slate': '#111130',
        'x-purple': '#7c3aed',
        'x-purple-2': '#a855f7',
        'x-gold': '#d4a017',
        'x-gold-2': '#e8be3a',
        'x-parchment': '#e8d5b7',
        'x-crimson': '#8b1a1a',
      },
      fontFamily: {
        cinzel: ['"Cinzel"', 'Georgia', 'serif'],
        'cinzel-dec': ['"Cinzel Decorative"', 'Georgia', 'serif'],
        inter: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow-gold': 'glowGold 2.5s ease-in-out infinite alternate',
        'arcane-drift': 'arcaneDrift 10s linear infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'typing': 'typing 2s steps(30) forwards',
        'campfire-pulse': 'campfirePulse 2.4s ease-in-out infinite',
        'campfire-flicker-outer': 'campfireFlickerOuter 1.6s ease-in-out infinite',
        'campfire-flicker-mid': 'campfireFlickerMid 1.1s ease-in-out infinite',
        'campfire-flicker-inner': 'campfireFlickerInner 0.8s ease-in-out infinite',
        'campfire-core-pulse': 'campfireCorePulse 1.8s ease-in-out infinite',
        'campfire-ember-rise': 'campfireEmberRise 3s ease-in infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        glowGold: {
          '0%': { boxShadow: '0 0 5px rgba(212,160,23,0.2)' },
          '100%': { boxShadow: '0 0 25px rgba(212,160,23,0.6), 0 0 50px rgba(212,160,23,0.2)' },
        },
        arcaneDrift: {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '0' },
          '10%': { opacity: '0.7' },
          '90%': { opacity: '0.7' },
          '100%': { transform: 'translateY(-120px) rotate(180deg)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        typing: {
          from: { width: '0' },
          to: { width: '100%' },
        },
        campfirePulse: {
          '0%, 100%': { opacity: '0.75', transform: 'translate(-50%, -50%) scale(1)' },
          '50%': { opacity: '1', transform: 'translate(-50%, -50%) scale(1.1)' },
        },
        campfireFlickerOuter: {
          '0%, 100%': { transform: 'scaleY(1) scaleX(1) skewX(0deg)' },
          '30%': { transform: 'scaleY(1.12) scaleX(0.92) skewX(-2deg)' },
          '60%': { transform: 'scaleY(0.94) scaleX(1.05) skewX(2deg)' },
        },
        campfireFlickerMid: {
          '0%, 100%': { transform: 'scaleY(1) skewX(0deg)' },
          '40%': { transform: 'scaleY(1.18) skewX(3deg)' },
          '75%': { transform: 'scaleY(0.9) skewX(-3deg)' },
        },
        campfireFlickerInner: {
          '0%, 100%': { transform: 'scaleY(1)', opacity: '1' },
          '50%': { transform: 'scaleY(1.25)', opacity: '0.85' },
        },
        campfireCorePulse: {
          '0%, 100%': { opacity: '0.9' },
          '50%': { opacity: '1', transform: 'translate(-50%, -50%) scale(1.15)' },
        },
        campfireEmberRise: {
          '0%': { transform: 'translate(0, 0)', opacity: '0' },
          '15%': { opacity: '1' },
          '100%': { transform: 'translate(var(--ember-x, 10px), -160px)', opacity: '0' },
        },
      },
      scale: {
        '102': '1.02',
        '103': '1.03',
        '105': '1.05',
        '108': '1.08',
      },
      backgroundImage: {
        'fantasy-radial': 'radial-gradient(ellipse at top, #7c3aed18 0%, transparent 60%)',
        'gold-radial': 'radial-gradient(ellipse at center, #d4a01715 0%, transparent 60%)',
        'section-gradient': 'linear-gradient(180deg, #06060f 0%, #0d0d1e 50%, #06060f 100%)',
      },
    },
  },
  plugins: [],
};
