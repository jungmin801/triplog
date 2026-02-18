/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#ee845d',
          pressed: '#d6714d',
          'disabled-bg': '#e5e1d8',
        },
        ink: {
          DEFAULT: '#1a1f2b',
          light: '#1a202c',
        },
        background: '#ffffff',
        surface: '#f5f2ed',
        'surface-alt': '#f8f6f6',
        border: 'rgba(26, 31, 43, 0.1)',
      },
      borderRadius: {
        'btn': '16px',
        'btn-sm': '8px',
        'card': '24px',
        'card-sm': '8px',
        'input': '32px',
        'tag': '6px',
        'pill': '9999px',
      },
      spacing: {
        'btn-y-lg': '12px',
        'btn-y': '12px',
        'btn-y-sm': '6px',
        'btn-x-lg': '24px',
        'btn-x': '16px',
        'btn-x-sm': '12px',
        'space-item': '8px',
        'space-card': '16px',
        'space-section': '24px',
      },
      fontSize: {
        'h1': ['30px', { lineHeight: '37.5px', letterSpacing: '-0.75px' }],
        'h2': ['20px', { lineHeight: '28px' }],
        'h3': ['18px', { lineHeight: '28px' }],
        'h4': ['14px', { lineHeight: '20px' }],
        'body': ['14px', { lineHeight: '22.75px' }],
        'body-sm': ['12px', { lineHeight: '16px' }],
        'caption': ['11px', { lineHeight: '16.5px' }],
        'overline': ['10px', { lineHeight: '15px', letterSpacing: '2px' }],
        'small': ['9px', { lineHeight: '13.5px' }],
        'btn-lg': ['16px', { lineHeight: '24px' }],
        'btn': ['14px', { lineHeight: '20px' }],
        'btn-sm': ['11px', { lineHeight: '16.5px' }],
      },
      height: {
        'btn-lg': '56px',
        'btn': '40px',
        'btn-sm': '29px',
      },
      minHeight: {
        'btn-lg': '56px',
        'btn': '40px',
        'btn-sm': '29px',
      },
    },
  },
  plugins: [],
};
