import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@dentacollab/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@dentacollab/ui/styles.css': path.resolve(__dirname, '../../packages/ui/src/styles/tokens.css'),
    },
  },
  server: { port: 5173 },
});
