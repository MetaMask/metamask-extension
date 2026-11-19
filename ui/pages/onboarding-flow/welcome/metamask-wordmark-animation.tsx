import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import {
  useRive,
  Layout,
  Fit,
  Alignment,
  StateMachineInput,
} from '@rive-app/react-canvas';
import { Box } from '@metamask/design-system-react';
import classnames from 'clsx';
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

const WORDMARK_RIV = './images/riv_animations/metamask_wordmark.riv';
const WORDMARK_FALLBACK_SRC = './images/logo/metamask-fox.svg';

const WordmarkFallback = ({
  isComplete = false,
  skipTransition = false,
}: {
  isComplete?: boolean;
  skipTransition?: boolean;
}) => (
  <Box
    className={classnames('riv-animation__wordmark-container', {
      'riv-animation__wordmark-container--complete':
        isComplete && !skipTransition,
      'riv-animation__wordmark-container--skip-transition': skipTransition,
    })}
    data-testid="metamask-wordmark-fallback"
  >
    <img
      className="riv-animation__canvas"
      src={WORDMARK_FALLBACK_SRC}
      alt="MetaMask"
    />
  </Box>
);

/**
 * Mount useRive only after WASM is ready and the .riv buffer exists.
 * WordmarkFallback covers the loading gap so the container is never empty
 * under createRoot/StrictMode remounts.
 * @param options0
 * @param options0.buffer
 * @param options0.setIsAnimationComplete
 * @param options0.isAnimationComplete
 * @param options0.skipTransition
 */
const MetamaskWordMarkAnimationInner = ({
  buffer,
  setIsAnimationComplete,
  isAnimationComplete = false,
  skipTransition = false,
}: MetamaskWordMarkAnimationProps & { buffer: ArrayBuffer }) => {
  const theme = useTheme();
  const { setIsAnimationCompleted } = useRiveWasmContext();

  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevThemeRef = useRef(theme);
  const inputsRef = useRef<{
    dark?: StateMachineInput;
    still?: StateMachineInput;
    start?: StateMachineInput;
  }>({});
  const isInitializedRef = useRef(false);

  const riveBuffer = useMemo(() => buffer.slice(0), [buffer]);

  const { rive, RiveComponent } = useRive({
    buffer: riveBuffer,
    stateMachines: STATE_MACHINE_NAME,
    autoplay: false,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
    onStateChange: (event) => {
      if (event.data && Array.isArray(event.data)) {
        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current);
        }

        animationTimeoutRef.current = setTimeout(() => {
          if (!isAnimationComplete) {
            setIsAnimationComplete(true);
          }
        }, 1000);
      }
    },
  });

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

  useEffect(() => {
    const shouldInitialize = rive && !isInitializedRef.current;

    if (shouldInitialize && cacheInputs()) {
      const { dark, still, start } = inputsRef.current;

      if (dark) {
        dark.value = theme === ThemeType.dark;
      }

      prevThemeRef.current = theme;

      if (skipTransition) {
        still?.fire();
      } else {
        start?.fire();
      }

      rive.play();
      isInitializedRef.current = true;
    }
  }, [rive, skipTransition, theme, cacheInputs]);

  // Mark the session animation complete only on unmount after it started
  // (timeout was scheduled). Do not mark when `isAnimationComplete` flips on
  // this same visit — that would set skipTransition before FoxAppear mounts
  // and fire Wiggle instead of Start.
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
        setIsAnimationCompleted('MetamaskWordMarkAnimation', true);
      }
    };
  }, [setIsAnimationCompleted]);

  useEffect(() => {
    if (!rive || !isInitializedRef.current || prevThemeRef.current === theme) {
      return;
    }

    const { dark, still } = inputsRef.current;

    if (dark) {
      dark.value = theme === ThemeType.dark;
      still?.fire();
    }

    prevThemeRef.current = theme;
  }, [rive, theme]);

  return (
    <Box
      className={classnames('riv-animation__wordmark-container', {
        'riv-animation__wordmark-container--complete':
          isAnimationComplete && !skipTransition,
        'riv-animation__wordmark-container--skip-transition': skipTransition,
      })}
      data-testid="metamask-wordmark-rive"
    >
      <RiveComponent className="riv-animation__canvas" />
    </Box>
  );
};

export default function MetamaskWordMarkAnimation({
  setIsAnimationComplete,
  isAnimationComplete = false,
  skipTransition = false,
}: MetamaskWordMarkAnimationProps) {
  const { isWasmReady, error: wasmError } = useRiveWasmContext();
  const {
    buffer,
    error: bufferError,
    loading: bufferLoading,
  } = useRiveWasmFile(WORDMARK_RIV);

  const hasFailed = Boolean(wasmError || bufferError);

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

  // Fail open so welcome CTAs are never stuck at opacity: 0 if Rive stalls.
  useEffect(() => {
    if (isAnimationComplete || hasFailed) {
      return undefined;
    }
    const timeoutId = setTimeout(() => {
      setIsAnimationComplete(true);
    }, 3000);
    return () => clearTimeout(timeoutId);
  }, [isAnimationComplete, hasFailed, setIsAnimationComplete]);

  // Keep the fox visible until WASM + buffer are ready. Only mount useRive
  // after both exist so createRoot remounts cannot init against a skipped load.
  if (hasFailed || !isWasmReady || bufferLoading || !buffer) {
    return (
      <WordmarkFallback
        isComplete={isAnimationComplete || hasFailed}
        skipTransition={skipTransition}
      />
    );
  }

  return (
    <MetamaskWordMarkAnimationInner
      buffer={buffer}
      setIsAnimationComplete={setIsAnimationComplete}
      isAnimationComplete={isAnimationComplete}
      skipTransition={skipTransition}
    />
  );
}
