/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        chatBg: {
          light: '#f3f4f6',
          dark: '#0b141a',
        },
        panelBg: {
          light: '#ffffff',
          dark: '#111b21',
        },
        panelBorder: {
          light: '#e2e8f0',
          dark: '#222e35',
        },
        bubbleSelf: {
          light: '#d9fdd3',
          dark: '#005c4b',
        },
        bubbleOther: {
          light: '#ffffff',
          dark: '#202c33',
        },
      },
    },
  },
  plugins: [],
}
