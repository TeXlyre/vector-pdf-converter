import { defineConfig } from 'vite';
import { resolve } from 'path';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  base: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-libs': ['jspdf', 'svg2pdf.js'],
          'resvg': ['@resvg/resvg-wasm'],
        }
      }
    }
  },
  worker: {
    format: 'es',
    plugins: () => [wasm(), topLevelAwait()]
  },
  server: {
    fs: {
      allow: [
        resolve(__dirname, '../..'),
        resolve(__dirname, '../../node_modules'),
        resolve(__dirname, '../../src')
      ]
    }
  },
  resolve: {
    alias: {
      'vector-pdf-converter': resolve(__dirname, '../../src/index.ts')
    }
  },
  optimizeDeps: {
    include: ['@resvg/resvg-wasm', 'jspdf', 'svg2pdf.js'],
    exclude: ['@resvg/resvg-wasm/index_bg.wasm']
  },
  plugins: [
    wasm(),
    topLevelAwait(),
    viteStaticCopy({
      targets: [
        {
          src: resolve(__dirname, '../../dist/core/ghostscript/*'),
          dest: 'core/ghostscript'
        }
      ]
    })
  ]
});