// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://paperclip.ing',
  server: {
    host: true,
    port: 4321,
    strictPort: true,
  },
});
