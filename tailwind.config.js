/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3498db',
          dark: '#2980b9',
        },
        success: '#2ecc71',
        warning: '#f39c12',
        danger: '#e74c3c',
      }
    },
  },
  plugins: [],
}