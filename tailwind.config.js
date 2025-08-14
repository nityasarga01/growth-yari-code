/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // GrowthYari Brand Colors
        brand: {
          primary: '#2d5016', // Dark forest green from logo
          secondary: '#3d6b1f', // Lighter green
          accent: '#4a7c23', // Medium green
          light: '#5a8c2a', // Light green
          gray: '#6b7280', // Logo text gray
          'dark-gray': '#4b5563', // Darker gray
        },
        // Green color palette
        green: {
          50: '#f0f9f0',
          100: '#dcf2dc',
          200: '#bae5ba',
          300: '#8dd48d',
          400: '#5a8c2a',
          500: '#4a7c23',
          600: '#3d6b1f',
          700: '#2d5016',
          800: '#1f3a0f',
          900: '#0f1d08',
        }
      }
    },
  },
  plugins: [],
};
