import { defineConfig } from 'vite';

// base './' để chạy được dưới /Learning/ trên GitHub Pages mà không phải sửa khi đổi tên kho.
export default defineConfig({
  base: './',
  build: { outDir: 'dist', target: 'es2020' },
});
