/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lola: {
          purple: '#1E1B4B',
          pink: '#EC4899',
        },
      },
    },
  },
  plugins: [],
}
