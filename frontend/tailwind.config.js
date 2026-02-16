/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                slate: {
                    850: '#151e2e',
                    900: '#0f172a',
                    950: '#020617',
                },
                primary: {
                    DEFAULT: '#06b6d4', // Cyan 500
                    glow: '#06b6d480',
                },
                accent: {
                    DEFAULT: '#f43f5e', // Rose 500
                    glow: '#f43f5e80',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
