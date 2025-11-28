/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{html,js,svelte,ts}'],
    theme: {
        extend: {
            fontFamily: {
                'sans': ['Mulish', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
                'mono': ['SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'Consolas', 'Courier New', 'monospace']
            },
            colors: {
                // Your specified color palette
                'bg': '#101010',           // Main background 
                'surface': '#141414',      // Buttons and interactive elements
                'text': '#F5F5F5',         // Main text color
                'accent': '#EE3B3E',       // Rare accent color for errors/highlights
            },

            // Custom spacing for consistent design
            spacing: {
                '18': '4.5rem',
                '22': '5.5rem',
            },

            // Custom shadows for depth
            boxShadow: {
                'surface': '0 1px 3px rgba(0, 0, 0, 0.3)',
                'elevated': '0 2px 8px rgba(0, 0, 0, 0.3)',
                'floating': '0 4px 12px rgba(0, 0, 0, 0.4)',
            }
        },
    },
    plugins: [],
}
