import type { SupportedInputFormat } from '../types/conversion-types';

export class ValidationUtils {
  static validateFile(file: File, allowedTypes?: SupportedInputFormat[]): void {
    if (!file) {
      throw new Error('File is required');
    }

    const fileType = this.getFileType(file);
    if (!fileType) {
      throw new Error('Unsupported file type');
    }

    if (allowedTypes && !allowedTypes.includes(fileType)) {
      throw new Error(`File type ${fileType} not allowed. Supported: ${allowedTypes.join(', ')}`);
    }

    if (file.size === 0) {
      throw new Error('File is empty');
    }

    if (file.size > 100 * 1024 * 1024) {
      throw new Error('File too large (max 100MB)');
    }
  }

  static getFileType(file: File): SupportedInputFormat | null {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const mimeType = file.type.toLowerCase();

    if (extension === 'eps' || mimeType === 'application/postscript') {
      return 'eps';
    }
    if (extension === 'svg' || mimeType === 'image/svg+xml') {
      return 'svg';
    }
    if (extension === 'pdf' || mimeType === 'application/pdf') {
      return 'pdf';
    }

    return null;
  }

  static getAcceptedMimeTypes(): string {
    return 'application/pdf,application/postscript,image/svg+xml,.pdf,.eps,.svg';
  }
}