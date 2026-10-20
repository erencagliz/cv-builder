/// <reference types="vite/client" />
declare module '*.typ?raw' {
  const src: string;
  export default src;
}
declare module 'pdfjs-dist/build/pdf.worker.min.mjs?url' {
  const url: string;
  export default url;
}
