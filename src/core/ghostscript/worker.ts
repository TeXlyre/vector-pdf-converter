import type { GhostscriptWorkerMessage } from '../../types/ghostscript-types';
import { GhostscriptOptionsBuilder } from './ghostscript-options';

// Import the Ghostscript assets - Vite will handle the URLs
import gsWorkerUrl from '../ghostscript/gs-worker.js?url';
import gsWasmUrl from '../ghostscript/gs-worker.wasm?url';

declare const Module: any;

let isModuleLoaded = false;

async function loadScript(moduleConfig: any) {
  if (!isModuleLoaded) {
    try {
      console.log('Loading Ghostscript from:', gsWorkerUrl);

      // Set up Module BEFORE loading the script
      (self as any).Module = moduleConfig;
      console.log('Module configuration set before script load');

      const response = await fetch(gsWorkerUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch gs-worker.js: ${response.status} ${response.statusText}`);
      }

      const scriptContent = await response.text();

      if (scriptContent.trim().startsWith('<')) {
        throw new Error('Received HTML instead of JavaScript - Ghostscript files not properly served');
      }

      // Execute the script content
      try {
        const scriptFunction = new Function(scriptContent);
        scriptFunction.call(self);
      } catch (execError) {
        console.error('Script execution error:', execError);
      }

      isModuleLoaded = true;
      console.log('✓ Ghostscript module loaded successfully');

    } catch (error) {
      console.error('Failed to load Ghostscript:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load Ghostscript WebAssembly module: ${errorMessage}`);
    }
  }
}

async function processFile(data: GhostscriptWorkerMessage['data']): Promise<{ url: string; size: number }> {
  return new Promise(async (resolve, reject) => {
    try {
      self.postMessage({ type: 'progress', data: { stage: 'initializing', progress: 10 } });

      // Load input file first
      const response = await fetch(data.fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to load input file: ${response.status}`);
      }

      const fileBuffer = await response.arrayBuffer();
      URL.revokeObjectURL(data.fileUrl);

      self.postMessage({ type: 'progress', data: { stage: 'processing', progress: 25 } });

      const inputFilename = `input.${data.inputType}`;
      let args: string[];

      if (data.inputType === 'pdf') {
        args = GhostscriptOptionsBuilder.buildCompressionArgs(data.options as any);
      } else if (data.inputType === 'eps') {
        args = GhostscriptOptionsBuilder.buildEPSArgs(data.options as any);
      } else {
        throw new Error(`Unsupported input type: ${data.inputType}`);
      }

      args.push('-sOutputFile=output.pdf', inputFilename);

      console.log('Ghostscript arguments:', args);

      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          reject(new Error('Ghostscript processing timeout after 30 seconds'));
        }
      }, 30000);

      // Create module configuration BEFORE loading the script
      const moduleConfig = {
        preRun: [
          function () {
            console.log('PreRun: Writing input file:', inputFilename);
            try {
              (self as any).Module.FS.writeFile(inputFilename, new Uint8Array(fileBuffer));
              console.log(`PreRun: Successfully wrote ${inputFilename} (${fileBuffer.byteLength} bytes)`);
            } catch (error) {
              console.error('PreRun: Error writing file:', error);
            }
          }
        ],
        postRun: [
          function () {
            try {
              if (resolved) return;

              console.log('PostRun: Ghostscript execution completed');

              clearTimeout(timeout);
              resolved = true;

              self.postMessage({ type: 'progress', data: { stage: 'finalizing', progress: 90 } });

              const uarray = (self as any).Module.FS.readFile('output.pdf', { encoding: 'binary' });
              console.log('PostRun: Output file read, size:', uarray.length);

              const blob = new Blob([uarray], { type: 'application/pdf' });
              const pdfURL = URL.createObjectURL(blob);

              self.postMessage({ type: 'progress', data: { stage: 'finalizing', progress: 100 } });
              resolve({ url: pdfURL, size: blob.size });
            } catch (error) {
              if (!resolved) {
                clearTimeout(timeout);
                resolved = true;
                const errorMessage = error instanceof Error ? error.message : String(error);
                reject(new Error(`PostRun error: ${errorMessage}`));
              }
            }
          }
        ],
        arguments: args,
        print: (text: string) => console.log('Ghostscript stdout:', text),
        printErr: (text: string) => console.warn('Ghostscript stderr:', text),
        onAbort: (what: any) => {
          if (!resolved) {
            clearTimeout(timeout);
            resolved = true;
            reject(new Error(`Ghostscript aborted: ${what}`));
          }
        },
        totalDependencies: 0,
        noExitRuntime: 1,
        locateFile: (path: string) => {
          if (path.endsWith('.wasm')) {
            return gsWasmUrl;
          }
          return path;
        }
      };

      self.postMessage({ type: 'progress', data: { stage: 'processing', progress: 50 } });

      // Load the script with the pre-configured module
      await loadScript(moduleConfig);

      self.postMessage({ type: 'progress', data: { stage: 'processing', progress: 75 } });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      reject(new Error(errorMessage));
    }
  });
}

self.addEventListener('message', async (event: MessageEvent<GhostscriptWorkerMessage>) => {
  const { data } = event.data;

  try {
    const result = await processFile(data);
    self.postMessage({ type: 'success', data: { result } });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Worker error:', errorMessage);
    self.postMessage({
      type: 'error',
      data: { error: errorMessage }
    });
  }
});