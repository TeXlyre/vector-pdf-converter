import type { ConversionResult, SupportedInputFormat, SVGConversionOptions } from '../types/conversion-types';
import type { PDFCompressionOptions, EPSConversionOptions } from '../types/ghostscript-types';
import { GhostscriptAPI } from './ghostscript/ghostscript-api';
import { ResvgConverter } from './svg/resvg-converter';
import { JSPDFConverter } from './svg/jspdf-converter';
import { Svg2pdfConverter } from './svg/svg2pdf-converter';
import { ValidationUtils } from '../utils/validation-utils';

export class PDFConverter {
  static async convertFile(
    file: File,
    options: SVGConversionOptions | PDFCompressionOptions | EPSConversionOptions = {}
  ): Promise<ConversionResult> {
    const fileType = ValidationUtils.getFileType(file);

    switch (fileType) {
      case 'pdf':
        return GhostscriptAPI.compressPDF(file, options as PDFCompressionOptions);

      case 'eps':
        return GhostscriptAPI.convertEPSToPDF(file, options as EPSConversionOptions);

      case 'svg':
        return this.convertSVG(file, options as SVGConversionOptions);

      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  static async convertSVG(file: File, options: SVGConversionOptions = {}): Promise<ConversionResult> {
    const backend = options.backend || 'resvg';

    switch (backend) {
      case 'resvg':
        return ResvgConverter.convert(file, options);
      case 'jspdf':
        return JSPDFConverter.convert(file, options);
      case 'svg2pdf':
        return Svg2pdfConverter.convert(file, options);
      default:
        throw new Error(`Unsupported SVG backend: ${backend}`);
    }
  }

  static getSupportedFormats(): SupportedInputFormat[] {
    return ['pdf', 'eps', 'svg'];
  }

  static getAvailableSVGBackends() {
    return ['resvg', 'jspdf', 'svg2pdf'];
  }
}