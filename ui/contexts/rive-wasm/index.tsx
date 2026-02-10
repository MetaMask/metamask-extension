/**
 * Shared Rive WASM initialization module
 * This module ensures WASM is loaded once and can be used by multiple animation components
 */
import { RuntimeLoader, useRive } from '@rive-app/react-canvas';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useAsyncResult } from '../../hooks/useAsync';

const RIVE_WASM_URL = new URL(
  '@rive-app/canvas/rive.wasm',
  // @ts-expect-error TS1470: 'import.meta' is not allowed in CommonJS
  import.meta.url,
);

const useRiveWasmReady = () => {
  const [isWasmReady, setIsWasmReady] = useState(false);

  const result = useAsyncResult(async () => {
    if (isWasmReady) {
      return true;
    }

    if (typeof RuntimeLoader === 'undefined') {
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
    // Lavamoat blocks RuntimeLoader access to fetch for security reasons,
    // so setWasmUrl won't work.
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
  const { urlBufferMap, setUrlBufferCache } = useRiveWasmContext();

  const cachedBuffer = urlBufferMap[url];

  const result = useAsyncResult(async () => {
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
  }, [url, setUrlBufferCache, cachedBuffer]);

  return { buffer: result.value, loading: result.pending, error: result.error };
};

type UseRiveParams = NonNullable<Parameters<typeof useRive>[0]>;
type UseRiveOptions = Parameters<typeof useRive>[1];
type UseRiveOnLoadError = UseRiveParams['onLoadError'];

type UseRiveWasmAnimationOptions = {
  url: string;
  riveParams?: Omit<UseRiveParams, 'buffer' | 'src'>;
  riveOptions?: UseRiveOptions;
};

export const useRiveWasmAnimation = ({
  url,
  riveParams,
  riveOptions,
}: UseRiveWasmAnimationOptions) => {
  const { isWasmReady, error: wasmError } = useRiveWasmContext();
  const {
    buffer,
    error: bufferError,
    loading: bufferLoading,
  } = useRiveWasmFile(url);
  const [riveError, setRiveError] = useState<unknown>(undefined);

  useEffect(() => {
    setRiveError(undefined);
  }, [url]);

  const shouldInitializeRive = Boolean(isWasmReady && !bufferLoading && buffer);
  useEffect(() => {
    if (wasmError) {
      console.error('[Rive] Failed to load WASM:', wasmError);
    }
    if (bufferError) {
      console.error('[Rive] Failed to load buffer:', bufferError);
    }
  }, [wasmError, bufferError]);

  const onLoadError = riveParams?.onLoadError;
  const riveInitParams: UseRiveParams | null = shouldInitializeRive
    ? {
        ...riveParams,
        buffer,
        onLoadError: (...args: Parameters<NonNullable<UseRiveOnLoadError>>) => {
          setRiveError(args[0]);
          if (onLoadError) {
            onLoadError(...args);
          }
        },
      }
    : null;

  const riveState = useRive(riveInitParams, riveOptions);
  const hasFailed = Boolean(wasmError || bufferError || riveError);
  const canRenderRive = shouldInitializeRive && !hasFailed;
  const rive = canRenderRive ? riveState.rive : null;

  return {
    rive,
    RiveComponent: riveState.RiveComponent,
    hasFailed,
    canRenderRive,
  };
};
