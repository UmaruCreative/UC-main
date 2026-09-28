import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';
import { slug } from 'github-slugger';

// English lives at the root. Everything that used to sit under /en/ forwards to its new address,
// so old links, bookmarks and search results keep working.
const oldEnglishPages = {
  '/en': '/',
  '/en/pricing': '/pricing/',
  '/en/contact': '/contact/',
  '/en/services/web-design': '/services/web-design/',
  '/en/services/content-creation': '/services/content-creation/',
  '/en/services/google-my-business': '/services/google-my-business/',
  '/en/services/weekly-reports': '/services/weekly-reports/',
  '/en/articles': '/articles/',
};

// Each English article moved from /en/articles/en/<name>/ to /articles/<name>/.
// Articles with their own `slug:` in the front matter used to live at /en/articles/<slug>/.
const articlesDir = new URL('./src/content/articles/en/', import.meta.url);
for (const file of readdirSync(articlesDir)) {
  if (!/\.mdx?$/.test(file)) continue;
  const custom = readFileSync(new URL(file, articlesDir), 'utf8').match(/^slug:\s*["']?([^"'\n]+?)["']?\s*$/m);
  const name = custom ? custom[1] : slug(file.replace(/\.mdx?$/, ''));
  const from = custom ? `/en/articles/${name}` : `/en/articles/en/${name}`;
  oldEnglishPages[from] = `/articles/${name}/`;
}

export default defineConfig({
  site: 'https://umaru-creative.com',
  base: '/',
  outDir: 'docs',
  redirects: oldEnglishPages,
  integrations: [
    tailwind(),
    mdx(),
    sitemap({
      // Forwarding pages are not real pages, so keep them out of the sitemap
      filter: (page) => !page.includes('/en/'),
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', fi: 'fi', sv: 'sv', fr: 'fr', no: 'nb' },
      },
    }),
  ],
});
