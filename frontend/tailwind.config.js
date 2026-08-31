/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#F3F5FC',
          100: '#E2E7F8',
          200: '#C3CDF0',
          300: '#8CA0DD',
          400: '#4A6BC8',
          500: '#1E44A6',
          600: '#0B2B86',
          700: '#001D69',
          800: '#001A5E',
          900: '#001450',
          950: '#000D38'
        },
        gold: {
          50: '#FFF9E8',
          100: '#FFF0C6',
          200: '#FFE38F',
          300: '#FFD97A',
          400: '#FDC84D',
          500: '#FDBF2E',
          600: '#E0A416',
          700: '#B9860C',
          800: '#8F670A'
        }
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 4px 20px -4px rgba(0, 20, 80, 0.12)',
        'card-hover': '0 12px 32px -8px rgba(0, 20, 80, 0.28)'
      }
    }
  },
  plugins: []
};
