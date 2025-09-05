import type { ConversionResult } from '../../types/conversion-types';
import type { PDFCompressionOptions, EPSConversionOptions } from '../../types/ghostscript-types';
import { ValidationUtils } from '../../utils/validation-utils';

export class GhostscriptAPI {
  static async compressPDF(file: File, options: PDFCompressionOptions = {}): Promise<ConversionResult> {
    ValidationUtils.validateFile(file, ['pdf']);

    const fileUrl = URL.createObjectURL(file);

    try {
      const result = await this.processWithWorker({
        type: 'compress',
        data: {
          fileUrl,
          inputType: 'pdf',
          options: {
            quality: options.quality,
            colorConversionStrategy: options.colorConversionStrategy,
            downscaleImages: options.downscaleImages,
            imageResolution: options.imageResolution,
            compressPages: options.compressPages,
            optimizeForWeb: options.optimizeForWeb,
            removeMetadata: options.removeMetadata,
            flattenTransparency: options.flattenTransparency,
            compatibilityLevel: options.compatibilityLevel,
            customArgs: options.customArgs
          }
        }
      }, options.onProgress);

      return result;
    } finally {
      URL.revokeObjectURL(fileUrl);
    }
  }

  static async convertEPSToPDF(file: File, options: EPSConversionOptions = {}): Promise<ConversionResult> {
    ValidationUtils.validateFile(file, ['eps']);

    const fileUrl = URL.createObjectURL(file);

    try {
      const result = await this.processWithWorker({
        type: 'convert',
        data: {
          fileUrl,
          inputType: 'eps',
          options: {
            cropToEPS: options.cropToEPS,
            fitToPage: options.fitToPage,
            pageSize: options.pageSize,
            customWidth: options.customWidth,
            customHeight: options.customHeight,
            resolution: options.resolution,
            colorConversionStrategy: options.colorConversionStrategy,
            customArgs: options.customArgs
          }
        }
      }, options.onProgress);

      return result;
    } finally {
      URL.revokeObjectURL(fileUrl);
    }
  }

  private static async processWithWorker(
    message: any,
    onProgress?: (progress: any) => void
  ): Promise<ConversionResult> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(
        new URL('./worker.ts', import.meta.url),
        { type: 'module' }
      );

      let isResolved = false;

      const progressHandler = (e: MessageEvent) => {
        const { type, data } = e.data;

        if (type === 'progress' && onProgress && !isResolved) {
          onProgress(data);
        } else if (type === 'success' && !isResolved) {
          isResolved = true;
          resolve({ url: data.result.url, size: data.result.size });
        } else if (type === 'error' && !isResolved) {
          isResolved = true;
          worker.terminate();
          reject(new Error(data.error));
        }
      };

      worker.addEventListener('message', progressHandler);
      worker.postMessage(message);

      setTimeout(() => {
        if (!isResolved) {
          worker.terminate();
          reject(new Error('Worker timeout'));
        }
      }, 300000);
    });
  }
}