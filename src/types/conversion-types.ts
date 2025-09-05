export interface ConversionResult {
  url: string;
  size?: number;
  metadata?: Record<string, any>;
}

export interface ConversionProgress {
  stage: 'initializing' | 'processing' | 'finalizing';
  progress: number;
  message?: string;
}

export type SupportedInputFormat = 'pdf' | 'eps' | 'svg';
export type SupportedOutputFormat = 'pdf';

export type SVGBackend = 'resvg' | 'jspdf' | 'svg2pdf';

export interface BaseConversionOptions {
  onProgress?: (progress: ConversionProgress) => void;
  onError?: (error: Error) => void;
}

export interface SVGConversionOptions extends BaseConversionOptions {
  backend?: SVGBackend;
  width?: number | undefined;
  height?: number | undefined;
  scale?: number;
  backgroundColor?: string;
  preserveAspectRatio?: boolean;
}