import type { PDFCompressionOptions, EPSConversionOptions } from '../../types/ghostscript-types';

export class GhostscriptOptionsBuilder {
  static buildCompressionArgs(options: PDFCompressionOptions): string[] {
    const args = [
      '-sDEVICE=pdfwrite',
      `-dCompatibilityLevel=${options.compatibilityLevel || '1.4'}`,
      '-dNOPAUSE',
      '-dQUIET',
      '-dBATCH'
    ];

    const quality = options.quality || 'ebook';
    args.push(`-dPDFSETTINGS=/${quality}`);

    if (options.colorConversionStrategy) {
      args.push(`-dColorConversionStrategy=/${options.colorConversionStrategy}`);
    }

    if (options.downscaleImages) {
      args.push('-dDownsampleColorImages=true');
      args.push('-dDownsampleGrayImages=true');
      args.push('-dDownsampleMonoImages=true');

      if (options.imageResolution) {
        args.push(`-dColorImageResolution=${options.imageResolution}`);
        args.push(`-dGrayImageResolution=${options.imageResolution}`);
        args.push(`-dMonoImageResolution=${options.imageResolution}`);
      }
    }

    if (options.compressPages) {
      args.push('-dCompressPages=true');
      args.push('-dUseFlateCompression=true');
    }

    if (options.optimizeForWeb) {
      args.push('-dOptimize=true');
      args.push('-dCreateJobTicket=false');
      args.push('-dPreserveEPSInfo=false');
      args.push('-dPreserveOPIComments=false');
      args.push('-dPreserveOverprintSettings=false');
      args.push('-dUCRandBGInfo=/Remove');
    }

    if (options.removeMetadata) {
      args.push('-dFilterCloseFile=true');
      args.push('-dRemoveColorComments=true');
    }

    if (options.flattenTransparency) {
      args.push('-dNoTransparency=true');
    }

    if (options.customArgs) {
      args.push(...options.customArgs);
    }

    return args;
  }

  static buildEPSArgs(options: EPSConversionOptions): string[] {
    const args = [
      '-sDEVICE=pdfwrite',
      `-dCompatibilityLevel=1.4`,
      '-dNOPAUSE',
      '-dQUIET',
      '-dBATCH'
    ];

    if (options.cropToEPS) {
      args.push('-dEPSCrop=true');
    }

    if (options.fitToPage) {
      args.push('-dEPSFitPage=true');
    }

    if (options.pageSize && options.pageSize !== 'custom') {
      const pageSizes = {
        a4: '-sPAPERSIZE=a4',
        letter: '-sPAPERSIZE=letter',
        legal: '-sPAPERSIZE=legal',
        a3: '-sPAPERSIZE=a3',
        a5: '-sPAPERSIZE=a5'
      };
      args.push(pageSizes[options.pageSize]);
    } else if (options.customWidth && options.customHeight) {
      args.push(`-dDEVICEWIDTHPOINTS=${options.customWidth}`);
      args.push(`-dDEVICEHEIGHTPOINTS=${options.customHeight}`);
      args.push('-dFIXEDMEDIA=true');
    }

    if (options.resolution) {
      args.push(`-r${options.resolution}`);
    }

    if (options.colorConversionStrategy) {
      args.push(`-dColorConversionStrategy=/${options.colorConversionStrategy}`);
    }

    if (options.customArgs) {
      args.push(...options.customArgs);
    }

    return args;
  }
}