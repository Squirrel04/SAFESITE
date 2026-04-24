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
                    DEFAULT: '#fbbf24', // Amber 400
                    glow: '#fbbf2480',
                },
                accent: {
                    DEFAULT: '#facc15', // Yellow 400
                    glow: '#facc1580',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
