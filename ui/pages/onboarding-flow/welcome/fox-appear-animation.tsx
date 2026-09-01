import React, { useEffect, useMemo, useRef } from 'react';
import {
  useRive,
  useRiveFile,
  Layout,
  Fit,
  Alignment,
} from '@rive-app/react-canvas';
import { Box } from '@metamask/design-system-react';
import {
  useRiveWasmContext,
  useRiveWasmFile,
} from '../../../contexts/rive-wasm';

type FoxAppearAnimationProps = {
  isLoader?: boolean;
  skipTransition?: boolean;
};

type FoxAppearAnimationInnerProps = FoxAppearAnimationProps & {
  buffer: ArrayBuffer;
};

/**
 * Mount Rive only after .riv bytes exist. Keep Start/play independent of the
 * canvas node — requiring canvas before play skipped the raise-up entirely
 * when the canvas was not queryable on the first effect pass.
 *
 * @param options0
 * @param options0.buffer
 * @param options0.isLoader
 * @param options0.skipTransition
 */
const FoxAppearAnimationInner = ({
  buffer,
  isLoader = false,
  skipTransition = false,
}: FoxAppearAnimationInnerProps) => {
  const { isWasmReady } = useRiveWasmContext();
  const containerRef = useRef<HTMLDivElement>(null);
  // Copy so Rive cannot detach the shared module-cache ArrayBuffer.
  const riveBuffer = useMemo(() => buffer.slice(0), [buffer]);

  const { riveFile, status } = useRiveFile({
    buffer: riveBuffer,
  });

  const { rive, RiveComponent } = useRive({
    riveFile: riveFile ?? undefined,
    stateMachines: riveFile ? 'FoxRaiseUp' : undefined,
    autoplay: false,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: isLoader ? Alignment.Center : Alignment.BottomCenter,
    }),
  });

  // Start the raise-up as soon as the runtime is ready. Do not gate on canvas.
  useEffect(() => {
    if (!rive || !isWasmReady) {
      return undefined;
    }

    let cancelled = false;

    const startAnimation = () => {
      if (cancelled) {
        return;
      }

      const inputs = rive.stateMachineInputs('FoxRaiseUp');
      if (!inputs) {
        // Inputs can lag one frame behind `rive` after createRoot remounts.
        requestAnimationFrame(startAnimation);
        return;
      }

      if (skipTransition) {
        inputs.find((input) => input.name === 'Wiggle')?.fire();
      } else {
        inputs.find((input) => input.name === 'Start')?.fire();
      }

      if (isLoader) {
        inputs.find((input) => input.name === 'Loader2')?.fire();
      }

      rive.play();
    };

    startAnimation();

    return () => {
      cancelled = true;
    };
  }, [rive, isLoader, isWasmReady, skipTransition]);

  // Resize independently so it cannot block or re-order Start/play.
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

    // Wait a frame so Start/play can begin before the first bitmap clear.
    frameId = requestAnimationFrame(ensureSized);
    window.addEventListener('resize', syncCanvasSize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', syncCanvasSize);
    };
  }, [rive]);

  if (status === 'loading' || status === 'failed') {
    return (
      <Box
        className={`${isLoader ? 'riv-animation__fox-container--loader' : 'riv-animation__fox-container'}`}
      >
        {isLoader && (
          <img
            data-testid="loading-indicator"
            className="riv-animation__spinner"
            src="./images/spinner.gif"
            alt=""
          />
        )}
      </Box>
    );
  }

  return (
    <Box
      ref={containerRef}
      className={`${isLoader ? 'riv-animation__fox-container--loader' : 'riv-animation__fox-container'}`}
    >
      <RiveComponent className="riv-animation__canvas" />
      {isLoader && (
        <img
          data-testid="loading-indicator"
          className="riv-animation__spinner"
          src="./images/spinner.gif"
          alt=""
        />
      )}
    </Box>
  );
};

export default function FoxAppearAnimation({
  isLoader = false,
  skipTransition = false,
}: FoxAppearAnimationProps) {
  const context = useRiveWasmContext();
  const { isWasmReady, error: wasmError } = context;
  const {
    buffer,
    error: bufferError,
    loading: bufferLoading,
  } = useRiveWasmFile('./images/riv_animations/fox_appear.riv');

  useEffect(() => {
    if (wasmError) {
      console.error(
        '[Rive - FoxAppearAnimation] Failed to load WASM:',
        wasmError,
      );
    }
    if (bufferError) {
      console.error(
        '[Rive - FoxAppearAnimation] Failed to load buffer:',
        bufferError,
      );
    }
  }, [wasmError, bufferError]);

  if (!isWasmReady || bufferLoading || !buffer) {
    return (
      <Box
        className={`${isLoader ? 'riv-animation__fox-container--loader' : 'riv-animation__fox-container'}`}
      >
        {isLoader && (
          <img
            data-testid="loading-indicator"
            className="riv-animation__spinner"
            src="./images/spinner.gif"
            alt=""
          />
        )}
      </Box>
    );
  }

  return (
    <FoxAppearAnimationInner
      buffer={buffer}
      isLoader={isLoader}
      skipTransition={skipTransition}
    />
  );
}
