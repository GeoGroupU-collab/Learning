import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// base './' để chạy được dưới /Learning/ trên GitHub Pages mà không phải sửa khi đổi tên kho.
// Hai trang: web lớp (index.html) và web quản trị riêng của lớp trưởng (admin/index.html).
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    target: 'es2020',
    rollupOptions: { input: { main: resolve(__dirname, 'index.html'), admin: resolve(__dirname, 'admin/index.html') } },
  },
});
