// @ts-check
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'

import tailwindcss from '@tailwindcss/vite'

import sitemap from '@astrojs/sitemap'

// https://astro.build/config
export default defineConfig({
  base: '/',
  site: 'https://www.bikerfriends.fr',
  integrations: [mdx(), sitemap()],
  image: {
    // Format des images : WebP par défaut, fallback JPEG
    formats: ['webp', 'avif'],
    // Compression et optimisation
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: false,
      },
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
})
