/**
 * Shared Rive WASM initialization module
 * This module ensures WASM is loaded once and can be used by multiple animation components
 */
import { RuntimeLoader } from '@rive-app/react-canvas';
import { useState } from 'react';
import { useAsyncResult } from '../../../hooks/useAsync';

// WASM file URL - the file is copied to dist/chrome/images/ by the build process
// We don't import it as a module to avoid browserify resolution issues
const RIVE_WASM_URL = './images/riv_animations/rive.wasm';
const isTestEnvironment = Boolean(process.env.IN_TEST);

export const useRiveWasmReady = () => {
  const [isWasmReady, setIsWasmReady] = useState(isTestEnvironment);

  // Check if WASM is ready (initialized in parent OnboardingFlow)

  const result = useAsyncResult(async () => {
    if (isTestEnvironment || typeof RuntimeLoader === 'undefined') {
      setIsWasmReady(true);
      return true;
    }

    if (isWasmReady) {
      return true;
    }
    const response = await fetch(RIVE_WASM_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    (RuntimeLoader as unknown as { wasmBinary: ArrayBuffer }).wasmBinary =
      arrayBuffer;
    RuntimeLoader.setWasmUrl('should not fetch wasm'); // easier to debug if something goes wrong

    // Preload the WASM
    await RuntimeLoader.awaitInstance();
    setIsWasmReady(true);
    return true;
  }, []);

  return {
    isWasmReady,
    loading: result.pending,
    error: result.error,
  };
};

export const useRiveWasmFile = (url: string) => {
  const [buffer, setBuffer] = useState<ArrayBuffer | undefined>(undefined);
  const { isWasmReady } = useRiveWasmReady();

  const result = useAsyncResult(async () => {
    if (!isWasmReady) {
      return undefined;
    }
    if (buffer) {
      return buffer;
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    setBuffer(arrayBuffer);
    return arrayBuffer;
  }, [isWasmReady, url]);

  return { buffer, loading: result.pending, error: result.error };
};
