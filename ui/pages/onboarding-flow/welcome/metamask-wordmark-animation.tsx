import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  useRive,
  useRiveFile,
  Layout,
  Fit,
  Alignment,
  StateMachineInput,
} from '@rive-app/react-canvas';
import { Box } from '@metamask/design-system-react';
import classnames from 'classnames';
import { useTheme } from '../../../hooks/useTheme';
import { ThemeType } from '../../../../shared/constants/preferences';
import {
  useRiveWasmContext,
  useRiveWasmFile,
} from '../../../contexts/rive-wasm';

type MetamaskWordMarkAnimationProps = {
  setIsAnimationComplete: (isAnimationComplete: boolean) => void;
  isAnimationComplete?: boolean;
  skipTransition?: boolean;
};

// State machine and input names as constants
const STATE_MACHINE_NAME = 'WordmarkBuildUp';
const INPUT_NAMES = {
  DARK: 'Dark',
  STILL: 'Still',
  START: 'Start',
} as const;

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function MetamaskWordMarkAnimation({
  setIsAnimationComplete,
  isAnimationComplete = false,
  skipTransition = false,
}: MetamaskWordMarkAnimationProps) {
  const theme = useTheme();
  const context = useRiveWasmContext();
  const { isWasmReady, error: wasmError, setIsAnimationCompleted } = context;
  const {
    buffer,
    error: bufferError,
    loading: bufferLoading,
  } = useRiveWasmFile('./images/riv_animations/metamask_wordmark.riv');

  // Refs grouped together
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevThemeRef = useRef(theme);
  const inputsRef = useRef<{
    dark?: StateMachineInput;
    still?: StateMachineInput;
    start?: StateMachineInput;
  }>({});

  useEffect(() => {
    if (wasmError) {
      console.error(
        '[Rive - MetamaskWordMarkAnimation] Failed to load WASM:',
        wasmError,
      );
      setIsAnimationComplete(true);
    }
    if (bufferError) {
      console.error(
        '[Rive - MetamaskWordMarkAnimation] Failed to load buffer:',
        bufferError,
      );
      setIsAnimationComplete(true);
    }
  }, [wasmError, bufferError, setIsAnimationComplete]);

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
      still: inputs.find((input) => input.name === INPUT_NAMES.STILL),
      start: inputs.find((input) => input.name === INPUT_NAMES.START),
    };
    return true;
  }, [rive]);

  // Trigger the animation start when rive is loaded and WASM is ready (only once)
  useEffect(() => {
    const shouldInitialize =
      rive && isWasmReady && !bufferLoading && buffer && !isInitialized;

    if (shouldInitialize && cacheInputs()) {
      const { dark, still, start } = inputsRef.current;

      // Set the Dark toggle based on current theme
      if (dark) {
        dark.value = theme === ThemeType.dark;
      }

      prevThemeRef.current = theme;

      // Fire the appropriate trigger
      if (skipTransition) {
        still?.fire();
      } else {
        start?.fire();
      }

      // Play the state machine
      rive.play();
      setIsInitialized(true);
    }

    // Cleanup timeout on unmount
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        setIsAnimationCompleted('MetamaskWordMarkAnimation', true);
      }
    };
  }, [
    rive,
    isWasmReady,
    skipTransition,
    bufferLoading,
    buffer,
    isInitialized,
    theme,
    cacheInputs,
    setIsAnimationCompleted,
  ]);

  // Handle theme changes after initialization (update dark toggle without re-triggering animation)
  useEffect(() => {
    if (!rive || !isInitialized || prevThemeRef.current === theme) {
      return;
    }

    const { dark, still } = inputsRef.current;

    if (dark) {
      dark.value = theme === ThemeType.dark;
      // Fire the Still trigger to refresh the visual state with new theme
      still?.fire();
    }

    prevThemeRef.current = theme;
  }, [rive, theme, isInitialized]);

  const isLoading =
    !isWasmReady || bufferLoading || !buffer || status === 'loading';
  const hasFailed = status === 'failed';

  // Trigger animation complete on failure
  useEffect(() => {
    if (hasFailed && !isAnimationComplete) {
      setIsAnimationComplete(true);
    }
  }, [hasFailed, isAnimationComplete, setIsAnimationComplete]);

  // Don't render Rive component until ready or if loading/failed
  if (isLoading || hasFailed) {
    return (
      <Box
        className={classnames('riv-animation__wordmark-container', {
          'riv-animation__wordmark-container--complete': hasFailed,
        })}
      />
    );
  }

  return (
    <Box
      className={classnames('riv-animation__wordmark-container', {
        'riv-animation__wordmark-container--complete':
          isAnimationComplete && !skipTransition,
        'riv-animation__wordmark-container--skip-transition': skipTransition,
      })}
    >
      <RiveComponent className="riv-animation__canvas" />
    </Box>
  );
}
