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
        apple: {
          blue: '#0066cc',
          'blue-focus': '#0071e3',
          'blue-dark': '#2997ff',
          ink: '#1d1d1f',
          'ink-muted': '#333333',
          'ink-subtle': '#7a7a7a',
          canvas: '#ffffff',
          parchment: '#f5f5f7',
          pearl: '#fafafc',
          hairline: '#e0e0e0',
          tile: '#272729',
          'tile-alt': '#2a2a2c',
          'tile-deep': '#252527',
          black: '#000000',
        },
      },
      borderRadius: {
        'apple-sm': '8px',
        'apple-md': '11px',
        'apple-lg': '18px',
        'apple-pill': '9999px',
      },
      boxShadow: {
        'product': 'rgba(0, 0, 0, 0.22) 3px 5px 30px 0',
      },
      spacing: {
        'section': '80px',
      },
    },
  },
  plugins: [],
}
