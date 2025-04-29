/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      width: {
        'terminal': '800px',
      },
      height: {
        'terminal': '600px',
      },
    },
  },
  plugins: [],
}