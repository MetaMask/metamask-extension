import React, { useEffect, useRef } from 'react';
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

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Use the buffer parameter instead of src
  const { riveFile, status } = useRiveFile({
    buffer,
  });

  // Only initialize Rive after WASM is ready and riveFile is loaded
  const { rive, RiveComponent } = useRive({
    riveFile: riveFile ?? undefined,
    stateMachines: riveFile ? 'FoxRaiseUp' : undefined,
    autoplay: false,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.BottomCenter,
    }),
  });

  useEffect(() => {
    if (!rive || !containerRef.current) {
      return undefined;
    }
    const canvasEl = containerRef.current.querySelector('canvas');
    if (!canvasEl) {
      return undefined;
    }
    const syncCanvasSize = () => {
      const container = containerRef.current;
      if (!container) {
        return;
      }
      const { clientWidth, clientHeight } = container;
      const dpr = window.devicePixelRatio || 1;
      const scaledWidth = Math.round(clientWidth * dpr);
      const scaledHeight = Math.round(clientHeight * dpr);
      if (canvasEl.width === scaledWidth && canvasEl.height === scaledHeight) {
        return;
      }
      canvasEl.width = scaledWidth;
      canvasEl.height = scaledHeight;
      canvasEl.style.width = `${clientWidth}px`;
      canvasEl.style.height = `${clientHeight}px`;
      rive.resizeToCanvas();
    };
    syncCanvasSize();
    window.addEventListener('resize', syncCanvasSize);
    return () => window.removeEventListener('resize', syncCanvasSize);
  }, [rive]);

  // Trigger the animation start when rive is loaded and WASM is ready
  useEffect(() => {
    if (rive && isWasmReady && !bufferLoading && buffer) {
      // Get the state machine inputs
      const inputs = rive.stateMachineInputs('FoxRaiseUp');

      if (inputs) {
        // Fire the Start trigger to begin the animation
        // (Fox raises up from bottom of the artboard)
        if (skipTransition) {
          const wiggleTrigger = inputs.find((input) => input.name === 'Wiggle');
          if (wiggleTrigger) {
            wiggleTrigger.fire();
          }
        } else {
          const startTrigger = inputs.find((input) => input.name === 'Start');
          if (startTrigger) {
            startTrigger.fire();
          }
        }

        // Fire the Loader trigger to show loading animation
        // (Fox moves to center and looks left/right with blinks)
        if (isLoader) {
          const loaderTrigger = inputs.find(
            (input) => input.name === 'Loader2',
          );
          if (loaderTrigger) {
            loaderTrigger.fire();
          }
        }

        // Play the state machine
        rive.play();
      }
    }
  }, [rive, isLoader, isWasmReady, skipTransition, bufferLoading, buffer]);

  // Don't render Rive component until ready or if loading/failed
  if (
    !isWasmReady ||
    bufferLoading ||
    !buffer ||
    status === 'loading' ||
    status === 'failed'
  ) {
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
}
