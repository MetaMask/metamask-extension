import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  useRive,
  Layout,
  Fit,
  Alignment,
  useRiveFile,
  StateMachineInput,
} from '@rive-app/react-canvas';
import { Box } from '@metamask/design-system-react';
import {
  useRiveWasmContext,
  useRiveWasmFile,
} from '../../../contexts/rive-wasm';

// State machine and input names as constants
const STATE_MACHINE_NAME = 'shield_banner_illustration';
const INPUT_NAMES = {
  DARK: 'Dark',
  START: 'Start',
} as const;

const ShieldBannerAnimation = ({
  containerClassName,
  canvasClassName,
  isInactive = false,
}: {
  containerClassName?: string;
  canvasClassName?: string;
  isInactive?: boolean;
}) => {
  const context = useRiveWasmContext();
  const { isWasmReady, error: wasmError } = context;
  const {
    buffer,
    error: bufferError,
    loading: bufferLoading,
  } = useRiveWasmFile('./images/riv_animations/shield_banner.riv');

  const inputsRef = useRef<{
    dark?: StateMachineInput;
    start?: StateMachineInput;
  }>({});

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
    stateMachines: riveFile ? 'shield_banner_illustration' : undefined,
    autoplay: false,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
  });

  // Track if animation has been initialized
  const [isInitialized, setIsInitialized] = useState(false);

  // Cache and initialize state machine inputs
  const cacheInputs = useCallback(() => {
    if (!rive) {
      return false;
    }
    const inputs = rive.stateMachineInputs(STATE_MACHINE_NAME);
    if (!inputs) {
      return false;
    }
    inputsRef.current = {
      dark: inputs.find((input) => input.name === INPUT_NAMES.DARK),
      start: inputs.find((input) => input.name === INPUT_NAMES.START),
    };
    return true;
  }, [rive]);

  // Trigger the animation start when rive is loaded
  useEffect(() => {
    const shouldInitialize =
      rive && isWasmReady && !bufferLoading && buffer && !isInitialized;
    if (shouldInitialize && cacheInputs()) {
      const { dark, start } = inputsRef.current;

      // Set the Dark toggle based on current theme
      if (dark) {
        dark.value = isInactive;
      }

      if (start) {
        start.fire();
      }

      rive.play();
      setIsInitialized(true);
    }
  }, [
    rive,
    isWasmReady,
    bufferLoading,
    buffer,
    isInactive,
    isInitialized,
    cacheInputs,
  ]);

  // watch for changes to isInactive and update the dark toggle
  useEffect(() => {
    if (rive && isInitialized) {
      const { dark, start } = inputsRef.current;
      if (dark) {
        dark.value = isInactive;
      }
      if (start) {
        start.fire();
      }
    }
  }, [isInactive, rive, isInitialized]);

  // Don't render Rive component until WASM and buffer are ready to avoid errors
  if (
    !isWasmReady ||
    bufferLoading ||
    !buffer ||
    status === 'loading' ||
    status === 'failed'
  ) {
    return <Box className={containerClassName}></Box>;
  }

  return (
    <Box className={containerClassName}>
      <RiveComponent className={canvasClassName} />
    </Box>
  );
};

export default ShieldBannerAnimation;
