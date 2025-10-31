import React, { useRef, useEffect, useState } from 'react';
import {
  useRive,
  useRiveFile,
  Layout,
  Fit,
  Alignment,
} from '@rive-app/react-canvas';
import { Box } from '@metamask/design-system-react';
import { useTheme } from '../../../hooks/useTheme';
import { ThemeType } from '../../../../shared/constants/preferences';
import { waitForWasmReady } from '../rive-wasm';

type MetamaskWordMarkAnimationProps = {
  setIsAnimationComplete: (isAnimationComplete: boolean) => void;
  isAnimationComplete: boolean;
  skipTransition: boolean;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function MetamaskWordMarkAnimation({
  setIsAnimationComplete,
  isAnimationComplete,
  skipTransition,
}: MetamaskWordMarkAnimationProps) {
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
        console.log('[Rive] WASM is ready');
        setIsWasmReady(true);
      })
      .catch((error) => {
        console.error('[Rive] WASM failed to load:', error);
        // Could set an error state here if needed
      });

    return undefined;
  }, [isTestEnvironment]);

  // Fetch the .riv file and convert to ArrayBuffer
  useEffect(() => {
    if (!isWasmReady || isTestEnvironment || buffer) {
      return;
    }

    fetch('./images/riv_animations/metamask_wordmark.riv')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.arrayBuffer();
      })
      .then((arrayBuffer) => setBuffer(arrayBuffer))
      .catch((error) => {
        console.error('[Rive] Failed to load .riv file:', error);
      });
  }, [isWasmReady, isTestEnvironment, buffer]);

  // Use the buffer parameter instead of src
  const { riveFile, status } = useRiveFile({
    buffer,
  });

  // Only initialize Rive after WASM is ready and riveFile is loaded
  const { rive, RiveComponent } = useRive({
    riveFile: riveFile ?? undefined,
    stateMachines: riveFile ? 'WordmarkBuildUp' : undefined,
    autoplay: false,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
    onStateChange: (event) => {
      // The event.data contains an array of state names
      if (event.data && Array.isArray(event.data)) {
        // Clear any existing timeout to avoid multiple triggers
        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current);
        }

        // Set a timeout after state change to detect animation completion
        // Adjust this timeout to match your animation's actual duration
        animationTimeoutRef.current = setTimeout(() => {
          if (!isAnimationComplete) {
            setIsAnimationComplete(true);
          }
        }, 1000); // Adjust this based on your animation duration (in milliseconds)
      }
    },
  });

  // Trigger the animation start when rive is loaded and WASM is ready
  useEffect(() => {
    if (rive && isWasmReady) {
      // Get the state machine inputs
      const inputs = rive.stateMachineInputs('WordmarkBuildUp');

      if (inputs) {
        // Set the Dark toggle based on system preference or default to true (dark mode)
        const darkToggle = inputs.find((input) => input.name === 'Dark');
        if (darkToggle && theme === ThemeType.dark) {
          darkToggle.value = true;
        }

        if (skipTransition) {
          const stillTrigger = inputs.find((input) => input.name === 'Still');
          if (stillTrigger) {
            stillTrigger.fire();
          }
        } else {
          const startTrigger = inputs.find((input) => input.name === 'Start');
          if (startTrigger) {
            startTrigger.fire();
          }
        }

        // Play the state machine
        rive.play();
      }
    }

    // Cleanup timeout on unmount
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [rive, theme, isWasmReady, skipTransition]);

  // In test environments, skip animation entirely and show buttons immediately
  // This prevents any Rive initialization and CDN network requests
  useEffect(() => {
    if (isTestEnvironment) {
      console.log('Test environment detected, skipping Rive animation');
      setIsAnimationComplete(true);
    }
  }, [isTestEnvironment, setIsAnimationComplete]);

  // Fallback: Ensure animation completes even if Rive fails to load
  // This handles e2e test scenarios where WASM may be blocked
  useEffect(() => {
    if (!isTestEnvironment && !isAnimationComplete) {
      const fallbackTimeout = setTimeout(() => {
        console.log('Animation fallback timeout triggered');
        setIsAnimationComplete(true);
      }, 3000); // 3 second fallback timeout

      return () => clearTimeout(fallbackTimeout);
    }
    return undefined;
  }, [isTestEnvironment, isAnimationComplete, setIsAnimationComplete]);

  if (isTestEnvironment) {
    return (
      <Box
        className={`riv-animation__wordmark-container riv-animation__wordmark-container--complete`}
      />
    );
  }

  // Don't render Rive component until WASM is ready and file is loaded
  if (!isWasmReady || status === 'loading') {
    return (
      <Box className="riv-animation__wordmark-container">
        {/* Placeholder while WASM loads or file is being fetched */}
      </Box>
    );
  }

  // Handle file loading failure
  if (status === 'failed') {
    console.error('[Rive] Failed to load .riv file');
    // Trigger animation complete to show the UI
    if (!isAnimationComplete) {
      setIsAnimationComplete(true);
    }
    return (
      <Box className="riv-animation__wordmark-container riv-animation__wordmark-container--complete" />
    );
  }

  return (
    <Box
      className={`riv-animation__wordmark-container ${
        isAnimationComplete && !skipTransition
          ? 'riv-animation__wordmark-container--complete'
          : ''
      } ${skipTransition ? 'riv-animation__wordmark-container--skip-transition' : ''} `}
    >
      <RiveComponent className="riv-animation__canvas" />
    </Box>
  );
}
