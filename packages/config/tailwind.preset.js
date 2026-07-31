/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0d6e6e',
          dark: '#084f4f',
          soft: '#d7efeb',
        },
        accent: {
          DEFAULT: '#2bb5a0',
          soft: '#e3f8f3',
        },
        ink: {
          DEFAULT: '#0f2a2a',
          muted: '#4a6563',
        },
      },
      fontFamily: {
        display: ['"IBM Plex Sans Arabic"', 'Segoe UI', 'sans-serif'],
        body: ['"IBM Plex Sans Arabic"', 'Segoe UI', 'sans-serif'],
      },
    },
  },
};
