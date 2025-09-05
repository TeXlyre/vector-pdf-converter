declare module 'svg2pdf.js' {
  export interface SVG2PDFOptions {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    loadExternalStyleSheets?: boolean;
    colorCallback?: () => string;
  }
}

declare module 'jspdf' {
  interface jsPDF {
    svg(element: Element, options?: any): Promise<void>;
  }
}

declare global {
  const Module: any;
}
