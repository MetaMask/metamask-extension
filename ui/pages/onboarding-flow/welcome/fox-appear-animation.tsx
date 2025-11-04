import React, { useEffect, useState } from 'react';
import {
  useRive,
  useRiveFile,
  Layout,
  Fit,
  Alignment,
} from '@rive-app/react-canvas';
import { Box } from '@metamask/design-system-react';
import { waitForWasmReady } from '../rive-wasm';

type FoxAppearAnimationProps = {
  isLoader: boolean;
  skipTransition: boolean;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function FoxAppearAnimation({
  isLoader = false,
  skipTransition,
}: FoxAppearAnimationProps) {
  const [isWasmReady, setIsWasmReady] = useState(false);
  const [buffer, setBuffer] = useState<ArrayBuffer | undefined>(undefined);

  // Check if WASM is ready (initialized in parent OnboardingFlow)
  useEffect(() => {
    // Wait for WASM to be ready using promise instead of polling
    waitForWasmReady()
      .then(() => {
        console.log('[Rive Fox] WASM is ready');
        setIsWasmReady(true);
      })
      .catch((error) => {
        console.error('[Rive Fox] WASM failed to load:', error);
      });

    return undefined;
  }, []);

  // Fetch the .riv file and convert to ArrayBuffer
  useEffect(() => {
    if (!isWasmReady || buffer) {
      return;
    }

    fetch('./images/riv_animations/fox_appear.riv')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.arrayBuffer();
      })
      .then((arrayBuffer) => {
        // Only set buffer if it has content
        if (arrayBuffer.byteLength > 0) {
          setBuffer(arrayBuffer);
        } else {
          console.warn('[Rive Fox] Empty buffer received, skipping animation');
        }
      })
      .catch((error) => {
        console.error('[Rive Fox] Failed to load .riv file:', error);
      });
  }, [isWasmReady, buffer]);

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
  }, [rive, isLoader, isWasmReady, skipTransition]);

  // Don't render Rive component until ready or if loading/failed
  if (!isWasmReady || status === 'loading' || status === 'failed') {
    if (status === 'failed') {
      console.error('[Rive Fox] Failed to load .riv file');
    }
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
