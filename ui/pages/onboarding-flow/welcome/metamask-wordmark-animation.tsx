import React, { useRef, useEffect, useState } from 'react';
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas';
import { Box } from '@metamask/design-system-react';
import { useTheme } from '../../../hooks/useTheme';
import { ThemeType } from '../../../../shared/constants/preferences';
import { isWasmReady as checkWasmReady } from '../rive-wasm';

type MetamaskWordMarkAnimationProps = {
  setIsAnimationComplete: (isAnimationComplete: boolean) => void;
  isAnimationComplete: boolean;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function MetamaskWordMarkAnimation({
  setIsAnimationComplete,
  isAnimationComplete,
}: MetamaskWordMarkAnimationProps) {
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
      console.log('[Rive] WASM already ready from parent initialization');
      setIsWasmReady(true);
      return undefined;
    }

    // Poll for WASM readiness if not ready yet
    const checkInterval = setInterval(() => {
      if (checkWasmReady()) {
        console.log('[Rive] WASM became ready');
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
    src: isWasmReady
      ? './images/riv_animations/metamask_wordmark.riv'
      : undefined,
    stateMachines: isWasmReady ? 'WordmarkBuildUp' : undefined,
    enableRiveAssetCDN: !isTestEnvironment,
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

        // Fire the Start trigger to begin the animation
        const startTrigger = inputs.find((input) => input.name === 'Start');
        if (startTrigger) {
          startTrigger.fire();

          // Play the state machine
          rive.play();
        }
      }
    }

    // Cleanup timeout on unmount
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [rive, theme, isWasmReady]);

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

  // Don't render Rive component until WASM is ready to avoid "source file required" error
  if (!isWasmReady) {
    return (
      <Box className="riv-animation__wordmark-container">
        {/* Placeholder while WASM loads */}
      </Box>
    );
  }

  return (
    <Box
      className={`riv-animation__wordmark-container ${
        isAnimationComplete ? 'riv-animation__wordmark-container--complete' : ''
      }`}
    >
      <RiveComponent className="riv-animation__canvas" />
    </Box>
  );
}
