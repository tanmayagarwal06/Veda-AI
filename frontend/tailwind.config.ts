import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // VedaAI Brand Palette — extracted from Figma
        veda: {
          black: '#111111',
          'black-light': '#1C1C1E',
          orange: '#D4521A',
          'orange-hover': '#BC4817',
          'orange-light': '#FEF0E6',
          'orange-muted': '#F5D5C0',
          white: '#FFFFFF',
          'gray-50': '#F9FAFB',
          'gray-100': '#F3F4F6',
          'gray-200': '#E5E7EB',
          'gray-300': '#D1D5DB',
          'gray-400': '#9CA3AF',
          'gray-500': '#6B7280',
          'gray-600': '#4B5563',
          'gray-700': '#374151',
          'gray-900': '#111827',
        },
        // Difficulty badge colors
        difficulty: {
          easy: '#15803d',
          'easy-bg': '#dcfce7',
          medium: '#b45309',
          'medium-bg': '#fef3c7',
          hard: '#dc2626',
          'hard-bg': '#fee2e2',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Georgia', 'Times New Roman', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.06)',
        'sidebar-item': 'inset 3px 0 0 #D4521A',
        float: '0 8px 24px rgba(0,0,0,0.16)',
      },
      borderRadius: {
        '2.5xl': '1.25rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'dot-pattern': "radial-gradient(circle, #e5e7eb 1px, transparent 1px)",
        'gradient-veda': 'linear-gradient(135deg, #D4521A 0%, #F4822A 100%)',
        'shimmer-gradient': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
      },
      backgroundSize: {
        'dot-sm': '16px 16px',
        'dot-md': '24px 24px',
      },
    },
  },
  plugins: [],
};

export default config;
