import React, { useEffect } from 'react';
import {
  useRive,
  Layout,
  Fit,
  Alignment,
  useRiveFile,
} from '@rive-app/react-canvas';
import { Box } from '@metamask/design-system-react';
import {
  useRiveWasmContext,
  useRiveWasmFile,
} from '../../../contexts/rive-wasm';

const ShieldIllustrationAnimation = ({ className }: { className?: string }) => {
  const isTestEnvironment = Boolean(process.env.IN_TEST);
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
      alignment: Alignment.Center,
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

  // Don't render Rive component until WASM and buffer are ready to avoid errors
  if (
    !isWasmReady ||
    bufferLoading ||
    !buffer ||
    status === 'loading' ||
    isTestEnvironment ||
    status === 'failed'
  ) {
    return <Box className="riv-animation__shield-illustration-container"></Box>;
  }

  return (
    <Box
      className={`riv-animation__shield-illustration-container ${className}`}
    >
      <RiveComponent className="riv-animation__canvas" />
    </Box>
  );
};

export default ShieldIllustrationAnimation;
