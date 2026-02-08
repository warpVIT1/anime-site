import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // AniHub темна тема
        bg: {
          DEFAULT: '#111827',
          secondary: '#1f2937',
          card: '#1f2937',
          hover: '#374151',
        },
        text: {
          DEFAULT: '#f9fafb',
          secondary: '#9ca3af',
          muted: '#6b7280',
        },
        violet: {
          DEFAULT: '#7c3aed',
          light: '#8b5cf6',
          dark: '#6d28d9',
          950: '#2e1065',
        },
        border: '#374151',
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'Segoe UI', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'violet-glow': 'radial-gradient(ellipse at center, rgba(124, 58, 237, 0.15) 0%, transparent 70%)',
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 10px 25px -5px rgba(124, 58, 237, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
