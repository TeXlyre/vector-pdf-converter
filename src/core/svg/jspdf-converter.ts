import jsPDF from 'jspdf';

import type { ConversionResult, SVGConversionOptions } from '../../types/conversion-types';
import { ValidationUtils } from '../../utils/validation-utils';

export class JSPDFConverter {
  static async convert(file: File, options: SVGConversionOptions = {}): Promise<ConversionResult> {
    ValidationUtils.validateFile(file, ['svg']);

    const svgContent = await this.readFileAsText(file);
    const { mmWidth, mmHeight, pixelWidth, pixelHeight } = this.getSvgDimensions(svgContent, options);

    options.onProgress?.({ stage: 'processing', progress: 25 });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to create canvas context');

    const scale = options.scale || 3;
    canvas.width = pixelWidth * scale;
    canvas.height = pixelHeight * scale;
    ctx.scale(scale, scale);

    ctx.fillStyle = options.backgroundColor || 'white';
    ctx.fillRect(0, 0, pixelWidth, pixelHeight);

    options.onProgress?.({ stage: 'processing', progress: 50 });

    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    try {
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, pixelWidth, pixelHeight);
          resolve();
        };
        img.onerror = () => reject(new Error('Failed to load SVG image'));
        img.src = svgUrl;
      });

      options.onProgress?.({ stage: 'processing', progress: 75 });

      const pdf = new jsPDF({
        orientation: mmWidth > mmHeight ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [mmWidth, mmHeight]
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      pdf.addImage(imgData, 'PNG', 0, 0, mmWidth, mmHeight, '', 'FAST');

      options.onProgress?.({ stage: 'finalizing', progress: 100 });

      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);

      return {
        url: pdfUrl,
        size: pdfBlob.size,
        metadata: {
          backend: 'jspdf',
          dimensions: { width: mmWidth, height: mmHeight },
          scale
        }
      };
    } finally {
      URL.revokeObjectURL(svgUrl);
    }
  }

  private static async readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read SVG file'));
      reader.readAsText(file);
    });
  }

  private static getSvgDimensions(svgContent: string, options: SVGConversionOptions) {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
    const svgElement = svgDoc.documentElement;

    const parserError = svgDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Invalid SVG file');
    }

    let width = 210;
    let height = 297;

    if (options.width && options.height) {
      width = (options.width * 25.4) / 96;
      height = (options.height * 25.4) / 96;
    } else {
      const viewBox = svgElement.getAttribute('viewBox');
      const svgWidth = svgElement.getAttribute('width');
      const svgHeight = svgElement.getAttribute('height');

      if (viewBox) {
        const [, , vbWidth, vbHeight] = viewBox.split(/\s+/).map(Number);
        width = ((vbWidth || 0) * 25.4) / 96;
        height = ((vbHeight || 0) * 25.4) / 96;
      } else if (svgWidth && svgHeight) {
        const w = parseFloat(svgWidth);
        const h = parseFloat(svgHeight);

        if (svgWidth.includes('mm')) {
          width = w;
        } else if (svgWidth.includes('cm')) {
          width = w * 10;
        } else if (svgWidth.includes('in')) {
          width = w * 25.4;
        } else {
          width = (w * 25.4) / 96;
        }

        if (svgHeight.includes('mm')) {
          height = h;
        } else if (svgHeight.includes('cm')) {
          height = h * 10;
        } else if (svgHeight.includes('in')) {
          height = h * 25.4;
        } else {
          height = (h * 25.4) / 96;
        }
      }
    }

    if (options.scale) {
      width *= options.scale;
      height *= options.scale;
    }

    width = Math.max(10, Math.min(500, width));
    height = Math.max(10, Math.min(500, height));

    const mmWidth = Math.round(width);
    const mmHeight = Math.round(height);

    return {
      mmWidth,
      mmHeight,
      pixelWidth: Math.round((width * 96) / 25.4),
      pixelHeight: Math.round((height * 96) / 25.4)
    };
  }
}