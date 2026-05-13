/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        tactical: {
          bg: 'var(--color-bg)',
          panel: 'var(--color-panel)',
          panelSoft: 'var(--color-panel-soft)',
          line: 'var(--color-line)',
          text: 'var(--color-text)',
          muted: 'var(--color-muted)',
          accent: '#00A3C4',
          accentSoft: '#58d7ec',
        },
      },
      fontFamily: {
        display: ['"Barlow Condensed"', '"Rajdhani"', 'sans-serif'],
        tech: ['"IBM Plex Mono"', '"JetBrains Mono"', '"SFMono-Regular"', 'monospace'],
      },
      boxShadow: {
        tactical: '0 10px 30px rgba(0, 0, 0, 0.45)',
        accent: '0 0 0 1px rgba(0, 163, 196, 0.45), 0 10px 24px rgba(0, 163, 196, 0.18)',
      },
      letterSpacing: {
        tactical: '0.08em',
      },
      backgroundImage: {
        'tactical-overlay':
          'linear-gradient(180deg, rgba(18,18,18,0.02) 0%, rgba(18,18,18,0.25) 58%, rgba(18,18,18,0.45) 100%)',
      },
    },
  },
  plugins: [],
}
