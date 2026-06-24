import { defineConfig } from 'vite';

export default defineConfig({
  root: 'oyunlar/labirent',
  base: '/oyunlar/labirent/',
  build: {
    outDir: '../../public/oyunlar/labirent',
    emptyOutDir: true,
  },
});
