/**
 * Shared Rive WASM initialization module
 * This module ensures WASM is loaded once and can be used by multiple animation components
 */
import { RuntimeLoader } from '@rive-app/react-canvas';

// WASM file URL - the file is copied to dist/chrome/images/ by the build process
// We don't import it as a module to avoid browserify resolution issues
const RIVE_WASM_URL = new URL(
  '@rive-app/canvas/rive.wasm',
  // @ts-expect-error TS1470: 'import.meta' is not allowed in CommonJS
  import.meta.url,
);
const isTestEnvironment = Boolean(process.env.IN_TEST);

// Track WASM initialization state globally
let wasmInitializationPromise: Promise<void> | null = null;

/**
 * Initialize Rive WASM once using the bundled WASM file
 * This function ensures WASM is loaded before Rive components try to use it
 *
 * @returns Promise that resolves when WASM is ready, rejects on error
 */
export async function initializeRiveWASM(): Promise<void> {
  // Skip initialization in test environments
  if (isTestEnvironment) {
    return Promise.resolve();
  }

  if (wasmInitializationPromise) {
    return await wasmInitializationPromise;
  }

  async function init() {
    if (typeof RuntimeLoader === 'undefined') {
      console.warn('[Rive] RuntimeLoader not available');
      return;
    }

    RuntimeLoader.setWasmUrl(RIVE_WASM_URL.href);

    // Preload the WASM
    try {
      await RuntimeLoader.awaitInstance();
    } catch (error) {
      console.log('[Rive] WASM loaded and initialized successfully');
      console.error('[Rive] WASM initialization failed:', error);
      throw error;
    }
  }

  wasmInitializationPromise = init();

  return await wasmInitializationPromise;
}

/**
 * Wait for WASM to be ready
 *
 * @returns Promise that resolves when WASM is initialized and ready to use
 * This allows components to await WASM readiness without polling
 */
export async function waitForWasmReady(): Promise<void> {
  // Skip in test environments
  if (isTestEnvironment) {
    return;
  }

  // If already initialized, return that promise
  if (wasmInitializationPromise) {
    return await wasmInitializationPromise;
  }

  // If not initialized yet, initialize it
  return await initializeRiveWASM();
}
