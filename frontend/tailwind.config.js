/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#6366f1',
        'primary-dark': '#4f46e5',
        'dark': '#0f172a',
        'dark-secondary': '#1e293b',
        'dark-tertiary': '#334155',
        'accent': '#8b5cf6',
        'success': '#10b981',
        'warning': '#f59e0b',
        'danger': '#ef4444',
      },
      backgroundColor: {
        'primary': '#0f172a',
        'secondary': '#1e293b',
      },
      borderColor: {
        'primary': '#334155',
      },
    },
  },
  plugins: [],
};
