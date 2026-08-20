import React, {
  useEffect,
  useRef,
  useMemo,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  useRive,
  useRiveFile,
  Layout,
  Fit,
  Alignment,
  decodeImage,
  ImageAsset,
} from '@rive-app/react-canvas';
import { Box } from '@metamask/design-system-react';
import {
  useRiveWasmContext,
  useRiveWasmFile,
} from '../../../contexts/rive-wasm';

const CONNECTION_RIV_URL = './images/riv_animations/connection.riv';
const STATE_MACHINE_NAME = 'State Machine 1';
const IMAGE_PLACEHOLDER_NAME = 'DEX Img-6574022.jpeg';
const FALLBACK_ICON_URL = './images/eth_logo.svg';

export type ConnectionAnimationHandle = {
  triggerConnected: () => void;
};

type ConnectionAnimationProps = {
  iconUrl?: string | null;
  onConnectedAnimationComplete?: () => void;
};

type ConnectionAnimationInnerProps = ConnectionAnimationProps & {
  buffer: ArrayBuffer;
};

const ConnectionAnimationInner = forwardRef<
  ConnectionAnimationHandle,
  ConnectionAnimationInnerProps
>(({ buffer, iconUrl, onConnectedAnimationComplete }, ref) => {
  const { isWasmReady } = useRiveWasmContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const connectedTriggeredRef = useRef(false);

  const riveBuffer = useMemo(() => buffer.slice(0), [buffer]);

  const imageUrlToLoad = iconUrl || FALLBACK_ICON_URL;

  const loadImageWithFallback = useCallback(
    async (asset: ImageAsset, primaryUrl: string): Promise<void> => {
      const loadFromUrl = async (url: string): Promise<void> => {
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Failed to fetch image: ${res.status}`);
        }
        const image = await decodeImage(
          new Uint8Array(await res.arrayBuffer()),
        );
        asset.setRenderImage(image);
        image.unref();
      };

      try {
        await loadFromUrl(primaryUrl);
      } catch (err) {
        console.error(
          '[ConnectionAnimation] Failed to load dynamic image:',
          err,
        );
        if (primaryUrl !== FALLBACK_ICON_URL) {
          try {
            await loadFromUrl(FALLBACK_ICON_URL);
          } catch {
            // Fallback also failed, leave placeholder
          }
        }
      }
    },
    [],
  );

  const assetLoader = useCallback(
    (asset: { isImage: boolean; name: string }, bytes: Uint8Array) => {
      if (asset.isImage && asset.name === IMAGE_PLACEHOLDER_NAME) {
        loadImageWithFallback(
          asset as unknown as ImageAsset,
          imageUrlToLoad,
        );
        return true;
      }

      if (bytes.length > 0) {
        return false;
      }

      return false;
    },
    [imageUrlToLoad, loadImageWithFallback],
  );

  const { riveFile, status: riveFileStatus } = useRiveFile({
    buffer: riveBuffer,
  });

  const { rive, RiveComponent } = useRive({
    riveFile: riveFile ?? undefined,
    stateMachines: riveFile ? STATE_MACHINE_NAME : undefined,
    autoplay: true,
    assetLoader,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
  });

  useImperativeHandle(
    ref,
    () => ({
      triggerConnected: () => {
        if (!rive || connectedTriggeredRef.current) {
          return;
        }

        try {
          const inputs = rive.stateMachineInputs(STATE_MACHINE_NAME);
          const connectedTrigger = inputs?.find(
            (input) => input.name === 'connected',
          );
          if (connectedTrigger) {
            connectedTrigger.fire();
            connectedTriggeredRef.current = true;

            if (onConnectedAnimationComplete) {
              setTimeout(onConnectedAnimationComplete, 800);
            }
          }
        } catch {
          // Rive WASM runtime may have been cleaned up
        }
      },
    }),
    [rive, onConnectedAnimationComplete],
  );

  useEffect(() => {
    if (!rive || !containerRef.current) {
      return undefined;
    }

    let frameId = 0;

    const syncCanvasSize = () => {
      const container = containerRef.current;
      const canvasEl = container?.querySelector('canvas');
      if (!container || !canvasEl) {
        return false;
      }
      const { clientWidth, clientHeight } = container;
      if (clientWidth === 0 || clientHeight === 0) {
        return false;
      }
      const dpr = window.devicePixelRatio || 1;
      const scaledWidth = Math.round(clientWidth * dpr);
      const scaledHeight = Math.round(clientHeight * dpr);
      if (canvasEl.width === scaledWidth && canvasEl.height === scaledHeight) {
        return true;
      }
      canvasEl.width = scaledWidth;
      canvasEl.height = scaledHeight;
      canvasEl.style.width = `${clientWidth}px`;
      canvasEl.style.height = `${clientHeight}px`;
      rive.resizeToCanvas();
      return true;
    };

    const ensureSized = () => {
      if (!syncCanvasSize()) {
        frameId = requestAnimationFrame(ensureSized);
      }
    };

    frameId = requestAnimationFrame(ensureSized);
    window.addEventListener('resize', syncCanvasSize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', syncCanvasSize);
    };
  }, [rive]);

  if (!isWasmReady || riveFileStatus === 'loading' || riveFileStatus === 'failed') {
    return (
      <Box
        ref={containerRef}
        className="connection-animation"
        style={{ width: '100%', height: '100%' }}
      />
    );
  }

  return (
    <Box
      ref={containerRef}
      className="connection-animation"
      style={{ width: '100%', height: '100%' }}
    >
      <RiveComponent style={{ width: '100%', height: '100%' }} />
    </Box>
  );
});

ConnectionAnimationInner.displayName = 'ConnectionAnimationInner';

const ConnectionAnimation = forwardRef<
  ConnectionAnimationHandle,
  ConnectionAnimationProps
>(({ iconUrl, onConnectedAnimationComplete }, ref) => {
  const { isWasmReady, error: wasmError } = useRiveWasmContext();
  const {
    buffer,
    error: bufferError,
    loading: bufferLoading,
  } = useRiveWasmFile(CONNECTION_RIV_URL);

  useEffect(() => {
    if (wasmError) {
      console.error('[ConnectionAnimation] Failed to load WASM:', wasmError);
    }
    if (bufferError) {
      console.error('[ConnectionAnimation] Failed to load buffer:', bufferError);
    }
  }, [wasmError, bufferError]);

  if (!isWasmReady || bufferLoading || !buffer) {
    return (
      <Box
        className="connection-animation"
        style={{ width: '100%', height: '100%' }}
      />
    );
  }

  return (
    <ConnectionAnimationInner
      ref={ref}
      buffer={buffer}
      iconUrl={iconUrl}
      onConnectedAnimationComplete={onConnectedAnimationComplete}
    />
  );
});

ConnectionAnimation.displayName = 'ConnectionAnimation';

export default ConnectionAnimation;
