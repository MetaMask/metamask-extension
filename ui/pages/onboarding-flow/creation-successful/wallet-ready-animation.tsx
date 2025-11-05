import React, { useEffect } from 'react';
import {
  useRive,
  Layout,
  Fit,
  Alignment,
  useRiveFile,
} from '@rive-app/react-canvas';
import { Box } from '@metamask/design-system-react';
import { useTheme } from '../../../hooks/useTheme';
import { ThemeType } from '../../../../shared/constants/preferences';
import {
  useRiveWasmContext,
  useRiveWasmFile,
} from '../../../contexts/rive-wasm';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function WalletReadyAnimation() {
  const theme = useTheme();
  const isTestEnvironment = Boolean(process.env.IN_TEST);
  const context = useRiveWasmContext();
  const { isWasmReady, error: wasmError } = context;
  const {
    buffer,
    error: bufferError,
    loading: bufferLoading,
  } = useRiveWasmFile('./images/riv_animations/wallet_ready.riv');

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
    stateMachines: riveFile ? 'OnboardingLoader' : undefined,
    autoplay: false,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
  });

  // Trigger the animation start when rive is loaded
  useEffect(() => {
    if (rive && isWasmReady && !bufferLoading && buffer) {
      console.log('rive is loaded', rive);
      const inputs = rive.stateMachineInputs('OnboardingLoader');
      if (inputs) {
        const darkToggle = inputs.find((input) => input.name === 'Dark mode');
        if (darkToggle && theme === ThemeType.dark) {
          darkToggle.value = true;
        } else if (darkToggle) {
          darkToggle.value = false;
        }

        const endTrigger = inputs.find((input) => input.name === 'Only_End');
        if (endTrigger) {
          endTrigger.fire();
        }

        // Play the state machine
        rive.play();
      }
    }
  }, [rive, theme, isWasmReady, bufferLoading, buffer]);

  // Don't render Rive component until WASM and buffer are ready to avoid errors
  if (
    !isWasmReady ||
    bufferLoading ||
    !buffer ||
    status === 'loading' ||
    isTestEnvironment ||
    status === 'failed'
  ) {
    return <Box className="riv-animation__wallet-ready-container"></Box>;
  }

  return (
    <Box className="riv-animation__wallet-ready-container">
      <RiveComponent className="riv-animation__canvas" />
    </Box>
  );
}
