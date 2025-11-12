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
import { SHIELD_ICON_ARTBOARD_NAMES, ShieldIconArtboardName } from './types';

const ARTBOARD_FILE_MAP = {
  [SHIELD_ICON_ARTBOARD_NAMES.PROTECTION]: 'shield_icon_protection.riv',
  [SHIELD_ICON_ARTBOARD_NAMES.PRIORITY]: 'shield_icon_priority.riv',
};

const ShieldSubscriptionIconAnimation = ({
  artboardName,
  containerClassName,
  canvasClassName,
}: {
  artboardName: ShieldIconArtboardName;
  containerClassName?: string;
  canvasClassName?: string;
}) => {
  const isTestEnvironment = Boolean(process.env.IN_TEST);
  const context = useRiveWasmContext();
  const { isWasmReady, error: wasmError } = context;
  const {
    buffer,
    error: bufferError,
    loading: bufferLoading,
  } = useRiveWasmFile(
    `./images/riv_animations/${ARTBOARD_FILE_MAP[artboardName]}`,
  );

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
    stateMachines: riveFile ? 'Animate' : undefined,
    autoplay: false,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
  });

  // Trigger the animation start when rive is loaded
  useEffect(() => {
    if (rive && isWasmReady && !bufferLoading && buffer) {
      const inputs = rive.stateMachineInputs('Animate');
      if (inputs) {
        const startTrigger = inputs.find((input) => input.name === 'Start');
        if (startTrigger) {
          startTrigger.fire();
        }
        rive.play();
      }
    }

    return () => {
      if (rive) {
        rive.stop();
      }
    };
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
    return <Box className={containerClassName}></Box>;
  }

  return (
    <Box className={containerClassName}>
      <RiveComponent className={canvasClassName} />
    </Box>
  );
};

export default ShieldSubscriptionIconAnimation;
