import type { BaseConversionOptions, SupportedInputFormat, ConversionProgress } from "./conversion-types";

export type PDFSettings = 'screen' | 'ebook' | 'printer' | 'prepress' | 'default';

export type ColorConversionStrategy = 'LeaveColorUnchanged' | 'sRGB' | 'CMYK' | 'Gray';

export interface PDFCompressionOptions extends BaseConversionOptions {
  quality?: PDFSettings;
  colorConversionStrategy?: ColorConversionStrategy;
  downscaleImages?: boolean;
  imageResolution?: number;
  compressPages?: boolean;
  optimizeForWeb?: boolean;
  removeMetadata?: boolean;
  flattenTransparency?: boolean;
  compatibilityLevel?: '1.3' | '1.4' | '1.5' | '1.6' | '1.7';
  customArgs?: string[];
}

export interface EPSConversionOptions extends BaseConversionOptions {
  cropToEPS?: boolean;
  fitToPage?: boolean;
  pageSize?: 'a4' | 'letter' | 'legal' | 'a3' | 'a5' | 'custom';
  customWidth?: number;
  customHeight?: number;
  resolution?: number;
  colorConversionStrategy?: ColorConversionStrategy;
  customArgs?: string[];
}

export interface SerializablePDFCompressionOptions {
  quality?: PDFSettings;
  colorConversionStrategy?: ColorConversionStrategy;
  downscaleImages?: boolean;
  imageResolution?: number;
  compressPages?: boolean;
  optimizeForWeb?: boolean;
  removeMetadata?: boolean;
  flattenTransparency?: boolean;
  compatibilityLevel?: '1.3' | '1.4' | '1.5' | '1.6' | '1.7';
  customArgs?: string[];
}

export interface SerializableEPSConversionOptions {
  cropToEPS?: boolean;
  fitToPage?: boolean;
  pageSize?: 'a4' | 'letter' | 'legal' | 'a3' | 'a5' | 'custom';
  customWidth?: number;
  customHeight?: number;
  resolution?: number;
  colorConversionStrategy?: ColorConversionStrategy;
  customArgs?: string[];
}

export interface GhostscriptWorkerMessage {
  type: 'convert' | 'compress';
  data: {
    fileUrl: string;
    inputType: SupportedInputFormat;
    options: SerializablePDFCompressionOptions | SerializableEPSConversionOptions;
  };
}

export interface GhostscriptWorkerResponse {
  success: boolean;
  result?: { url: string; size: number };
  error?: string;
  progress?: ConversionProgress;
}