/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{html,js,svelte,ts}'],
    theme: {
        extend: {
            fontFamily: {
                'sans': ['Mulish', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
                'mono': ['SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'Consolas', 'Courier New', 'monospace']
            },

            // Custom spacing for consistent design
            spacing: {
                '18': '4.5rem',
                '22': '5.5rem',
            },

            // Enhanced shadows with HSL
            boxShadow: {
                'soft': '0 2px 8px hsla(0, 0%, 0%, 0.3)',
                'medium': '0 4px 16px hsla(0, 0%, 0%, 0.4)',
                'large': '0 8px 32px hsla(0, 0%, 0%, 0.5)',
                'glow': '0 0 20px hsla(220, 70%, 70%, 0.2)',
            }
        },
    },
    plugins: [],
}