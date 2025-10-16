import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';

export default defineConfig({
  base: '/',
  outDir: 'docs',
  integrations: [
    tailwind(),
    mdx()
  ]
});