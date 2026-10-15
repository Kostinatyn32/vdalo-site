import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset URLs allow this build to work both at a standalone preview
  // origin and under /tools/qr-studio/ on vdalo.tech.
  base: './',
});
