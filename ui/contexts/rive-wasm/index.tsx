/**
 * Shared Rive WASM initialization module
 * This module ensures WASM is loaded once and can be used by multiple animation components
 */
import { RuntimeLoader } from '@rive-app/react-canvas';
import React, { createContext, useCallback, useContext, useState } from 'react';
import { useAsyncResult } from '../../hooks/useAsync';

// WASM file URL - the file is copied to dist/chrome/images/ by the build process
// We don't import it as a module to avoid browserify resolution issues
const RIVE_WASM_URL = './images/riv_animations/rive.wasm';
const isTestEnvironment = Boolean(process.env.IN_TEST);

export const useRiveWasmReady = () => {
  const [isWasmReady, setIsWasmReady] = useState(isTestEnvironment);

  const result = useAsyncResult(async () => {
    if (isWasmReady) {
      return true;
    }

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
    const arrayBuffer = await response.arrayBuffer();
    (RuntimeLoader as unknown as { wasmBinary: ArrayBuffer }).wasmBinary =
      arrayBuffer;
    RuntimeLoader.setWasmUrl('should not fetch wasm'); // easier to debug if something goes wrong

    // Preload the WASM
    await RuntimeLoader.awaitInstance();
    setIsWasmReady(true);
    return true;
  }, [isWasmReady, setIsWasmReady]);

  return {
    isWasmReady,
    loading: result.pending,
    error: result.error,
  };
};

// create a context only for the wasm ready state
const RiveWasmContext = createContext<{
  isWasmReady: boolean;
  loading: boolean;
  error: Error | undefined;
  urlBufferMap: Record<string, ArrayBuffer>;
  setUrlBufferCache: (url: string, buffer: ArrayBuffer) => void;
  animationCompleted: Record<string, boolean>;
  setIsAnimationCompleted: (
    animationName: string,
    isAnimationCompleted: boolean,
  ) => void;
}>({
  isWasmReady: false,
  loading: false,
  error: undefined,
  urlBufferMap: {},
  // eslint-disable-next-line no-empty-function
  setUrlBufferCache: () => {},
  animationCompleted: {},
  // eslint-disable-next-line no-empty-function
  setIsAnimationCompleted: () => {},
});

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function RiveWasmProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [urlBufferMap, setUrlBufferMap] = useState<Record<string, ArrayBuffer>>(
    {},
  );
  const [animationCompleted, setAnimationCompleted] = useState<
    Record<string, boolean>
  >({});

  const setUrlBufferCache = useCallback(
    (url: string, buffer: ArrayBuffer) => {
      setUrlBufferMap((prev) => ({ ...prev, [url]: buffer }));
    },
    [setUrlBufferMap],
  );

  const setIsAnimationCompleted = useCallback(
    (animationName: string, isAnimationCompleted: boolean) => {
      setAnimationCompleted((prev) => ({
        ...prev,
        [animationName]: isAnimationCompleted,
      }));
    },
    [setAnimationCompleted],
  );

  const { isWasmReady, loading, error } = useRiveWasmReady();

  return (
    <RiveWasmContext.Provider
      value={{
        isWasmReady,
        loading,
        error,
        urlBufferMap,
        setUrlBufferCache,
        animationCompleted,
        setIsAnimationCompleted,
      }}
    >
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

export const useRiveWasmFile = (url: string) => {
  const { isWasmReady, urlBufferMap, setUrlBufferCache } = useRiveWasmContext();

  const cachedBuffer = urlBufferMap[url];

  const result = useAsyncResult(async () => {
    if (!isWasmReady) {
      return undefined;
    }
    if (cachedBuffer) {
      return cachedBuffer;
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}, url: ${url}`);
    }
    const newArrayBuffer = await response.arrayBuffer();
    setUrlBufferCache(url, newArrayBuffer);
    return newArrayBuffer;
  }, [isWasmReady, url, setUrlBufferCache, cachedBuffer]);

  return { buffer: result.value, loading: result.pending, error: result.error };
};
