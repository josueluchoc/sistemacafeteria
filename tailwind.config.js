/** @type {import('tailwindcss').Config} */

export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            // Aquí podemos agregar colores personalizados de la parroquia en el futuro
            fontFamily: {
                sans: ['Urbanist', 'sans-serif'],
            },
        },
    },
    plugins: [],
}