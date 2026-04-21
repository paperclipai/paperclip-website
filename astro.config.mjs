// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  site: 'https://paperclip.ing',
  integrations: [
    starlight({
      title: 'Paperclip Docs',
      disable404Route: true,
      customCss: ['./src/styles/starlight-brand.css'],
      components: {
        Header: './src/components/starlight/Header.astro',
        ThemeSelect: './src/components/starlight/ThemeSelect.astro',
        ThemeProvider: './src/components/starlight/ThemeProvider.astro',
      },
      sidebar: [
        {
          // TODO versioning: wire this group label to a real version switcher
          // once multi-version docs are ready. For now it is a static "v1.0" stub.
          label: 'v1.0',
          items: [
            { label: 'Overview', link: '/docs/' },
            { label: 'Tutorials', link: '/docs/tutorials/' },
            { label: 'How-to Guides', link: '/docs/how-to/' },
            { label: 'Reference', link: '/docs/reference/' },
            { label: 'Explanation', link: '/docs/explanation/' },
            { label: 'Glossary', link: '/docs/glossary/' },
            { label: 'Changelog', link: '/changelog/', attrs: { target: '_self' } },
          ],
        },
      ],
    }),
  ],
  server: {
    host: true,
    port: 4321,
    strictPort: true,
  },
});
