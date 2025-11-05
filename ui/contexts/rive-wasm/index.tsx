/**
 * Shared Rive WASM initialization module
 * This module ensures WASM is loaded once and can be used by multiple animation components
 */
import { RuntimeLoader } from '@rive-app/react-canvas';
import React, { createContext, useContext, useState } from 'react';
import { useAsyncResult } from '../../hooks/useAsync';

// create a context only for the wasm ready state
const RiveWasmContext = createContext<{
  isWasmReady: boolean;
  loading: boolean;
  error: Error | undefined;
}>({ isWasmReady: false, loading: false, error: undefined });

export default function RiveWasmProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isWasmReady, loading, error } = useRiveWasmReady();
  return (
    <RiveWasmContext.Provider value={{ isWasmReady, loading, error }}>
      {children}
    </RiveWasmContext.Provider>
  );
}

export const useRiveWasmContext = () => {
  const context = useContext(RiveWasmContext);
  if (!context) {
    throw new Error('useRiveWasm must be used within RiveWasmProvider');
  }
  return context;
};

// WASM file URL - the file is copied to dist/chrome/images/ by the build process
// We don't import it as a module to avoid browserify resolution issues
const RIVE_WASM_URL = './images/riv_animations/rive.wasm';
const isTestEnvironment = Boolean(process.env.IN_TEST);

let arrayBuffer: ArrayBuffer | null = null;

export const useRiveWasmReady = () => {
  const [isWasmReady, setIsWasmReady] = useState(isTestEnvironment);

  const result = useAsyncResult(async () => {
    if (arrayBuffer) {
      setIsWasmReady(true);
      return true;
    }
    console.log('useRiveWasmReady');

    if (isTestEnvironment || typeof RuntimeLoader === 'undefined') {
      setIsWasmReady(true);
      return true;
    }
    const response = await fetch(RIVE_WASM_URL);
    if (!response.ok) {
      throw new Error(
        `HTTP error! status while fetching rive.wasm: ${response.status}`,
      );
    }
    arrayBuffer = await response.arrayBuffer();
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

  const { isWasmReady } = useRiveWasmContext();

  const result = useAsyncResult(async () => {
    console.log('useRiveWasmFile', url, isWasmReady);
    if (!isWasmReady) {
      return undefined;
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}, url: ${url}`);
    }
    const newArrayBuffer = await response.arrayBuffer();
    setBuffer(newArrayBuffer);
    return newArrayBuffer;
  }, [isWasmReady, url]);

  return { buffer, loading: result.pending, error: result.error };
};
