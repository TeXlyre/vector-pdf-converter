import React, { useState, useCallback } from "react";

import "./App.css";
import {
  PDFConverter,
  ValidationUtils,
  getOutputFileName
} from "vector-pdf-converter";
import type {
  ConversionResult,
  ConversionProgress,
  SupportedInputFormat,
  SVGBackend,
  SVGConversionOptions,
  PDFCompressionOptions,
  EPSConversionOptions,
  PDFSettings,
  ColorConversionStrategy
} from "vector-pdf-converter";


type AppState = 'init' | 'selected' | 'loading' | 'options' | 'toBeDownloaded' | 'error';

interface FileData {
  file: File;
  filename: string;
  url: string;
  type: SupportedInputFormat;
}

interface ConversionState {
  progress: ConversionProgress | null;
  result: ConversionResult | null;
  error: string | null;
  worker?: Worker;
}

function App() {
  const [state, setState] = useState<AppState>('init');
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [conversion, setConversion] = useState<ConversionState>({
    progress: null,
    result: null,
    error: null
  });

  // Options state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [pdfOptions, setPdfOptions] = useState<PDFCompressionOptions>({
    quality: 'ebook',
    colorConversionStrategy: 'sRGB',
    downscaleImages: true,
    imageResolution: 150,
    compressPages: true,
    optimizeForWeb: true,
    removeMetadata: false,
    compatibilityLevel: '1.4'
  });
  const [epsOptions, setEpsOptions] = useState<EPSConversionOptions>({
    cropToEPS: true,
    fitToPage: true,
    pageSize: 'a4',
    resolution: 300,
    colorConversionStrategy: 'sRGB'
  });
  const [svgOptions, setSvgOptions] = useState<SVGConversionOptions>({
    backend: 'resvg',
    scale: 1,
    backgroundColor: 'white',
    preserveAspectRatio: true
  });

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    try {
      const detectedFileType = ValidationUtils.getFileType(selectedFile);
      if (!detectedFileType) {
        throw new Error('Unsupported file type. Please select a PDF, EPS, or SVG file.');
      }

      ValidationUtils.validateFile(selectedFile);

      const url = URL.createObjectURL(selectedFile);
      setFileData({
        file: selectedFile,
        filename: selectedFile.name,
        url,
        type: detectedFileType
      });

      setState('selected');
      setConversion({ progress: null, result: null, error: null });
    } catch (error) {
      setConversion(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      setState('error');
    }
  }, []);

  const handleConvert = useCallback(async () => {
    if (!fileData) return;

    setState('loading');
    setConversion({ progress: null, result: null, error: null });

    const progressCallback = (progress: ConversionProgress) => {
      setConversion(prev => ({ ...prev, progress }));
    };

    const errorCallback = (error: Error) => {
      setConversion(prev => ({
        ...prev,
        error: error.message,
        progress: null
      }));
      setState('error');
    };

    try {
      let result: ConversionResult;

      switch (fileData.type) {
        case 'pdf':
          result = await PDFConverter.convertFile(fileData.file, {
            ...pdfOptions,
            onProgress: progressCallback,
            onError: errorCallback
          });
          break;

        case 'eps':
          result = await PDFConverter.convertFile(fileData.file, {
            ...epsOptions,
            onProgress: progressCallback,
            onError: errorCallback
          });
          break;

        case 'svg':
          result = await PDFConverter.convertSVG(fileData.file, {
            ...svgOptions,
            onProgress: progressCallback,
            onError: errorCallback
          });
          break;

        default:
          throw new Error(`Unsupported file type: ${fileData.type}`);
      }

      setConversion(prev => ({ ...prev, result, progress: null }));
      setState('toBeDownloaded');
    } catch (error) {
      errorCallback(error instanceof Error ? error : new Error('Unknown error'));
    }
  }, [fileData, pdfOptions, epsOptions, svgOptions]);

  const resetApp = useCallback(() => {
    if (fileData?.url) {
      URL.revokeObjectURL(fileData.url);
    }
    if (conversion.result?.url) {
      URL.revokeObjectURL(conversion.result.url);
    }

    setFileData(null);
    setConversion({ progress: null, result: null, error: null });
    setState('init');
    setShowAdvanced(false);
  }, [fileData?.url, conversion.result?.url]);

  const handleDownload = useCallback(() => {
    if (!conversion.result?.url || !fileData) return;

    const link = document.createElement('a');
    link.href = conversion.result.url;
    link.download = getOutputFileName(fileData.filename, fileData.type === 'pdf' ? 'compress' : 'convert');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [conversion.result?.url, fileData]);

  const getActionText = () => {
    switch (fileData?.type) {
      case 'eps': return '🚀 Convert EPS to PDF! 🚀';
      case 'svg': return '🚀 Convert SVG to PDF! 🚀';
      case 'pdf':
      default: return '🚀 Compress PDF! 🚀';
    }
  };

  const getChooseFileText = () => {
    if (!fileData) return 'Choose PDF, EPS, or SVG file';
    return `${fileData.filename} (${fileData.type.toUpperCase()})`;
  };

  const renderAdvancedOptions = () => {
    if (!showAdvanced || !fileData) return null;

    switch (fileData.type) {
      case 'pdf':
        return (
          <div className="advanced-options">
            <h3>PDF Compression Options</h3>

            <div className="option-group">
              <label>Quality Setting:</label>
              <select
                value={pdfOptions.quality}
                onChange={e => setPdfOptions(prev => ({ ...prev, quality: e.target.value as PDFSettings }))}
              >
                <option value="screen">Screen (72 DPI)</option>
                <option value="ebook">E-book (150 DPI)</option>
                <option value="printer">Printer (300 DPI)</option>
                <option value="prepress">Prepress (300 DPI)</option>
                <option value="default">Default</option>
              </select>
            </div>

            <div className="option-group">
              <label>Color Strategy:</label>
              <select
                value={pdfOptions.colorConversionStrategy}
                onChange={e => setPdfOptions(prev => ({
                  ...prev,
                  colorConversionStrategy: e.target.value as ColorConversionStrategy
                }))}
              >
                <option value="LeaveColorUnchanged">Leave Unchanged</option>
                <option value="sRGB">sRGB</option>
                <option value="CMYK">CMYK</option>
                <option value="Gray">Grayscale</option>
              </select>
            </div>

            <div className="option-group">
              <label>PDF Version:</label>
              <select
                value={pdfOptions.compatibilityLevel}
                onChange={e => setPdfOptions(prev => ({
                  ...prev,
                  compatibilityLevel: e.target.value as any
                }))}
              >
                <option value="1.3">PDF 1.3</option>
                <option value="1.4">PDF 1.4</option>
                <option value="1.5">PDF 1.5</option>
                <option value="1.6">PDF 1.6</option>
                <option value="1.7">PDF 1.7</option>
              </select>
            </div>

            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={pdfOptions.downscaleImages}
                  onChange={e => setPdfOptions(prev => ({ ...prev, downscaleImages: e.target.checked }))}
                />
                Downscale Images
              </label>

              {pdfOptions.downscaleImages && (
                <div className="sub-option">
                  <label>Image Resolution (DPI):</label>
                  <input
                    type="number"
                    value={pdfOptions.imageResolution}
                    onChange={e => setPdfOptions(prev => ({
                      ...prev,
                      imageResolution: parseInt(e.target.value, 10)
                    }))}
                    min="72" max="600" step="50"
                  />
                </div>
              )}
            </div>

            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={pdfOptions.compressPages}
                  onChange={e => setPdfOptions(prev => ({ ...prev, compressPages: e.target.checked }))}
                />
                Compress Pages
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={pdfOptions.optimizeForWeb}
                  onChange={e => setPdfOptions(prev => ({ ...prev, optimizeForWeb: e.target.checked }))}
                />
                Optimize for Web
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={pdfOptions.removeMetadata}
                  onChange={e => setPdfOptions(prev => ({ ...prev, removeMetadata: e.target.checked }))}
                />
                Remove Metadata
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={pdfOptions.flattenTransparency}
                  onChange={e => setPdfOptions(prev => ({ ...prev, flattenTransparency: e.target.checked }))}
                />
                Flatten Transparency
              </label>
            </div>
          </div>
        );

      case 'eps':
        return (
          <div className="advanced-options">
            <h3>EPS Conversion Options</h3>

            <div className="option-group">
              <label>Page Size:</label>
              <select
                value={epsOptions.pageSize}
                onChange={e => setEpsOptions(prev => ({
                  ...prev,
                  pageSize: e.target.value as any
                }))}
              >
                <option value="a4">A4</option>
                <option value="letter">Letter</option>
                <option value="legal">Legal</option>
                <option value="a3">A3</option>
                <option value="a5">A5</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {epsOptions.pageSize === 'custom' && (
              <div className="custom-size">
                <div className="option-group">
                  <label>Width (points):</label>
                  <input
                    type="number"
                    value={epsOptions.customWidth || 595}
                    onChange={e => setEpsOptions(prev => ({
                      ...prev,
                      customWidth: parseInt(e.target.value, 10)
                    }))}
                  />
                </div>
                <div className="option-group">
                  <label>Height (points):</label>
                  <input
                    type="number"
                    value={epsOptions.customHeight || 842}
                    onChange={e => setEpsOptions(prev => ({
                      ...prev,
                      customHeight: parseInt(e.target.value, 10)
                    }))}
                  />
                </div>
              </div>
            )}

            <div className="option-group">
              <label>Resolution (DPI):</label>
              <input
                type="number"
                value={epsOptions.resolution}
                onChange={e => setEpsOptions(prev => ({
                  ...prev,
                  resolution: parseInt(e.target.value, 10)
                }))}
                min="72" max="1200" step="50"
              />
            </div>

            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={epsOptions.cropToEPS}
                  onChange={e => setEpsOptions(prev => ({ ...prev, cropToEPS: e.target.checked }))}
                />
                Crop to EPS BoundingBox
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={epsOptions.fitToPage}
                  onChange={e => setEpsOptions(prev => ({ ...prev, fitToPage: e.target.checked }))}
                />
                Fit EPS to Page
              </label>
            </div>
          </div>
        );

      case 'svg':
        return (
          <div className="advanced-options">
            <h3>SVG Conversion Options</h3>

            <div className="option-group">
              <label>Conversion Backend:</label>
              <select
                value={svgOptions.backend}
                onChange={e => setSvgOptions(prev => ({
                  ...prev,
                  backend: e.target.value as SVGBackend
                }))}
              >
                <option value="resvg">RESVG (Best Quality)</option>
                <option value="jspdf">jsPDF (Lightweight)</option>
                <option value="svg2pdf">svg2pdf (Vector Preserving)</option>
              </select>
            </div>

            <div className="option-group">
              <label>Scale Factor:</label>
              <input
                type="number"
                value={svgOptions.scale}
                onChange={e => setSvgOptions(prev => ({
                  ...prev,
                  scale: parseFloat(e.target.value)
                }))}
                min="0.1" max="5" step="0.1"
              />
            </div>

            <div className="option-group">
              <label>Background Color:</label>
              <input
                type="color"
                value={svgOptions.backgroundColor === 'white' ? '#ffffff' : svgOptions.backgroundColor || '#ffffff'}
                onChange={e => setSvgOptions(prev => ({
                  ...prev,
                  backgroundColor: e.target.value
                }))}
              />
            </div>

            <div className="size-options">
              <div className="option-group">
                <label>Custom Width (px):</label>
                <input
                  type="number"
                  value={svgOptions.width || ''}
                  onChange={e => setSvgOptions(prev => ({
                    ...prev,
                    width: e.target.value ? parseInt(e.target.value, 10) : undefined
                  }))}
                  placeholder="Auto"
                />
              </div>
              <div className="option-group">
                <label>Custom Height (px):</label>
                <input
                  type="number"
                  value={svgOptions.height || ''}
                  onChange={e => setSvgOptions(prev => ({
                    ...prev,
                    height: e.target.value ? parseInt(e.target.value, 10) : undefined
                  }))}
                  placeholder="Auto"
                />
              </div>
            </div>

            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={svgOptions.preserveAspectRatio !== false}
                  onChange={e => setSvgOptions(prev => ({
                    ...prev,
                    preserveAspectRatio: e.target.checked
                  }))}
                />
                Preserve Aspect Ratio
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const outputFileName = fileData && getOutputFileName(
    fileData.filename,
    fileData.type === 'pdf' ? 'compress' : 'convert'
  );

  return (
    <>
      <h1>In-Browser PDF Converter & Compressor</h1>

      <p>
        Convert EPS and SVG files to PDF or compress existing PDFs using{" "}
        <a target="_blank" href="https://ghostscript.com/">Ghostscript</a>{" "}
        and advanced TypeScript APIs running in{" "}
        <a target="_blank" href="https://webassembly.org/">WebAssembly</a>.
      </p>

      <p>
        <i>Secure and private by design: your files never leave your computer.</i>
      </p>

      {state === 'init' && (
        <form>
          <input
            type="file"
            accept={ValidationUtils.getAcceptedMimeTypes()}
            onChange={handleFileChange}
            id="file"
          />
          <div className="label padded-button">
            <label htmlFor="file">
              {getChooseFileText()}
            </label>
          </div>
        </form>
      )}

      {state === 'selected' && (
        <div className="conversion-setup">
          <div className="file-info">
            <p><strong>Selected:</strong> {fileData?.filename} ({fileData?.type.toUpperCase()})</p>
          </div>

          <div className="options-toggle">
            <button
              type="button"
              className="blue padded-button"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? '🔧 Hide Advanced Options' : '⚙️ Show Advanced Options'}
            </button>
          </div>

          {renderAdvancedOptions()}

          <div className="action-buttons">
            <button
              type="button"
              className="success-button padded-button"
              onClick={handleConvert}
            >
              {getActionText()}
            </button>

            <button
              type="button"
              className="secondary-button padded-button"
              onClick={resetApp}
            >
              🔄 Choose Different File
            </button>
          </div>
        </div>
      )}

      {state === 'loading' && (
        <div className="loading-state">
          <p><strong>Processing...</strong></p>

          {conversion.progress && (
            <div className="progress-info">
              <p>Stage: {conversion.progress.stage}</p>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${conversion.progress.progress}%` }}
                />
              </div>
              <p>{conversion.progress.progress}%</p>
              {conversion.progress.message && <p><small>{conversion.progress.message}</small></p>}
            </div>
          )}

          {fileData?.type === 'svg' && (
            <p><small>Converting SVG using {svgOptions.backend} backend...</small></p>
          )}
        </div>
      )}

      {state === 'toBeDownloaded' && conversion.result && (
        <div className="download-state">
          <div className="success-info">
            <p><strong>Conversion Complete!</strong></p>

            {conversion.result.metadata && (
              <div className="metadata">
                <p><small>
                  Backend: {conversion.result.metadata['backend'] || fileData?.type} |
                  Size: {conversion.result.size ? `${Math.round(conversion.result.size / 1024)} KB` : 'N/A'}
                  {conversion.result.metadata['dimensions'] &&
                    ` | Dimensions: ${conversion.result.metadata['dimensions'].width}×${conversion.result.metadata['dimensions'].height}mm`
                  }
                </small></p>
              </div>
            )}
          </div>

          <div className="download-actions">
            <button
              type="button"
              className="success-button padded-button"
              onClick={handleDownload}
            >
              📄 Download {outputFileName} 📄
            </button>

            <button
              type="button"
              className="blue padded-button"
              onClick={resetApp}
            >
              🔁 Process Another File 🔁
            </button>
          </div>
        </div>
      )}

      {state === 'error' && conversion.error && (
        <div className="error-state">
          <div className="error-message">
            <p><strong>❌ Error:</strong> {conversion.error}</p>
          </div>

          <button
            type="button"
            className="blue padded-button"
            onClick={resetApp}
          >
            🔄 Try Again
          </button>
        </div>
      )}

      <div className="features-info">
        <p><b>Supported formats & features:</b></p>

        <div className="features-grid">
          <div className="feature-card">
            <h4>📄 PDF Compression</h4>
            <ul>
              <li>Quality presets (Screen to Prepress)</li>
              <li>Image downscaling & compression</li>
              <li>Metadata removal</li>
              <li>Web optimization</li>
              <li>Color space conversion</li>
            </ul>
          </div>

          <div className="feature-card">
            <h4>📐 EPS Conversion</h4>
            <ul>
              <li>Automatic cropping to BoundingBox</li>
              <li>Custom page sizes</li>
              <li>Resolution control</li>
              <li>Fit-to-page options</li>
            </ul>
          </div>

          <div className="feature-card">
            <h4>🎨 SVG Conversion</h4>
            <ul>
              <li>3 conversion backends</li>
              <li>Custom dimensions & scaling</li>
              <li>Background color control</li>
              <li>Vector preservation (svg2pdf)</li>
              <li>High-quality rasterization (RESVG)</li>
            </ul>
          </div>
        </div>
      </div>

      <p>
        <small>
          <b>Note:</b> The Ghostscript WASM binary is approximately <b>10MB</b>.
          Processing happens entirely in your browser for maximum privacy.
        </small>
      </p>

      <footer>
        <p><i>This website uses no tracking, no cookies, no adtech.</i></p>
      </footer>
    </>
  );
}

export default App;