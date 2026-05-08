// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/biker_friends_fr_website/' : '/',
  integrations: [mdx()],
  vite: {
    plugins: [tailwindcss()]
  }
});