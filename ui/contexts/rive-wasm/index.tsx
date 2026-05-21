/**
 * Shared Rive WASM initialization module
 * This module ensures WASM is loaded once and can be used by multiple animation components
 */
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

const logRivePreloadError = (...args: unknown[]) => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  console.error(...args);
};

type RiveWasmReadyState = {
  isWasmReady: boolean;
  loading: boolean;
  error: Error | undefined;
};

let riveWasmReadyState: RiveWasmReadyState = {
  isWasmReady: false,
  loading: false,
  error: undefined,
};

let runtimeLoaderPromise:
  | Promise<{
      runtimeLoader?: typeof import('@rive-app/canvas').RuntimeLoader;
    }>
  | undefined;
let wasmPreloadPromise: Promise<void> | undefined;

const riveWasmListeners = new Set<(state: RiveWasmReadyState) => void>();

const areRiveWasmReadyStatesEqual = (
  left: RiveWasmReadyState,
  right: RiveWasmReadyState,
) =>
  left.isWasmReady === right.isWasmReady &&
  left.loading === right.loading &&
  left.error === right.error;

const notifyRiveWasmListeners = () => {
  const nextState = { ...riveWasmReadyState };
  riveWasmListeners.forEach((listener) => listener(nextState));
};

const setRiveWasmReadyState = (nextState: Partial<RiveWasmReadyState>) => {
  riveWasmReadyState = { ...riveWasmReadyState, ...nextState };
  notifyRiveWasmListeners();
};

/**
 * Lazily loads the Rive runtime module once per session.
 *
 * The module-level promise memoization keeps repeated preload requests from
 * re-importing the runtime chunk. If multiple callers request preload while an
 * earlier request is still in flight, they all await the same shared promise.
 */
const loadRiveRuntime = () => {
  if (!runtimeLoaderPromise) {
    runtimeLoaderPromise = import('@rive-app/react-canvas')
      .then((module) => ({
        runtimeLoader: module.RuntimeLoader,
      }))
      .catch((error) => {
        runtimeLoaderPromise = undefined;
        throw error;
      });
  }

  return runtimeLoaderPromise;
};

export const preloadRiveWasm = async () => {
  if (riveWasmReadyState.isWasmReady) {
    return;
  }

  if (!wasmPreloadPromise) {
    setRiveWasmReadyState({
      loading: true,
      error: undefined,
    });

    wasmPreloadPromise = (async () => {
      const { runtimeLoader: RuntimeLoader } = await loadRiveRuntime();

      if (typeof RuntimeLoader === 'undefined') {
        setRiveWasmReadyState({
          isWasmReady: true,
          loading: false,
        });
        return;
      }

      const response = await fetch(RIVE_WASM_URL);
      if (!response.ok) {
        throw new Error(
          `HTTP error! status while fetching rive.wasm: ${response.status}`,
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      // Rive expects `wasmBinary` to be assigned before `awaitInstance()`, but
      // that field is not exposed in the public type definitions.
      (
        RuntimeLoader as typeof RuntimeLoader & { wasmBinary: ArrayBuffer }
      ).wasmBinary = arrayBuffer;
      RuntimeLoader.setWasmUrl('should not fetch wasm');

      await RuntimeLoader.awaitInstance();

      setRiveWasmReadyState({
        isWasmReady: true,
        loading: false,
        error: undefined,
      });
    })().catch((error: Error) => {
      wasmPreloadPromise = undefined;
      setRiveWasmReadyState({
        loading: false,
        error,
      });
      throw error;
    });
  }

  return wasmPreloadPromise;
};

export const useRiveWasmReady = () => {
  const [state, setState] = useState<RiveWasmReadyState>(riveWasmReadyState);

  useEffect(() => {
    const listener = (nextState: RiveWasmReadyState) => {
      setState(nextState);
    };

    riveWasmListeners.add(listener);
    setState((currentState) => {
      if (areRiveWasmReadyStatesEqual(currentState, riveWasmReadyState)) {
        return currentState;
      }

      return riveWasmReadyState;
    });

    return () => {
      riveWasmListeners.delete(listener);
    };
  }, []);

  return state;
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

  useEffect(() => {
    // Route-based preload handles the primary Rive surfaces. This component-level
    // request keeps non-route consumers, such as toasts and modals, working when
    // they are mounted outside those preloaded route transitions.
    preloadRiveWasm().catch((error) => {
      logRivePreloadError('[Rive] Failed to preload WASM:', error);
    });
  }, []);

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
