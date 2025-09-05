import { defineConfig } from "vite";
import { resolve } from "path";
import copy from "rollup-plugin-copy";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "PDFConverter",
      fileName: (format) => `index.${format}.js`,
      formats: ['es', 'cjs']
    },
    target: "esnext",
    rollupOptions: {
      external: [
        '@resvg/resvg-wasm',
        'jspdf',
        'svg2pdf.js'
      ],
      output: {
        globals: {
          '@resvg/resvg-wasm': 'resvg',
          'jspdf': 'jsPDF',
          'svg2pdf.js': 'svg2pdf'
        }
      },
      plugins: [
        copy({
          targets: [
            {
              src: 'src/core/ghostscript/*',
              dest: 'dist/core/ghostscript'
            }
          ],
          hook: 'writeBundle'
        })
      ]
    }
  },
  worker: {
    format: "es"
  },
  optimizeDeps: {
    include: ['@resvg/resvg-wasm', 'jspdf', 'svg2pdf.js'],
    exclude: ['@resvg/resvg-wasm/index_bg.wasm']
  }
});