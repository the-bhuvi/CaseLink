/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4f9',
          100: '#dce5f1',
          200: '#bccce4',
          300: '#94aed3',
          400: '#678bbd',
          500: '#486da7',
          600: '#365589',
          700: '#2c446e',
          800: '#25385a',
          900: '#14243A', // Brand Primary Navy
          950: '#0c1726',
        },
        civic: {
          blue: '#356AE6', // Brand Blue
          'blue-hover': '#2854bf',
          'blue-subtle': '#EEF3FF',
          'off-white': '#F5F7FA',
          slate: '#64748B',
          border: '#E2E8F0',
        },
        status: {
          received: {
            bg: '#F1F5F9',
            text: '#334155',
            border: '#CBD5E1'
          },
          review: {
            bg: '#FEF3C7',
            text: '#92400E',
            border: '#FDE68A'
          },
          progress: {
            bg: '#EFF6FF',
            text: '#1D4ED8',
            border: '#BFDBFE'
          },
          awaiting: {
            bg: '#F5F3FF',
            text: '#6D28D9',
            border: '#DDD6FE'
          },
          escalated: {
            bg: '#FFF1F2',
            text: '#BE123C',
            border: '#FECDD3'
          },
          disposed: {
            bg: '#ECFDF5',
            text: '#047857',
            border: '#A7F3D0'
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'hover': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'modal': '0 10px 25px -5px rgba(20, 36, 58, 0.1), 0 8px 10px -6px rgba(20, 36, 58, 0.05)',
      },
      borderRadius: {
        'civic': '10px',
      }
    },
  },
  plugins: [],
}
