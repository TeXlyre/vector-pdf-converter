export { PDFConverter } from './core/pdf-converter';
export { GhostscriptAPI } from './core/ghostscript/ghostscript-api';
export { ValidationUtils } from './utils/validation-utils';
export { getOutputFileName } from './utils/file-utils';

export type {
  ConversionResult,
  ConversionProgress,
  SupportedInputFormat,
  SVGBackend,
  SVGConversionOptions
} from './types/conversion-types';

export type {
  PDFCompressionOptions,
  EPSConversionOptions,
  PDFSettings,
  ColorConversionStrategy
} from './types/ghostscript-types';