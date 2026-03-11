import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // MMSS Brand Colors - Update these hex values when provided
        primary: {
          DEFAULT: 'var(--mmss-primary)',
          foreground: 'var(--mmss-primary-foreground)',
          50: 'var(--mmss-primary-50)',
          100: 'var(--mmss-primary-100)',
          200: 'var(--mmss-primary-200)',
          300: 'var(--mmss-primary-300)',
          400: 'var(--mmss-primary-400)',
          500: 'var(--mmss-primary-500)',
          600: 'var(--mmss-primary-600)',
          700: 'var(--mmss-primary-700)',
          800: 'var(--mmss-primary-800)',
          900: 'var(--mmss-primary-900)',
        },
        secondary: {
          DEFAULT: 'var(--mmss-secondary)',
          foreground: 'var(--mmss-secondary-foreground)',
        },
        accent: {
          DEFAULT: 'var(--mmss-accent)',
          foreground: 'var(--mmss-accent-foreground)',
        },
        background: 'var(--mmss-background)',
        foreground: 'var(--mmss-foreground)',
        muted: {
          DEFAULT: 'var(--mmss-muted)',
          foreground: 'var(--mmss-muted-foreground)',
        },
        border: 'var(--mmss-border)',
        ring: 'var(--mmss-ring)',
        destructive: {
          DEFAULT: 'var(--mmss-destructive)',
          foreground: 'var(--mmss-destructive-foreground)',
        },
        success: {
          DEFAULT: 'var(--mmss-success)',
          foreground: 'var(--mmss-success-foreground)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}

export default config
