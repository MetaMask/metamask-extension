/**
 * Shared Rive WASM initialization module
 * This module ensures WASM is loaded once and can be used by multiple animation components
 */
import { RuntimeLoader } from '@rive-app/react-canvas';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const RIVE_WASM_URL = new URL(
  '@rive-app/canvas/rive.wasm',
  // @ts-expect-error TS1470: 'import.meta' is not allowed in CommonJS
  import.meta.url,
);

/**
 * Module-level WASM init. Survives createRoot/StrictMode remounts of
 * RiveWasmProvider so isWasmReady is not stuck false after the first
 * in-flight load is abandoned on unmount.
 */
let riveWasmInitPromise: Promise<void> | null = null;

function ensureRiveWasmLoaded(): Promise<void> {
  if (riveWasmInitPromise === null) {
    riveWasmInitPromise = (async () => {
      if (typeof RuntimeLoader === 'undefined') {
        return;
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
      // Easier to debug if something goes wrong and a fetch is attempted.
      RuntimeLoader.setWasmUrl('should not fetch wasm');
      await RuntimeLoader.awaitInstance();
    })().catch((error) => {
      // Allow a later mount to retry after a failed init.
      riveWasmInitPromise = null;
      throw error;
    });
  }

  return riveWasmInitPromise;
}

export const useRiveWasmReady = () => {
  const [isWasmReady, setIsWasmReady] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    ensureRiveWasmLoaded()
      .then(() => {
        if (!cancelled) {
          setIsWasmReady(true);
          setLoading(false);
          setError(undefined);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setIsWasmReady(false);
          setLoading(false);
          setError(err);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    isWasmReady,
    loading,
    error,
  };
};

// create a context only for the wasm ready state
const RiveWasmContext = createContext<{
  isWasmReady: boolean;
  loading: boolean;
  error: Error | undefined;
  animationCompleted: Record<string, boolean>;
  setIsAnimationCompleted: (
    animationName: string,
    isAnimationCompleted: boolean,
  ) => void;
}>({
  isWasmReady: false,
  loading: false,
  error: undefined,
  animationCompleted: {},
  // eslint-disable-next-line no-empty-function
  setIsAnimationCompleted: () => {},
});

export default function RiveWasmProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [animationCompleted, setAnimationCompleted] = useState<
    Record<string, boolean>
  >({});

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

  const contextValue = useMemo(
    () => ({
      isWasmReady,
      loading,
      error,
      animationCompleted,
      setIsAnimationCompleted,
    }),
    [isWasmReady, loading, error, animationCompleted, setIsAnimationCompleted],
  );

  return (
    <RiveWasmContext.Provider value={contextValue}>
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

/** Module caches so .riv bytes survive StrictMode provider remounts. */
const rivBufferCache = new Map<string, ArrayBuffer>();
const rivBufferPromises = new Map<string, Promise<ArrayBuffer>>();

function loadRivBuffer(url: string): Promise<ArrayBuffer> {
  const cached = rivBufferCache.get(url);
  if (cached) {
    return Promise.resolve(cached);
  }

  const inFlight = rivBufferPromises.get(url);
  if (inFlight !== undefined) {
    return inFlight;
  }

  const promise = fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, url: ${url}`);
      }
      return response.arrayBuffer();
    })
    .then((buffer) => {
      rivBufferCache.set(url, buffer);
      rivBufferPromises.delete(url);
      return buffer;
    })
    .catch((error) => {
      rivBufferPromises.delete(url);
      throw error;
    });

  rivBufferPromises.set(url, promise);
  return promise;
}

/**
 * Load a .riv into an ArrayBuffer, cached in a module-level Map so one
 * animation finishing a fetch does not re-run effects or re-render siblings.
 *
 * @param url - Path to the .riv asset
 */
export const useRiveWasmFile = (url: string) => {
  const { isWasmReady } = useRiveWasmContext();
  const [rawBuffer, setRawBuffer] = useState<ArrayBuffer | undefined>(() =>
    rivBufferCache.get(url),
  );
  const [loading, setLoading] = useState(() => !rivBufferCache.has(url));
  const [error, setError] = useState<Error | undefined>(undefined);
  const [loadedUrl, setLoadedUrl] = useState(url);

  // Sync from the module Map when `url` changes (render-time adjust).
  if (url !== loadedUrl) {
    setLoadedUrl(url);
    const cached = rivBufferCache.get(url);
    setRawBuffer(cached);
    setLoading(!cached);
    setError(undefined);
  }

  useEffect(() => {
    // Cache hits are handled during render above; only fetch on miss.
    if (rivBufferCache.has(url)) {
      return undefined;
    }

    let cancelled = false;
    loadRivBuffer(url)
      .then((loaded) => {
        if (!cancelled) {
          setRawBuffer(loaded);
          setLoading(false);
          setError(undefined);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setLoading(false);
          setError(err);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  // Do not expose .riv bytes until WASM is ready. Callers pass `buffer` into
  // useRiveFile / useRive; a failed load while the runtime is unloaded can
  // leave status === 'failed' permanently even after WASM becomes ready.
  const buffer = isWasmReady ? rawBuffer : undefined;

  return {
    buffer,
    loading: !isWasmReady || loading,
    error,
  };
};
