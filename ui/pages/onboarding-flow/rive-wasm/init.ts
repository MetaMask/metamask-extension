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

/**
 * Initialize Rive WASM once using the bundled WASM file
 * This function ensures WASM is loaded before Rive components try to use it
 *
 * @returns Promise that resolves when WASM is ready, rejects on error
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

      // Fetch the WASM binary and convert to base64 data URI
      fetch(RIVE_WASM_URL)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.arrayBuffer();
        })
        .then((arrayBuffer) => {
          (RuntimeLoader as unknown as { wasmBinary: ArrayBuffer }).wasmBinary =
            arrayBuffer;
          RuntimeLoader.setWasmUrl('should not fetch wasm'); // easier to debug if something goes wrong

          // Preload the WASM
          RuntimeLoader.awaitInstance()
            .then(() => {
              console.log('[Rive] WASM loaded and initialized successfully');
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
 * Wait for WASM to be ready
 *
 * @returns Promise that resolves when WASM is initialized and ready to use
 * This allows components to await WASM readiness without polling
 */
export function waitForWasmReady(): Promise<void> {
  // If already initialized, return that promise
  if (wasmInitializationPromise) {
    return wasmInitializationPromise;
  }

  // If not initialized yet, initialize it
  return initializeRiveWASM();
}
