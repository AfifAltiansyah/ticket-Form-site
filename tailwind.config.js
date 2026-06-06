export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        surface: {
          base: '#0f0f0f',
          elevated: '#1a1a1a',
          card: '#222222',
          hover: '#2a2a2a',
          border: '#2e2e2e',
        },
        text: {
          primary: '#ffffff',
          secondary: '#a3a3a3',
          muted: '#737373',
          dim: '#525252',
        },
      },
      borderRadius: {
        'card': '16px',
        'btn': '12px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.4), 0 20px 60px -20px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
}
