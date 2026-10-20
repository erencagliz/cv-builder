import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { statSync } from 'node:fs';

// İndirme ilerlemesi için: sunucu wasm'ı sıkıştırınca Content-Length gerçek boyutu vermez
const COMPILER_WASM_SIZE = statSync('node_modules/@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm').size;

export default defineConfig({
  plugins: [react()],
  base: '/',
  define: { __COMPILER_WASM_SIZE__: String(COMPILER_WASM_SIZE) },
  worker: { format: 'es' },
  optimizeDeps: { exclude: ['@myriaddreamin/typst-ts-web-compiler', '@myriaddreamin/typst-ts-renderer'] },
  build: { target: 'es2022', chunkSizeWarningLimit: 1500 },
});
