import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // IGNITEブランドカラー（blue/navy）
        brand: {
          50: '#e8f0fb',
          100: '#c6d7f5',
          200: '#9dbdee',
          300: '#70a2e6',
          400: '#4a8cdf',
          500: '#2677d9',
          600: '#1855AF',
          700: '#14499a',
          800: '#0f3a7d',
          900: '#091f4a',
        },
      },
      fontFamily: {
        sans: ['Open Sans', 'Noto Sans JP', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
