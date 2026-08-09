/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-raised': 'rgb(var(--surface-raised) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        'border-subtle': 'rgb(var(--border-subtle) / <alpha-value>)',
        'text-primary': 'rgb(var(--text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--text-secondary) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        // Signal — teal/green, "live/active": #14E0B4
        signal: {
          50:  '#EDFDF8',
          100: '#D0FAF0',
          400: '#3EEECB',
          500: '#14E0B4',
          600: '#0BBFA0',
          700: '#089080',
        },
        // Agent — violet, "AI speaking": #7C7FFB
        agent: {
          50:  '#F2F2FF',
          100: '#E5E6FF',
          400: '#9EA1FC',
          500: '#7C7FFB',
          600: '#6063E8',
          700: '#4749C8',
        },
        // Amber — caution: #FFB020
        amber: {
          400: '#FFC94D',
          500: '#FFB020',
          600: '#E09800',
        },
        // Coral — error: #FF5C72
        coral: {
          500: '#FF5C72',
          600: '#E0364E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        // Landing H1 responsive: 32px → 56px → 72px
        'hero-sm': ['2rem',    { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'hero-md': ['3.5rem',  { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '700' }],
        'hero-lg': ['4.5rem',  { lineHeight: '1.0',  letterSpacing: '-0.02em', fontWeight: '700' }],
      },
      borderRadius: {
        sm:       '6px',
        md:       '10px',
        lg:       '14px',
        xl:       '18px',
        '2xl':    '20px',
        '3xl':    '24px',
        btn:      '12px',      // spec: buttons = 12px
        card:     '20px',      // spec: cards 20-24px
        'card-lg':'24px',      // spec: modals / large cards = 24-28px
        pill:     '999px',
      },
      boxShadow: {
        subtle:      '0 1px 2px 0 rgba(0,0,0,0.03), 0 1px 6px 0 rgba(0,0,0,0.02)',
        raised:      '0 2px 4px rgba(0,0,0,0.06), 0 20px 40px -8px rgba(0,0,0,0.12)',
        glow:        '0 0 0 1px rgba(20,224,180,0.20), 0 8px 32px rgba(20,224,180,0.18)',
        'glow-agent':'0 0 0 1px rgba(124,127,251,0.20), 0 8px 32px rgba(124,127,251,0.18)',
      },
      backgroundImage: {
        // Mesh gradients — correct colors per spec
        'mesh-light': [
          'radial-gradient(at 18% 22%, rgba(20,224,180,0.18) 0px, transparent 55%)',
          'radial-gradient(at 82% 5%,  rgba(124,127,251,0.16) 0px, transparent 55%)',
          'radial-gradient(at 58% 82%, rgba(124,127,251,0.10) 0px, transparent 40%)',
        ].join(', '),
        'mesh-dark': [
          'radial-gradient(at 18% 22%, rgba(20,224,180,0.10) 0px, transparent 55%)',
          'radial-gradient(at 82% 5%,  rgba(124,127,251,0.14) 0px, transparent 55%)',
          'radial-gradient(at 58% 82%, rgba(124,127,251,0.08) 0px, transparent 40%)',
        ].join(', '),
        // Signature gradient — signal → agent
        'gradient-primary': 'linear-gradient(135deg, #14E0B4 0%, #7C7FFB 100%)',
        'gradient-agent':   'linear-gradient(135deg, #7C7FFB 0%, #9EA1FC 100%)',
      },
      keyframes: {
        'pulse-bar': {
          '0%, 100%': { transform: 'scaleY(0.4)', opacity: '0.6' },
          '50%':       { transform: 'scaleY(1)',   opacity: '1'   },
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)'    },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)'  },
          '50%':       { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        'pulse-bar': 'pulse-bar 1.1s ease-in-out infinite',
        'fade-up':   'fade-up 0.45s ease-out forwards',
        'fade-in':   'fade-in 0.35s ease-out forwards',
        'float':     'float 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
