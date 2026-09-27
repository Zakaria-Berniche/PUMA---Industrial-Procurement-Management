/// <reference types="vitest" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.')
      }
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true
        }
      }
    },
    test: {
      globals: true,
      setupFiles: './src/setupTests.ts',
      // Vitest 4 uses "projects" instead of "workspace"
      projects: [
        {
          test: {
            name: 'frontend',
            include: ['src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}'],
            environment: 'jsdom',
            globals: true,
            setupFiles: ['./src/setupTests.ts']
          }
        },
        {
          test: {
            name: 'server',
            include: ['server/**/*.test.ts', 'server/**/*.spec.ts'],
            environment: 'node',
            globals: true,
            setupFiles: []
          }
        }
      ]
    }
  };
});
