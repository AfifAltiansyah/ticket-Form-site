export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"SF Pro Display"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        body: ['"SF Pro Text"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'hero': ['56px', { lineHeight: '1.07', letterSpacing: '-0.28px', fontWeight: '600' }],
        'display-lg': ['40px', { lineHeight: '1.1', letterSpacing: '0', fontWeight: '600' }],
        'lead': ['28px', { lineHeight: '1.14', letterSpacing: '0.196px', fontWeight: '400' }],
        'tagline': ['21px', { lineHeight: '1.19', letterSpacing: '0.231px', fontWeight: '600' }],
        'body-lg': ['17px', { lineHeight: '1.47', letterSpacing: '-0.374px' }],
      },
      colors: {
        claude: {
          brand: '#D97757',
          'brand-hover': '#C5694A',
          'brand-light': '#FDF0E8',
          ink: '#1E1916',
          'ink-muted': '#5C4F48',
          'ink-subtle': '#9C8F86',
          canvas: '#FFFDFA',
          cream: '#FAF7F2',
          sand: '#F5F0EB',
          hairline: '#E8E2DB',
          tile: '#2D2420',
          'tile-text': '#E6DDD5',
          'tile-subtle': '#B5A99F',
          'tile-border': 'rgba(255,255,255,0.08)',
          black: '#14110F',
        },
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '18px',
        'pill': '9999px',
      },
      boxShadow: {
        'product': '0 4px 24px rgba(0,0,0,0.12)',
      },
      spacing: {
        'section': '80px',
      },
    },
  },
  plugins: [],
}
