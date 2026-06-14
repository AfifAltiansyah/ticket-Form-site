export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          50: '#fff5f0',
          100: '#ffdace',
          200: '#ffb599',
          300: '#ff8f64',
          400: '#ff6633',
          500: '#fe330a',
          600: '#e02b07',
          700: '#c22306',
        },
        surface: {
          base: '#efeae3',
          elevated: '#f8f5f0',
          card: '#ffffff',
          hover: '#f0ece5',
          border: '#e0d8cc',
        },
        text: {
          primary: '#000000',
          secondary: '#5c5c5c',
          muted: '#8c8c8c',
          dim: '#b0b0b0',
        },
      },
      borderRadius: {
        'card': '16px',
        'btn': '12px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 20px 60px -20px rgba(0,0,0,0.1)',
      },
      keyframes: {
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'spin-slow': 'spin-slow 20s linear infinite',
      },
    },
  },
  plugins: [],
}
