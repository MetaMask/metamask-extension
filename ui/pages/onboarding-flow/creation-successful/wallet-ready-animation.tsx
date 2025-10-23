import React, { useEffect, useState } from 'react';
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas';
import { Box } from '@metamask/design-system-react';
import { useTheme } from '../../../hooks/useTheme';
import { ThemeType } from '../../../../shared/constants/preferences';
import { isWasmReady as checkWasmReady } from '../rive-wasm';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function WalletReadyAnimation() {
  const theme = useTheme();
  const isTestEnvironment = Boolean(process.env.IN_TEST);
  const [isWasmReady, setIsWasmReady] = useState(isTestEnvironment);

  // Check if WASM is ready (initialized in parent OnboardingFlow)
  useEffect(() => {
    if (isTestEnvironment) {
      setIsWasmReady(true);
      return undefined;
    }

    // Check if WASM is already ready from parent initialization
    if (checkWasmReady()) {
      console.log(
        '[Rive Wallet Ready Loader] WASM already ready from parent initialization',
      );
      setIsWasmReady(true);
      return undefined;
    }

    // Poll for WASM readiness if not ready yet
    const checkInterval = setInterval(() => {
      if (checkWasmReady()) {
        console.log('[Rive Wallet Ready Loader] WASM became ready');
        setIsWasmReady(true);
        clearInterval(checkInterval);
      }
    }, 100); // Check every 100ms

    // Cleanup
    return () => clearInterval(checkInterval);
  }, [isTestEnvironment]);

  // Only initialize Rive after WASM is ready to avoid "source file required" error
  // We always need to provide a valid config to useRive (hooks can't be conditional)
  // but we control when to actually render the component
  const { rive, RiveComponent } = useRive({
    src: isWasmReady ? './images/riv_animations/wallet_ready.riv' : undefined,
    stateMachines: isWasmReady ? 'OnboardingLoader' : undefined,
    enableRiveAssetCDN: !isTestEnvironment,
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
  if (!isWasmReady) {
    return <Box className="riv-animation__wallet-ready-container"></Box>;
  }

  return (
    <Box className="riv-animation__wallet-ready-container">
      <RiveComponent className="riv-animation__canvas" />
    </Box>
  );
}
