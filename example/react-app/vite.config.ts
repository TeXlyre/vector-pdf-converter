import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: '../../src/core/ghostscript/*',
          dest: 'core/ghostscript'
        }
      ]
    })
  ],
  build: {
    target: "esnext",
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-libs': ['jspdf', 'svg2pdf.js'],
          'resvg': ['@resvg/resvg-wasm'],
          'react-vendor': ['react', 'react-dom']
        }
      }
    }
  },
  base: "./",
  worker: {
    format: "es"
  },
  server: {
    fs: {
      allow: [
        resolve(__dirname, "../.."),
        resolve(__dirname, "../../node_modules")
      ]
    }
  },
  resolve: {
    alias: {
      "vector-pdf-converter": resolve(__dirname, "../../src")
    }
  },
  optimizeDeps: {
    include: ['@resvg/resvg-wasm', 'jspdf', 'svg2pdf.js'],
    exclude: ['@resvg/resvg-wasm/index_bg.wasm']
  }
});