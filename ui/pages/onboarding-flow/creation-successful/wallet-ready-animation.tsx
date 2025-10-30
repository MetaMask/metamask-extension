import React, { useEffect, useState } from 'react';
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
import { waitForWasmReady } from '../rive-wasm';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function WalletReadyAnimation() {
  const theme = useTheme();
  const isTestEnvironment = Boolean(process.env.IN_TEST);
  const [isWasmReady, setIsWasmReady] = useState(isTestEnvironment);
  const [buffer, setBuffer] = useState<ArrayBuffer | undefined>(undefined);

  // Check if WASM is ready (initialized in parent OnboardingFlow)
  useEffect(() => {
    if (isTestEnvironment) {
      setIsWasmReady(true);
      return undefined;
    }

    // Wait for WASM to be ready using promise instead of polling
    waitForWasmReady()
      .then(() => {
        console.log('[Rive Fox] WASM is ready');
        setIsWasmReady(true);
      })
      .catch((error) => {
        console.error('[Rive Fox] WASM failed to load:', error);
        // Could set an error state here if needed
      });

    return undefined;
  }, [isTestEnvironment]);

  // Fetch the .riv file and convert to ArrayBuffer
  useEffect(() => {
    if (!isWasmReady || isTestEnvironment || buffer) {
      return;
    }

    fetch('./images/riv_animations/wallet_ready.riv')
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => setBuffer(arrayBuffer))
      .catch((error) => {
        console.error('[Rive Fox] Failed to load .riv file:', error);
      });
  }, [isWasmReady, isTestEnvironment, buffer]);

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
    if (rive && isWasmReady) {
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
  }, [rive, theme, isWasmReady]);

  // Don't render Rive component until WASM is ready to avoid "source file required" error
  if (!isWasmReady || status === 'loading') {
    return <Box className="riv-animation__wallet-ready-container"></Box>;
  }

  return (
    <Box className="riv-animation__wallet-ready-container">
      <RiveComponent className="riv-animation__canvas" />
    </Box>
  );
}
