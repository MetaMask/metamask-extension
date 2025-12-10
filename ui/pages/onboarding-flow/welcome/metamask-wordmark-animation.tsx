import React, { useRef, useEffect } from 'react';
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
import {
  useRiveWasmContext,
  useRiveWasmFile,
} from '../../../contexts/rive-wasm';

type MetamaskWordMarkAnimationProps = {
  setIsAnimationComplete: (isAnimationComplete: boolean) => void;
  isAnimationComplete?: boolean;
  skipTransition?: boolean;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function MetamaskWordMarkAnimation({
  setIsAnimationComplete,
  isAnimationComplete = false,
  skipTransition = false,
}: MetamaskWordMarkAnimationProps) {
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const theme = useTheme();
  const context = useRiveWasmContext();
  const { isWasmReady, error: wasmError, setIsAnimationCompleted } = context;
  const {
    buffer,
    error: bufferError,
    loading: bufferLoading,
  } = useRiveWasmFile('./images/riv_animations/metamask_wordmark.riv');

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

  // Trigger the animation start when rive is loaded and WASM is ready
  useEffect(() => {
    if (rive && isWasmReady && !bufferLoading && buffer) {
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
        setIsAnimationCompleted('MetamaskWordMarkAnimation', true);
      }
    };
  }, [
    rive,
    theme,
    isWasmReady,
    skipTransition,
    bufferLoading,
    buffer,
    setIsAnimationCompleted,
  ]);

  // Don't render Rive component until ready or if loading/failed
  if (
    !isWasmReady ||
    bufferLoading ||
    !buffer ||
    status === 'loading' ||
    status === 'failed'
  ) {
    if (status === 'failed') {
      // Trigger animation complete to show the UI
      if (!isAnimationComplete) {
        setIsAnimationComplete(true);
      }
    }
    return (
      <Box
        className={`riv-animation__wordmark-container ${status === 'failed' ? 'riv-animation__wordmark-container--complete' : ''}`}
      />
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
