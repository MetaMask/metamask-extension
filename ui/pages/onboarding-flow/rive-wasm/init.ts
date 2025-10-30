/**
 * Shared Rive WASM initialization module
 * This module ensures WASM is loaded once and can be used by multiple animation components
 */
import { RuntimeLoader } from '@rive-app/react-canvas';

// WASM file URL - the file is copied to dist/chrome/images/ by the build process
// We don't import it as a module to avoid browserify resolution issues
const RIVE_WASM_URL = './images/riv_animations/rive.wasm';

// Track WASM initialization state globally
let wasmInitializationPromise: Promise<void> | null = null;
let wasmIsReady = false;

/**
 * Initialize Rive WASM once using the bundled WASM file
 * This function ensures WASM is loaded before Rive components try to use it
 */
export function initializeRiveWASM(): Promise<void> {
  if (wasmInitializationPromise) {
    return wasmInitializationPromise;
  }

  wasmInitializationPromise = new Promise((resolve, reject) => {
    try {
      if (typeof RuntimeLoader === 'undefined') {
        console.warn('[Rive] RuntimeLoader not available');
        resolve();
        return;
      }

      console.log('[Rive] Loading WASM from:', RIVE_WASM_URL);

      // Fetch once and convert to base64
      fetch(RIVE_WASM_URL)
        .then((response) => response.arrayBuffer())
        .then((arrayBuffer) => {
          // Convert to base64 in chunks to avoid stack overflow
          const bytes = new Uint8Array(arrayBuffer);
          const chunkSize = 8192; // Process 8KB at a time
          let binaryString = '';

          for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.subarray(
              i,
              Math.min(i + chunkSize, bytes.length),
            );
            binaryString += String.fromCharCode.apply(null, Array.from(chunk));
          }

          const wasmBase64 = btoa(binaryString);
          console.log(
            '[Rive] WASM converted to base64, length:',
            wasmBase64.length,
          );

          // Pass the base64 string as the "URL"
          // Your patched qa() function will decode it using atob()
          RuntimeLoader.setWasmUrl(wasmBase64);

          // Preload the WASM by explicitly fetching and instantiating it
          RuntimeLoader.awaitInstance()
            .then(() => {
              console.log('[Rive] WASM loaded and initialized successfully');
              wasmIsReady = true;
              resolve();
            })
            .catch((error: Error) => {
              console.error('[Rive] WASM initialization failed:', error);
              reject(error);
            });
        })
        .catch((error) => {
          console.error('[Rive] Failed to fetch WASM:', error);
          reject(error);
        });
    } catch (error) {
      console.error('[Rive] WASM setup failed:', error);
      reject(error);
    }
  });

  return wasmInitializationPromise;
}

/**
 * Check if WASM is ready
 */
export function isWasmReady(): boolean {
  return wasmIsReady;
}
