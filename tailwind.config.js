export default {
  content: ['./client/**/*.{js,ts,jsx,tsx}', './client/index.html'],
  theme: {
    extend: {
      colors: {
        primary: '#1d4ed8',
        secondary: '#0f172a',
        accent: '#14b8a6',
        ink: '#0f172a',
        mist: '#f8fafc',
      },
      boxShadow: {
        soft: '0 10px 30px rgba(15, 23, 42, 0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
