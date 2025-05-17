/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: false, // Disable dark mode to force light theme
  theme: {
    extend: {
      colors: {
        // Light color scheme
        background: '#FFFFFF',
        foreground: '#111827',
        card: '#F8F9FA',
        'card-foreground': '#1F2937', // Darker text for better contrast
        border: '#E5E7EB',
        input: '#F3F4F6',
        // Candy red gradient colors
        'candy-red-light': '#fc3c44',
        'candy-red': '#f94c57',
        'candy-red-dark': '#c33c50',
        // Modal text (ensure good contrast)
        'modal-text': '#1F2937',
        'modal-text-muted': '#4B5563',
      },
    },
  },
  plugins: [],
} 