// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/biker_friends_fr_website/' : '/',
  integrations: [mdx()],
  image: {
    // Format des images : WebP par défaut, fallback JPEG
    formats: ['webp', 'avif'],
    // Compression et optimisation
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: false,
      }
    }
  },
  vite: {
    plugins: [tailwindcss()]
  }
});