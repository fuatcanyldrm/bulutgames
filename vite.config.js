import { defineConfig } from 'vite';

export default defineConfig({
  root: 'kaynak/labirent',
  base: '/oyunlar/labirent/',
  build: {
    outDir: '../../public/oyunlar/labirent',
    emptyOutDir: true,
  },
});
