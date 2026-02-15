/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './index.html',
        './src/**/*.{svelte,js,ts}',
    ],
    theme: {
        extend: {
            fontFamily: {
                mono: ['ui-monospace', 'SFMono-Regular', 'SF Mono', 'Menlo', 'Consolas', 'Liberation Mono', 'monospace'],
            },
        },
    },
    plugins: [],
};
