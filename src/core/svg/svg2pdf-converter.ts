import { jsPDF } from 'jspdf';
import 'svg2pdf.js';

import type { ConversionResult, SVGConversionOptions } from '../../types/conversion-types';
import { ValidationUtils } from '../../utils/validation-utils';

export class Svg2pdfConverter {
  private static initialized = true;

  static async initialize(): Promise<void> {
    // svg2pdf.js is a direct plugin for jsPDF and doesn't require asynchronous initialization.
    // This method is included for interface consistency.
    return Promise.resolve();
  }

  static async convert(file: File, options: SVGConversionOptions = {}): Promise<ConversionResult> {
    ValidationUtils.validateFile(file, ['svg']);

    if (!this.initialized) {
      await this.initialize();
    }

    const svgContent = await this.readFileAsText(file);
    const { mmWidth, mmHeight } = this.getSvgDimensions(svgContent, options);

    options.onProgress?.({ stage: 'processing', progress: 25 });

    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
    const svgElement = svgDoc.documentElement;

    const parserError = svgElement.querySelector('parsererror');
    if (parserError) {
      throw new Error('Invalid SVG file content');
    }

    const pdf = new jsPDF({
      orientation: mmWidth > mmHeight ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [mmWidth, mmHeight]
    });

    options.onProgress?.({ stage: 'processing', progress: 50 });

    await pdf.svg(svgElement, {
      x: 0,
      y: 0,
      width: mmWidth,
      height: mmHeight
    });

    options.onProgress?.({ stage: 'finalizing', progress: 100 });

    const pdfBlob = pdf.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);

    return {
      url: pdfUrl,
      size: pdfBlob.size,
      metadata: { backend: 'svg2pdf', dimensions: { width: mmWidth, height: mmHeight } }
    };
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

        width = svgWidth.includes('mm') ? w :
                svgWidth.includes('cm') ? w * 10 :
                svgWidth.includes('in') ? w * 25.4 : (w * 25.4) / 96;

        height = svgHeight.includes('mm') ? h :
                 svgHeight.includes('cm') ? h * 10 :
                 svgHeight.includes('in') ? h * 25.4 : (h * 25.4) / 96;
      }
    }

    if (options.scale) {
      width *= options.scale;
      height *= options.scale;
    }

    width = Math.max(10, Math.min(500, width));
    height = Math.max(10, Math.min(500, height));

    return {
      mmWidth: Math.round(width),
      mmHeight: Math.round(height)
    };
  }
}