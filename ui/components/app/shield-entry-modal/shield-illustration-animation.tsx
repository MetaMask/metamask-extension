import React, { useEffect, useRef } from 'react';
import {
  useRive,
  Layout,
  Fit,
  Alignment,
  useRiveFile,
} from '@rive-app/react-canvas';
import { Box, twMerge } from '@metamask/design-system-react';
import {
  useRiveWasmContext,
  useRiveWasmFile,
} from '../../../contexts/rive-wasm';

const ShieldIllustrationAnimation = ({
  containerClassName,
  canvasClassName,
}: {
  containerClassName?: string;
  canvasClassName?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const context = useRiveWasmContext();
  const { isWasmReady, error: wasmError } = context;
  const {
    buffer,
    error: bufferError,
    loading: bufferLoading,
  } = useRiveWasmFile('./images/riv_animations/shield_illustration.riv');

  useEffect(() => {
    if (wasmError) {
      console.error('[Rive] Failed to load WASM:', wasmError);
    }
    if (bufferError) {
      console.error('[Rive] Failed to load buffer:', bufferError);
    }
  }, [wasmError, bufferError]);

  // Use the buffer parameter instead of src
  const { riveFile, status } = useRiveFile({
    buffer,
  });

  // Only initialize Rive after WASM is ready to avoid "source file required" error
  // We always need to provide a valid config to useRive (hooks can't be conditional)
  // but we control when to actually render the component
  const { rive, RiveComponent } = useRive({
    riveFile: riveFile ?? undefined,
    stateMachines: riveFile ? 'Shield_Illustration' : undefined,
    autoplay: false,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.BottomCenter,
    }),
  });

  // Trigger the animation start when rive is loaded
  useEffect(() => {
    if (rive && isWasmReady && !bufferLoading && buffer) {
      const inputs = rive.stateMachineInputs('Shield_Illustration');
      if (inputs) {
        const startTrigger = inputs.find((input) => input.name === 'Start');
        if (startTrigger) {
          startTrigger.fire();
        }
        rive.play();
      }
    }
  }, [rive, isWasmReady, bufferLoading, buffer]);

  const canvasReady =
    isWasmReady &&
    !bufferLoading &&
    Boolean(buffer) &&
    status !== 'loading' &&
    status !== 'failed';

  // Rive fits the artboard once. Refit when the modal width changes so the
  // illustration scales instead of being clipped.
  useEffect(() => {
    const element = containerRef.current;
    if (!rive || !canvasReady || !element) {
      return undefined;
    }

    const resize = () => {
      rive.resizeDrawingSurfaceToCanvas();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();

    return () => {
      observer.disconnect();
    };
  }, [canvasReady, rive]);

  return (
    <Box ref={containerRef} className={containerClassName}>
      {canvasReady ? (
        <RiveComponent
          className={twMerge('!h-full !w-full max-w-full', canvasClassName)}
        />
      ) : null}
    </Box>
  );
};

export default ShieldIllustrationAnimation;
