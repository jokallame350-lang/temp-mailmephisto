import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command }) => ({
  server: {
    port: 3000,
    host: '127.0.0.1',
  },
  preview: {
    port: 4173,
    host: '127.0.0.1',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    sourcemap: false,
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('lucide-react')) return 'lucide-react';
          if (id.includes('dompurify')) return 'dompurify';
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) return 'react-vendor';
          return 'vendor';
        },
      },
    },
  },
  // Avoid changing production behavior based on the Vite command.
  define: command === 'build' ? {} : {},
}));
