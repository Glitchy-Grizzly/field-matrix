/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgDark: '#0f172a',
        panelBg: '#111827',
        neon: '#f43f5e',
        accent: '#38bdf8'
      }
    },
  },
  plugins: [],
}
