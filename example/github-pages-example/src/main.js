import { PDFConverter, ValidationUtils, getOutputFileName } from 'vector-pdf-converter';
import './styles.css';

let currentFiles = [];
let conversionResults = [];
let currentActiveResult = null;
let batchMode = false;

const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileList = document.getElementById('fileList');
const batchModeCheck = document.getElementById('batchMode');
const options = document.getElementById('options');
const progress = document.getElementById('progress');
const batchProgress = document.getElementById('batchProgress');
const result = document.getElementById('result');
const convertBtn = document.getElementById('convertBtn');
const downloadBtn = document.getElementById('downloadBtn');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const previewBtn = document.getElementById('previewBtn');
const reconvertBtn = document.getElementById('reconvertBtn');
const resetBtn = document.getElementById('resetBtn');
const toggleAdvanced = document.getElementById('toggleAdvanced');
const advancedOptions = document.getElementById('advancedOptions');

const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const resultInfo = document.getElementById('resultInfo');
const multipleResults = document.getElementById('multipleResults');
const engineResults = document.getElementById('engineResults');
const batchResults = document.getElementById('batchResults');
const batchFileResults = document.getElementById('batchFileResults');

const previewModal = document.getElementById('previewModal');
const pdfPreview = document.getElementById('pdfPreview');
const closePreview = document.getElementById('closePreview');

const qualitySelect = document.getElementById('quality');
const downscaleImagesCheck = document.getElementById('downscaleImages');
const optimizeForWebCheck = document.getElementById('optimizeForWeb');
const imageResolutionGroup = document.getElementById('imageResolutionGroup');
const imageResolutionInput = document.getElementById('imageResolution');

const pdfOptionsDiv = document.getElementById('pdfOptions');
const epsOptionsDiv = document.getElementById('epsOptions');
const svgOptionsDiv = document.getElementById('svgOptions');

const colorStrategySelect = document.getElementById('colorStrategy');
const compatibilityLevelSelect = document.getElementById('compatibilityLevel');
const compressPagesCheck = document.getElementById('compressPages');
const removeMetadataCheck = document.getElementById('removeMetadata');
const flattenTransparencyCheck = document.getElementById('flattenTransparency');

const pageSizeSelect = document.getElementById('pageSize');
const customSizeDiv = document.getElementById('customSize');
const customWidthInput = document.getElementById('customWidth');
const customHeightInput = document.getElementById('customHeight');
const epsResolutionInput = document.getElementById('epsResolution');
const cropToEPSCheck = document.getElementById('cropToEPS');
const fitToPageCheck = document.getElementById('fitToPage');

const svgBackendSelect = document.getElementById('svgBackend');
const svgScaleInput = document.getElementById('svgScale');
const backgroundColorInput = document.getElementById('backgroundColor');
const svgWidthInput = document.getElementById('svgWidth');
const svgHeightInput = document.getElementById('svgHeight');
const preserveAspectRatioCheck = document.getElementById('preserveAspectRatio');

function initializeEventListeners() {
  fileInput.addEventListener('change', handleFileSelect);
  batchModeCheck.addEventListener('change', handleBatchModeToggle);
  convertBtn.addEventListener('click', handleConvert);
  downloadBtn.addEventListener('click', handleDownload);
  downloadAllBtn.addEventListener('click', handleDownloadAll);
  previewBtn.addEventListener('click', handlePreview);
  reconvertBtn.addEventListener('click', handleReconvert);
  resetBtn.addEventListener('click', handleReset);
  toggleAdvanced.addEventListener('click', handleToggleAdvanced);
  closePreview.addEventListener('click', handleClosePreview);

  downscaleImagesCheck.addEventListener('change', updateImageResolutionVisibility);
  pageSizeSelect.addEventListener('change', updateCustomSizeVisibility);

  previewModal.addEventListener('click', (e) => {
    if (e.target === previewModal) {
      handleClosePreview();
    }
  });
}

function handleBatchModeToggle() {
  batchMode = batchModeCheck.checked;
  updateFileInputDisplay();
}

function updateFileInputDisplay() {
  const fileLabel = document.querySelector('.file-label');
  if (batchMode) {
    fileLabel.textContent = 'Choose Files (PDF, EPS, or SVG)';
  } else {
    fileLabel.textContent = 'Choose File (PDF, EPS, or SVG)';
  }
}

function handleFileSelect(event) {
  const files = Array.from(event.target.files);
  if (!files.length) {
    resetUI();
    return;
  }

  const validFiles = [];
  const errors = [];

  for (const file of files) {
    try {
      const fileType = ValidationUtils.getFileType(file);
      if (!fileType) {
        errors.push(`${file.name}: Unsupported file type`);
        continue;
      }
      ValidationUtils.validateFile(file);
      validFiles.push({ file, type: fileType });
    } catch (error) {
      errors.push(`${file.name}: ${error.message}`);
    }
  }

  if (errors.length > 0) {
    alert(`Some files had errors:\n${errors.join('\n')}`);
  }

  if (validFiles.length === 0) {
    resetUI();
    return;
  }

  if (!batchMode && validFiles.length > 1) {
    alert('Multiple files selected but batch mode is disabled. Only the first file will be used.');
    currentFiles = [validFiles[0]];
  } else {
    currentFiles = validFiles;
  }

  displaySelectedFiles();
  showFileTypeOptions();
  options.style.display = 'block';
  progress.style.display = 'none';
  result.style.display = 'none';

  cleanupPreviousResults();
}

function displaySelectedFiles() {
  if (currentFiles.length === 1 && !batchMode) {
    const { file, type } = currentFiles[0];
    fileInfo.innerHTML = `
      <strong>Selected:</strong> ${file.name} (${type.toUpperCase()})
      <br><strong>Size:</strong> ${formatFileSize(file.size)}
    `;
    fileInfo.style.display = 'block';
    fileList.style.display = 'none';
  } else {
    fileInfo.style.display = 'none';
    fileList.style.display = 'block';

    const totalSize = currentFiles.reduce((sum, f) => sum + f.file.size, 0);
    const typeCount = currentFiles.reduce((acc, f) => {
      acc[f.type] = (acc[f.type] || 0) + 1;
      return acc;
    }, {});

    const typeStr = Object.entries(typeCount)
      .map(([type, count]) => `${count} ${type.toUpperCase()}`)
      .join(', ');

    fileList.innerHTML = `
      <div class="file-item">
        <div class="file-details">
          <div class="file-name"><strong>${currentFiles.length} files selected</strong></div>
          <div class="file-meta">Types: ${typeStr} | Total size: ${formatFileSize(totalSize)}</div>
        </div>
      </div>
      ${currentFiles.map((fileObj, index) => `
        <div class="file-item">
          <div class="file-details">
            <div class="file-name">${fileObj.file.name}</div>
            <div class="file-meta">${fileObj.type.toUpperCase()} | ${formatFileSize(fileObj.file.size)}</div>
          </div>
          <button class="remove-file" onclick="removeFile(${index})">✖️</button>
        </div>
      `).join('')}
    `;
  }
}

function showFileTypeOptions() {
  const types = [...new Set(currentFiles.map(f => f.type))];

  pdfOptionsDiv.style.display = types.includes('pdf') ? 'block' : 'none';
  epsOptionsDiv.style.display = types.includes('eps') ? 'block' : 'none';
  svgOptionsDiv.style.display = types.includes('svg') ? 'block' : 'none';

  updateImageResolutionVisibility();
  updateCustomSizeVisibility();
}

function handleToggleAdvanced() {
  const isVisible = advancedOptions.style.display !== 'none';
  advancedOptions.style.display = isVisible ? 'none' : 'block';
  toggleAdvanced.textContent = isVisible ? '⚙️ Show Advanced Options' : 'Hide Advanced Options';
}

function updateImageResolutionVisibility() {
  if (imageResolutionGroup && downscaleImagesCheck) {
    imageResolutionGroup.style.display = downscaleImagesCheck.checked ? 'block' : 'none';
  }
}

function updateCustomSizeVisibility() {
  if (customSizeDiv && pageSizeSelect) {
    customSizeDiv.style.display = pageSizeSelect.value === 'custom' ? 'grid' : 'none';
  }
}

async function handleConvert() {
  if (!currentFiles.length) return;

  progress.style.display = 'block';
  options.style.display = 'none';
  result.style.display = 'none';

  progressFill.style.width = '0%';
  progressText.textContent = 'Initializing...';

  cleanupPreviousResults();

  try {
    if (batchMode && currentFiles.length > 1) {
      await convertBatch();
    } else {
      await convertSingle(currentFiles[0]);
    }

    progress.style.display = 'none';
    result.style.display = 'block';

    displayResults();

  } catch (error) {
    handleError(error);
  }
}

async function convertSingle(fileObj) {
  if (fileObj.type === 'pdf') {
    await convertPDF(fileObj);
  } else if (fileObj.type === 'svg') {
    if (svgBackendSelect.value === 'all') {
      await convertSVGWithAllEngines(fileObj);
    } else {
      await convertSVGSingleEngine(fileObj);
    }
  } else if (fileObj.type === 'eps') {
    await convertEPS(fileObj);
  }
}

async function convertBatch() {
  batchProgress.style.display = 'block';
  conversionResults = [];

  for (let i = 0; i < currentFiles.length; i++) {
    const fileObj = currentFiles[i];
    const progress = ((i + 1) / currentFiles.length) * 100;

    progressText.textContent = `Processing ${fileObj.file.name} (${i + 1}/${currentFiles.length})...`;
    progressFill.style.width = `${progress}%`;

    const progressItem = document.createElement('div');
    progressItem.className = 'batch-progress-item processing';
    progressItem.innerHTML = `
      <span>${fileObj.file.name}</span>
      <span>Processing...</span>
    `;
    batchProgress.appendChild(progressItem);

    try {
      const fileResults = [];

      if (fileObj.type === 'pdf') {
        const result = await convertPDFFile(fileObj.file);
        fileResults.push({
          engine: 'ghostscript',
          result,
          success: true,
          options: getConversionOptions(fileObj.type)
        });
      } else if (fileObj.type === 'svg') {
        if (svgBackendSelect.value === 'all') {
          const engines = ['resvg', 'jspdf', 'svg2pdf'];
          for (const engine of engines) {
            try {
              const result = await convertSVGFile(fileObj.file, engine);
              fileResults.push({
                engine,
                result,
                success: true,
                options: getConversionOptions(fileObj.type, engine)
              });
            } catch (error) {
              fileResults.push({
                engine,
                error: error.message || error.toString(),
                success: false,
                options: getConversionOptions(fileObj.type, engine)
              });
            }
          }
        } else {
          const result = await convertSVGFile(fileObj.file, svgBackendSelect.value);
          fileResults.push({
            engine: svgBackendSelect.value,
            result,
            success: true,
            options: getConversionOptions(fileObj.type, svgBackendSelect.value)
          });
        }
      } else if (fileObj.type === 'eps') {
        const result = await convertEPSFile(fileObj.file);
        fileResults.push({
          engine: 'ghostscript',
          result,
          success: true,
          options: getConversionOptions(fileObj.type)
        });
      }

      conversionResults.push({
        file: fileObj,
        results: fileResults,
        success: fileResults.some(r => r.success)
      });

      progressItem.className = 'batch-progress-item success';
      progressItem.innerHTML = `
        <span>${fileObj.file.name}</span>
        <span>✅ Complete</span>
      `;

    } catch (error) {
      conversionResults.push({
        file: fileObj,
        results: [],
        success: false,
        error: error.message || error.toString()
      });

      progressItem.className = 'batch-progress-item error';
      progressItem.innerHTML = `
        <span>${fileObj.file.name}</span>
        <span>❌ Failed</span>
      `;
    }
  }

  const successfulResults = conversionResults.filter(r => r.success);
  if (successfulResults.length > 0) {
    const firstSuccess = successfulResults[0].results.find(r => r.success);
    currentActiveResult = firstSuccess;
  }
}

function getConversionOptions(fileType, engine = null) {
  const baseOptions = {
    quality: qualitySelect.value,
    downscaleImages: downscaleImagesCheck.checked,
    optimizeForWeb: optimizeForWebCheck.checked
  };

  if (fileType === 'pdf') {
    return {
      ...baseOptions,
      colorConversionStrategy: colorStrategySelect.value,
      imageResolution: parseInt(imageResolutionInput.value, 10),
      compressPages: compressPagesCheck.checked,
      removeMetadata: removeMetadataCheck.checked,
      compatibilityLevel: compatibilityLevelSelect.value,
      flattenTransparency: flattenTransparencyCheck.checked
    };
  } else if (fileType === 'eps') {
    return {
      ...baseOptions,
      cropToEPS: cropToEPSCheck.checked,
      fitToPage: fitToPageCheck.checked,
      pageSize: pageSizeSelect.value,
      customWidth: pageSizeSelect.value === 'custom' ? parseInt(customWidthInput.value, 10) : undefined,
      customHeight: pageSizeSelect.value === 'custom' ? parseInt(customHeightInput.value, 10) : undefined,
      resolution: parseInt(epsResolutionInput.value, 10),
      colorConversionStrategy: colorStrategySelect.value
    };
  } else if (fileType === 'svg') {
    return {
      ...baseOptions,
      backend: engine || svgBackendSelect.value,
      scale: parseFloat(svgScaleInput.value),
      backgroundColor: backgroundColorInput.value,
      width: svgWidthInput.value ? parseInt(svgWidthInput.value, 10) : undefined,
      height: svgHeightInput.value ? parseInt(svgHeightInput.value, 10) : undefined,
      preserveAspectRatio: preserveAspectRatioCheck.checked
    };
  }

  return baseOptions;
}

async function convertPDF(fileObj) {
  const conversionOptions = {
    ...getConversionOptions('pdf'),
    onProgress: handleProgress,
    onError: handleError
  };

  const result = await PDFConverter.convertFile(fileObj.file, conversionOptions);
  conversionResults = [{
    engine: 'ghostscript',
    result,
    success: true,
    options: { ...conversionOptions }
  }];
  currentActiveResult = conversionResults[0];
}

async function convertPDFFile(file) {
  const conversionOptions = getConversionOptions('pdf');
  return await PDFConverter.convertFile(file, conversionOptions);
}

async function convertEPS(fileObj) {
  const conversionOptions = {
    ...getConversionOptions('eps'),
    onProgress: handleProgress,
    onError: handleError
  };

  const result = await PDFConverter.convertFile(fileObj.file, conversionOptions);
  conversionResults = [{
    engine: 'ghostscript',
    result,
    success: true,
    options: { ...conversionOptions }
  }];
  currentActiveResult = conversionResults[0];
}

async function convertEPSFile(file) {
  const conversionOptions = getConversionOptions('eps');
  return await PDFConverter.convertFile(file, conversionOptions);
}

async function convertSVGSingleEngine(fileObj) {
  const conversionOptions = {
    ...getConversionOptions('svg'),
    onProgress: handleProgress,
    onError: handleError
  };

  const result = await PDFConverter.convertSVG(fileObj.file, conversionOptions);
  conversionResults = [{
    engine: conversionOptions.backend,
    result,
    success: true,
    options: { ...conversionOptions }
  }];
  currentActiveResult = conversionResults[0];
}

async function convertSVGFile(file, engine) {
  const conversionOptions = getConversionOptions('svg', engine);
  return await PDFConverter.convertSVG(file, conversionOptions);
}

async function convertSVGWithAllEngines(fileObj) {
  const engines = ['resvg', 'jspdf', 'svg2pdf'];
  conversionResults = [];

  const baseOptions = getConversionOptions('svg');

  for (let i = 0; i < engines.length; i++) {
    const engine = engines[i];
    const progress = ((i + 1) / engines.length) * 100;

    progressText.textContent = `Converting with ${engine.toUpperCase()} (${i + 1}/${engines.length})...`;
    progressFill.style.width = `${progress}%`;

    try {
      const conversionOptions = {
        ...baseOptions,
        backend: engine,
        onProgress: (progressData) => {
          const engineProgress = (i / engines.length) * 100 + (progressData.progress / engines.length);
          progressFill.style.width = `${engineProgress}%`;
          progressText.textContent = `${engine.toUpperCase()}: ${progressData.stage}`;
        },
        onError: (error) => {
          console.warn(`${engine} conversion failed:`, error);
        }
      };

      const result = await PDFConverter.convertSVG(fileObj.file, conversionOptions);
      conversionResults.push({
        engine,
        result,
        success: true,
        options: { ...conversionOptions }
      });
    } catch (error) {
      conversionResults.push({
        engine,
        error: error.message || error.toString(),
        success: false,
        options: { ...baseOptions, backend: engine }
      });
    }
  }

  const successfulResults = conversionResults.filter(r => r.success);
  currentActiveResult = successfulResults.length > 0 ? successfulResults[0] : null;
}

function displayResults() {
  if (batchMode && currentFiles.length > 1) {
    displayBatchResults();
  } else {
    displaySingleResults();
  }
}

function displaySingleResults() {
  multipleResults.style.display = 'none';
  batchResults.style.display = 'none';

  const fileObj = currentFiles[0];
  const outputFileName = getOutputFileName(
    fileObj.file.name,
    fileObj.type === 'pdf' ? 'compress' : 'convert'
  );

  if (conversionResults.length > 1) {
    multipleResults.style.display = 'block';

    const successCount = conversionResults.filter(r => r.success).length;
    resultInfo.innerHTML = `
      <strong>Multi-Engine Conversion Complete!</strong>
      <br><strong>Primary Result:</strong> ${outputFileName}
      <br><strong>Engines:</strong> ${successCount} of ${conversionResults.length} successful
      ${currentActiveResult ? `<br><strong>Primary Size:</strong> ${formatFileSize(currentActiveResult.result.size)}` : ''}
    `;

    engineResults.innerHTML = conversionResults.map((result, index) => {
      if (result.success) {
        const isPrimary = result === currentActiveResult;
        return `
          <div class="engine-result success ${isPrimary ? 'primary' : ''}">
            <h5>${result.engine.toUpperCase()}${isPrimary ? ' (Primary)' : ''}</h5>
            <p><strong>Size:</strong> ${formatFileSize(result.result.size)}</p>
            ${result.result.metadata ? `<p><strong>Quality:</strong> ${getQualityInfo(result.result.metadata)}</p>` : ''}
            <div class="engine-actions">
              <button onclick="previewEngineResult(${index})" class="preview-btn small">👁️ Preview</button>
              <button onclick="downloadEngineResult(${index})" class="download-btn small">📥 Download</button>
              ${!isPrimary ? `<button onclick="setPrimaryResult(${index})" class="primary-btn small">⭐ Set Primary</button>` : ''}
            </div>
          </div>
        `;
      } else {
        return `
          <div class="engine-result error">
            <h5>${result.engine.toUpperCase()}</h5>
            <p class="error"><strong>Failed:</strong> ${result.error}</p>
            <p class="error-details"><small>Check browser console for details</small></p>
          </div>
        `;
      }
    }).join('');
  } else {
    if (currentActiveResult) {
      resultInfo.innerHTML = `
        <strong>Output:</strong> ${outputFileName}
        <br><strong>Size:</strong> ${formatFileSize(currentActiveResult.result.size)}
        <br><strong>Engine:</strong> ${currentActiveResult.engine.toUpperCase()}
        ${currentActiveResult.result.metadata ? `<br><strong>Backend:</strong> ${currentActiveResult.result.metadata.backend || currentActiveResult.engine}` : ''}
        ${currentActiveResult.result.metadata?.dimensions ? `<br><strong>Dimensions:</strong> ${currentActiveResult.result.metadata.dimensions.width}×${currentActiveResult.result.metadata.dimensions.height}mm` : ''}
      `;
    }
  }
}

function displayBatchResults() {
  multipleResults.style.display = 'none';
  batchResults.style.display = 'block';

  const successCount = conversionResults.filter(r => r.success).length;
  const totalFiles = conversionResults.length;

  resultInfo.innerHTML = `
    <strong>Batch Conversion Complete!</strong>
    <br><strong>Success Rate:</strong> ${successCount} of ${totalFiles} files processed successfully
    ${successCount > 0 ? `<br><strong>Ready for download:</strong> Individual files or ZIP archive` : ''}
  `;

  batchFileResults.innerHTML = conversionResults.map((conversionResult, fileIndex) => {
    const { file, results, success, error } = conversionResult;

    if (success) {
      const successfulResults = results.filter(r => r.success);
      const primaryResult = successfulResults[0];

      return `
        <div class="batch-file-result success">
          <div class="batch-file-header">
            <div class="batch-file-name">${file.file.name}</div>
            <div class="batch-file-status success">✅ Success</div>
          </div>
          <p><strong>Engine:</strong> ${primaryResult.engine.toUpperCase()}</p>
          <p><strong>Size:</strong> ${formatFileSize(primaryResult.result.size)}</p>
          ${results.length > 1 ? `<p><strong>Engines:</strong> ${successfulResults.length} of ${results.length} successful</p>` : ''}
          <div class="batch-file-actions">
            <button onclick="previewBatchResult(${fileIndex})" class="preview-btn">👁️ Preview</button>
            <button onclick="downloadBatchResult(${fileIndex})" class="download-btn">📥 Download</button>
            ${results.length > 1 ? `<button onclick="showBatchEngineResults(${fileIndex})" class="primary-btn">⚙️ View All Results</button>` : ''}
          </div>
        </div>
      `;
    } else {
      return `
        <div class="batch-file-result error">
          <div class="batch-file-header">
            <div class="batch-file-name">${file.file.name}</div>
            <div class="batch-file-status error">❌ Failed</div>
          </div>
          <p class="error"><strong>Error:</strong> ${error}</p>
        </div>
      `;
    }
  }).join('');
}

function getQualityInfo(metadata) {
  if (metadata.backend) return metadata.backend;
  if (metadata.quality) return metadata.quality;
  if (metadata.resolution) return `${metadata.resolution} DPI`;
  return 'Default';
}

function handleProgress(progressData) {
  const percentage = Math.round(progressData.progress);
  progressFill.style.width = `${percentage}%`;
 progressText.textContent = `${progressData.stage}: ${percentage}%`;

 if (progressData.message) {
   progressText.textContent += ` - ${progressData.message}`;
 }
}

function handleError(error) {
 progress.style.display = 'none';
 alert(`Conversion failed: ${error.message || error}`);
 options.style.display = 'block';
}

function handlePreview() {
 if (!currentActiveResult?.result?.url) return;

 pdfPreview.src = currentActiveResult.result.url;
 previewModal.style.display = 'flex';
}

function handleClosePreview() {
 previewModal.style.display = 'none';
 pdfPreview.src = '';
}

function handleReconvert() {
 result.style.display = 'none';
 options.style.display = 'block';
 batchProgress.innerHTML = '';
 batchProgress.style.display = 'none';

 cleanupPreviousResults();
}

function handleDownload() {
 if (!currentActiveResult?.result?.url || !currentFiles.length) return;

 const fileObj = currentFiles[0];
 const outputFileName = getOutputFileName(
   fileObj.file.name,
   fileObj.type === 'pdf' ? 'compress' : 'convert'
 );

 downloadFile(currentActiveResult.result.url, outputFileName);
}

async function handleDownloadAll() {
 if (!conversionResults.length) return;

 try {
   const JSZip = (await import('https://cdn.skypack.dev/jszip')).default;
   const zip = new JSZip();

   let addedFiles = 0;

   for (const conversionResult of conversionResults) {
     if (conversionResult.success && conversionResult.results) {
       const successfulResults = conversionResult.results.filter(r => r.success);

       if (successfulResults.length === 1) {
         const result = successfulResults[0];
         const outputFileName = getOutputFileName(
           conversionResult.file.file.name,
           conversionResult.file.type === 'pdf' ? 'compress' : 'convert'
         );

         const response = await fetch(result.result.url);
         const blob = await response.blob();
         zip.file(outputFileName, blob);
         addedFiles++;
       } else if (successfulResults.length > 1) {
         const baseFileName = conversionResult.file.file.name.replace(/\.[^/.]+$/, '');
         const folderName = `${baseFileName}_multi_engine`;

         for (const result of successfulResults) {
           const outputFileName = `${baseFileName}_${result.engine}.pdf`;
           const response = await fetch(result.result.url);
           const blob = await response.blob();
           zip.file(`${folderName}/${outputFileName}`, blob);
           addedFiles++;
         }
       }
     }
   }

   if (addedFiles === 0) {
     alert('No files available for download');
     return;
   }

   const zipBlob = await zip.generateAsync({ type: 'blob' });
   const zipUrl = URL.createObjectURL(zipBlob);
   const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
   downloadFile(zipUrl, `converted_files_${timestamp}.zip`);

   setTimeout(() => URL.revokeObjectURL(zipUrl), 1000);

 } catch (error) {
   console.error('Failed to create ZIP:', error);
   alert('Failed to create ZIP file. You can download files individually.');
 }
}

function downloadFile(url, filename) {
 const link = document.createElement('a');
 link.href = url;
 link.download = filename;
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
}

function handleReset() {
 cleanupPreviousResults();

 currentFiles = [];
 fileInput.value = '';

 resetUI();
}

function cleanupPreviousResults() {
 if (Array.isArray(conversionResults)) {
   conversionResults.forEach(result => {
     if (result.success && result.result?.url) {
       URL.revokeObjectURL(result.result.url);
     } else if (result.results) {
       result.results.forEach(r => {
         if (r.success && r.result?.url) {
           URL.revokeObjectURL(r.result.url);
         }
       });
     }
   });
 }
 conversionResults = [];
 currentActiveResult = null;
}

function resetUI() {
 fileInfo.style.display = 'none';
 fileList.style.display = 'none';
 options.style.display = 'none';
 progress.style.display = 'none';
 batchProgress.style.display = 'none';
 batchProgress.innerHTML = '';
 result.style.display = 'none';
 advancedOptions.style.display = 'none';
 multipleResults.style.display = 'none';
 batchResults.style.display = 'none';
 previewModal.style.display = 'none';
 toggleAdvanced.textContent = '⚙️ Show Advanced Options';
}

function formatFileSize(bytes) {
 if (bytes === 0) return '0 Bytes';
 const k = 1024;
 const sizes = ['Bytes', 'KB', 'MB', 'GB'];
 const i = Math.floor(Math.log(bytes) / Math.log(k));
 return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

window.removeFile = function(index) {
 currentFiles.splice(index, 1);
 if (currentFiles.length === 0) {
   resetUI();
 } else {
   displaySelectedFiles();
   showFileTypeOptions();
 }
};

window.previewEngineResult = function(index) {
 const result = conversionResults[index];
 if (result && result.success && result.result?.url) {
   pdfPreview.src = result.result.url;
   previewModal.style.display = 'flex';
 }
};

window.downloadEngineResult = function(index) {
 const result = conversionResults[index];
 if (result && result.success && result.result?.url && currentFiles.length) {
   const baseFileName = currentFiles[0].file.name.replace(/\.[^/.]+$/, '');
   const outputFileName = `${baseFileName}_${result.engine}.pdf`;
   downloadFile(result.result.url, outputFileName);
 }
};

window.setPrimaryResult = function(index) {
 const result = conversionResults[index];
 if (result && result.success) {
   currentActiveResult = result;
   displayResults();
 }
};

window.previewBatchResult = function(fileIndex) {
 const conversionResult = conversionResults[fileIndex];
 if (conversionResult && conversionResult.success) {
   const successfulResult = conversionResult.results.find(r => r.success);
   if (successfulResult?.result?.url) {
     pdfPreview.src = successfulResult.result.url;
     previewModal.style.display = 'flex';
   }
 }
};

window.downloadBatchResult = function(fileIndex) {
 const conversionResult = conversionResults[fileIndex];
 if (conversionResult && conversionResult.success) {
   const successfulResult = conversionResult.results.find(r => r.success);
   if (successfulResult?.result?.url) {
     const outputFileName = getOutputFileName(
       conversionResult.file.file.name,
       conversionResult.file.type === 'pdf' ? 'compress' : 'convert'
     );
     downloadFile(successfulResult.result.url, outputFileName);
   }
 }
};

window.showBatchEngineResults = function(fileIndex) {
 const conversionResult = conversionResults[fileIndex];
 if (!conversionResult || !conversionResult.results) return;

 const results = conversionResult.results;
 const successfulResults = results.filter(r => r.success);

 let modalContent = `
   <div style="max-width: 600px; margin: 2rem auto; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
     <h3>Engine Results for ${conversionResult.file.file.name}</h3>
     <p><strong>Success Rate:</strong> ${successfulResults.length} of ${results.length} engines</p>
     <div style="display: grid; gap: 1rem; margin-top: 1rem;">
 `;

 results.forEach((result, resultIndex) => {
   if (result.success) {
     modalContent += `
       <div style="padding: 1rem; border: 1px solid #0ea5e9; border-radius: 6px; background: #f0f9ff;">
         <h5 style="margin: 0 0 0.5rem 0; color: #0369a1;">${result.engine.toUpperCase()}</h5>
         <p style="margin: 0.5rem 0; font-size: 0.9rem;"><strong>Size:</strong> ${formatFileSize(result.result.size)}</p>
         <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
           <button onclick="previewSpecificResult(${fileIndex}, ${resultIndex})" style="padding: 6px 12px; background: #8b5cf6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">👁️ Preview</button>
           <button onclick="downloadSpecificResult(${fileIndex}, ${resultIndex})" style="padding: 6px 12px; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">📥 Download</button>
         </div>
       </div>
     `;
   } else {
     modalContent += `
       <div style="padding: 1rem; border: 1px solid #ef4444; border-radius: 6px; background: #fef2f2;">
         <h5 style="margin: 0 0 0.5rem 0; color: #dc2626;">${result.engine.toUpperCase()}</h5>
         <p style="margin: 0.5rem 0; font-size: 0.9rem; color: #dc2626;"><strong>Failed:</strong> ${result.error}</p>
       </div>
     `;
   }
 });

 modalContent += `
     </div>
     <div style="text-align: center; margin-top: 2rem;">
       <button onclick="closeBatchEngineModal()" style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
     </div>
   </div>
 `;

 const modal = document.createElement('div');
 modal.id = 'batchEngineModal';
 modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1001; padding: 1rem; overflow-y: auto;';
 modal.innerHTML = modalContent;

 modal.addEventListener('click', (e) => {
   if (e.target === modal) {
     document.body.removeChild(modal);
   }
 });

 document.body.appendChild(modal);
};

window.previewSpecificResult = function(fileIndex, resultIndex) {
 const result = conversionResults[fileIndex].results[resultIndex];
 if (result && result.success && result.result?.url) {
   pdfPreview.src = result.result.url;
   previewModal.style.display = 'flex';

   const modal = document.getElementById('batchEngineModal');
   if (modal) {
     document.body.removeChild(modal);
   }
 }
};

window.downloadSpecificResult = function(fileIndex, resultIndex) {
 const conversionResult = conversionResults[fileIndex];
 const result = conversionResult.results[resultIndex];
 if (result && result.success && result.result?.url) {
   const baseFileName = conversionResult.file.file.name.replace(/\.[^/.]+$/, '');
   const outputFileName = `${baseFileName}_${result.engine}.pdf`;
   downloadFile(result.result.url, outputFileName);
 }
};

window.closeBatchEngineModal = function() {
 const modal = document.getElementById('batchEngineModal');
 if (modal) {
   document.body.removeChild(modal);
 }
};

initializeEventListeners();