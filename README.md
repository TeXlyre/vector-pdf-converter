# PDF Converter TypeScript Library

A comprehensive TypeScript library for converting EPS and SVG files to PDF, and compressing existing PDFs using [Ghostscript](https://ghostscript.com/) WebAssembly and SVG conversion engines.

## Features

- **PDF Compression**: Compress existing PDFs with customizable quality settings, color conversion, and optimization
- **EPS to PDF Conversion**: Convert EPS files with page sizing, cropping, and resolution control
- **SVG to PDF Conversion**: Convert SVG files using multiple backends with quality comparison
- **Multiple SVG Engines**: RESVG (best quality), jsPDF (lightweight), svg2pdf.js (vector preserving)
- **Advanced Options**: Color space conversion, image downscaling, metadata removal, web optimization
- **Client-Side Processing**: All conversions happen in the browser - files never leave your computer
- **Progress Tracking**: Real-time progress updates during conversion
- **TypeScript Support**: Full type definitions and modern async/await API

## Installation

```bash
npm install vector-pdf-converter
```

## Quick Start

```javascript
import { PDFConverter } from 'vector-pdf-converter';

// Compress a PDF file
const result = await PDFConverter.convertFile(pdfFile, {
  quality: 'ebook',
  downscaleImages: true,
  optimizeForWeb: true
});

// Convert an SVG file
const svgResult = await PDFConverter.convertSVG(svgFile, {
  backend: 'resvg',
  scale: 1,
  backgroundColor: 'white'
});

// Download the result
const link = document.createElement('a');
link.href = result.url;
link.download = 'converted.pdf';
link.click();
```

## Usage

### PDF Compression

```javascript
import { PDFConverter } from 'vector-pdf-converter';

const result = await PDFConverter.convertFile(pdfFile, {
  quality: 'ebook',                    // 'screen' | 'ebook' | 'printer' | 'prepress'
  colorConversionStrategy: 'sRGB',     // 'LeaveColorUnchanged' | 'sRGB' | 'CMYK' | 'Gray'
  downscaleImages: true,
  imageResolution: 150,
  compressPages: true,
  optimizeForWeb: true,
  removeMetadata: false,
  compatibilityLevel: '1.4',
  flattenTransparency: false,
  onProgress: (progress) => {
    console.log(`${progress.stage}: ${progress.progress}%`);
  }
});
```

### EPS Conversion

```javascript
import { PDFConverter } from 'vector-pdf-converter';

const result = await PDFConverter.convertFile(epsFile, {
  cropToEPS: true,
  fitToPage: true,
  pageSize: 'a4',                     // 'a4' | 'letter' | 'legal' | 'a3' | 'a5' | 'custom'
  customWidth: 595,                   // When pageSize is 'custom'
  customHeight: 842,                  // When pageSize is 'custom'
  resolution: 300,
  colorConversionStrategy: 'sRGB',
  onProgress: (progress) => {
    console.log(`Converting: ${progress.progress}%`);
  }
});
```

### SVG Conversion

```javascript
import { PDFConverter } from 'vector-pdf-converter';

// Single engine conversion
const result = await PDFConverter.convertSVG(svgFile, {
  backend: 'resvg',                   // 'resvg' | 'jspdf' | 'svg2pdf'
  scale: 1,
  backgroundColor: 'white',
  width: 800,                         // Optional custom dimensions
  height: 600,
  preserveAspectRatio: true
});

// Compare all engines
const allResults = await PDFConverter.convertSVG(svgFile, {
  backend: 'all',                     // Returns results from all engines
  scale: 1,
  backgroundColor: 'white'
});

// Access individual engine results
allResults.forEach(result => {
  if (result.success) {
    console.log(`${result.engine}: ${result.result.size} bytes`);
  }
});
```

### Configuration Options

#### PDF Compression Options

```javascript
interface PDFCompressionOptions {
  quality?: 'screen' | 'ebook' | 'printer' | 'prepress' | 'default';
  colorConversionStrategy?: 'LeaveColorUnchanged' | 'sRGB' | 'CMYK' | 'Gray';
  downscaleImages?: boolean;
  imageResolution?: number;           // DPI when downscaling images
  compressPages?: boolean;
  optimizeForWeb?: boolean;
  removeMetadata?: boolean;
  compatibilityLevel?: string;        // PDF version (e.g., '1.4')
  flattenTransparency?: boolean;
  onProgress?: (progress: ConversionProgress) => void;
  onError?: (error: Error) => void;
}
```

#### EPS Conversion Options

```javascript
interface EPSConversionOptions {
  cropToEPS?: boolean;
  fitToPage?: boolean;
  pageSize?: 'a4' | 'letter' | 'legal' | 'a3' | 'a5' | 'custom';
  customWidth?: number;               // Points (when pageSize is 'custom')
  customHeight?: number;              // Points (when pageSize is 'custom')
  resolution?: number;                // DPI
  colorConversionStrategy?: ColorConversionStrategy;
  onProgress?: (progress: ConversionProgress) => void;
  onError?: (error: Error) => void;
}
```

#### SVG Conversion Options

```javascript
interface SVGConversionOptions {
  backend?: 'resvg' | 'jspdf' | 'svg2pdf' | 'all';
  scale?: number;
  backgroundColor?: string;
  width?: number;                     // Pixels
  height?: number;                    // Pixels
  preserveAspectRatio?: boolean;
  onProgress?: (progress: ConversionProgress) => void;
  onError?: (error: Error) => void;
}
```

## API

### PDFConverter

The main class providing static methods for file conversion.

#### `PDFConverter.convertFile(file, options)`

Converts PDF or EPS files. Automatically detects file type and applies appropriate conversion.

**Parameters:**
- `file: File` - The input file (PDF or EPS)
- `options: PDFCompressionOptions | EPSConversionOptions` - Conversion options

**Returns:** `Promise<ConversionResult>`

#### `PDFConverter.convertSVG(file, options)`

Converts SVG files to PDF using specified backend(s).

**Parameters:**
- `file: File` - The input SVG file
- `options: SVGConversionOptions` - SVG-specific conversion options

**Returns:** `Promise<ConversionResult | ConversionResult[]>` - Single result or array when using 'all' backend

### ValidationUtils

Utility functions for file validation and type detection.

```javascript
import { ValidationUtils } from 'vector-pdf-converter';

// Detect file type from File object
const fileType = ValidationUtils.getFileType(file);

// Validate file before conversion
ValidationUtils.validateFile(file);

// Get accepted MIME types for file input
const mimeTypes = ValidationUtils.getAcceptedMimeTypes();
```

### Utility Functions

```javascript
import { getOutputFileName } from 'vector-pdf-converter';

// Generate output filename
const outputName = getOutputFileName('input.eps', 'convert'); // 'input_converted.pdf'
const compressedName = getOutputFileName('document.pdf', 'compress'); // 'document_compressed.pdf'
```

## SVG Conversion Backends

This library integrates multiple SVG conversion engines:

- **[RESVG](https://github.com/RazrFalcon/resvg)** - Rust-based SVG renderer providing the highest quality output
- **[jsPDF](https://github.com/parallax/jsPDF)** - Lightweight JavaScript PDF generation
- **[svg2pdf.js](https://github.com/yWorks/svg2pdf.js)** - Vector-preserving SVG to PDF conversion

## Advanced Usage

### Custom Progress Handling

```javascript
const result = await PDFConverter.convertFile(file, {
  quality: 'ebook',
  onProgress: (progress) => {
    updateProgressBar(progress.progress);
    showStatus(progress.stage);
    if (progress.message) {
      showDetailedStatus(progress.message);
    }
  }
});
```

### Error Handling

```javascript
try {
  const result = await PDFConverter.convertSVG(svgFile, {
    backend: 'resvg',
    onError: (error) => {
      console.error('Conversion failed:', error.message);
    }
  });
} catch (error) {
  console.error('Failed to start conversion:', error);
}
```

### Multiple Engine Comparison

```javascript
// Convert with all SVG engines for quality comparison
const results = await PDFConverter.convertSVG(svgFile, {
  backend: 'all',
  scale: 1,
  backgroundColor: 'white'
});

// Find the best result by size or quality metrics
const successfulResults = results.filter(r => r.success);
const smallestFile = successfulResults.reduce((min, current) => 
  current.result.size < min.result.size ? current : min
);

console.log(`Best engine: ${smallestFile.engine}`);
```

## Examples

### Interactive Web Demo

```bash
# Run the GitHub Pages example locally
npm run setup-pages-example
npm run pages-example
```

### React Integration

```bash
# Run the React example
npm run setup-react-example  
npm run react-example
```

## Building from Source

```bash
git clone https://github.com/texlyre/vector-pdf-converter.git
cd pdf-converter
npm install
npm run build
```

## Acknowledgments

This library is built upon several excellent open-source projects:

- **Ghostscript WebAssembly**: Based on the work by [@ochachacha](https://github.com/ochachacha) and the [ghostscript-pdf-compress.wasm](https://github.com/laurentmmeyer/ghostscript-pdf-compress.wasm) project by Laurent Meyer
- **[RESVG](https://github.com/RazrFalcon/resvg)**: Rust-based SVG rendering engine via [@resvg/resvg-wasm](https://github.com/yisibl/resvg-js)
- **[jsPDF](https://github.com/parallax/jsPDF)**: JavaScript PDF generation library  
- **[svg2pdf.js](https://github.com/yWorks/svg2pdf.js)**: SVG to PDF conversion maintaining vector graphics

## License

This project is licensed under the AGPL-3.0 License - see the [LICENSE](LICENSE) file for details.

The AGPL-3.0 license is required due to the Ghostscript WebAssembly component, which is also licensed under AGPL-3.0.

## Demo

Try the live demo at: [https://texlyre.github.io/pdf-converter/](https://texlyre.github.io/pdf-converter/)