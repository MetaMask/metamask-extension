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

      // Set the WASM URL to our local bundled file
      const wasmUrl = RIVE_WASM_URL;
      console.log('[Rive] Initializing WASM from:', wasmUrl);
      RuntimeLoader.setWasmUrl(wasmUrl);

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
