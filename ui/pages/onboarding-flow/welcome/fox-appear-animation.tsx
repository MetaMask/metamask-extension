import React, { useEffect, useState } from 'react';
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas';
import { Box } from '@metamask/design-system-react';
import { isWasmReady as checkWasmReady } from '../rive-wasm';

type FoxAppearAnimationProps = {
  isLoader: boolean;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function FoxAppearAnimation({
  isLoader = false,
}: FoxAppearAnimationProps) {
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
      console.log('[Rive Fox] WASM already ready from parent initialization');
      setIsWasmReady(true);
      return undefined;
    }

    // Poll for WASM readiness if not ready yet
    const checkInterval = setInterval(() => {
      if (checkWasmReady()) {
        console.log('[Rive Fox] WASM became ready');
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
    src: isWasmReady ? './images/riv_animations/fox_appear.riv' : undefined,
    stateMachines: isWasmReady ? 'FoxRaiseUp' : undefined,
    enableRiveAssetCDN: !isTestEnvironment,
    autoplay: false,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
  });

  // Trigger the animation start when rive is loaded and WASM is ready
  useEffect(() => {
    if (rive && isWasmReady) {
      // Get the state machine inputs
      const inputs = rive.stateMachineInputs('FoxRaiseUp');

      if (inputs) {
        // Fire the Start trigger to begin the animation
        // (Fox raises up from bottom of the artboard)
        const startTrigger = inputs.find((input) => input.name === 'Start');
        if (startTrigger) {
          startTrigger.fire();
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
  }, [rive, isLoader, isWasmReady]);

  // In test environments, skip animation entirely to avoid CDN network requests
  if (isTestEnvironment) {
    return (
      <Box
        className={`${isLoader ? 'riv-animation__fox-container--loader' : 'riv-animation__fox-container'}`}
      >
        {isLoader && <Box className="riv-animation__spinner" />}
      </Box>
    );
  }

  // Don't render Rive component until WASM is ready to avoid "source file required" error
  if (!isWasmReady) {
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
