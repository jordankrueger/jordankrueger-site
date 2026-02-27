// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://jordankrueger.com',
  output: 'static',
  integrations: [mdx()],
});
