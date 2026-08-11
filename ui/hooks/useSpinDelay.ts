import { useEffect, useRef, useState } from 'react';

// Adapted from `spin-delay` by Stephan Meijer
// Source: https://github.com/smeijer/spin-delay

export type SpinDelayOptions = {
  delay?: number;
  minDuration?: number;
};

type State = 'idle' | 'delay' | 'display' | 'expire';

const defaultOptions = {
  delay: 300,
  minDuration: 400,
};

/**
 * Defer showing loading so quick operations (e.g. account switching) don't flash a spinner,
 * and pin it briefly once shown so it doesn't flicker out
 * @param loading - Whether the loading state is active
 * @param options - Optional configuration for delay and minimum duration
 * @returns A boolean indicating whether the spinner should be displayed
 */
export function useSpinDelay(loading: boolean, options?: SpinDelayOptions) {
  const { delay, minDuration } = {
    ...defaultOptions,
    ...options,
  };
  const [state, setState] = useState<State>(loading ? 'delay' : 'idle');
  const [prevLoading, setPrevLoading] = useState(loading);
  const delayTimeout = useRef<ReturnType<typeof setTimeout>>();
  const minDurationTimeout = useRef<ReturnType<typeof setTimeout>>();
  const loadingRef = useRef(loading);
  loadingRef.current = loading;

  if (loading !== prevLoading) {
    setPrevLoading(loading);
    if (loading && state === 'idle') {
      setState('delay');
    } else if (!loading && state !== 'display') {
      clearTimeout(delayTimeout.current);
      clearTimeout(minDurationTimeout.current);
      setState('idle');
    }
  }

  useEffect(() => {
    if (state !== 'delay') {
      return undefined;
    }

    clearTimeout(delayTimeout.current);
    delayTimeout.current = setTimeout(() => {
      setState('display');
      minDurationTimeout.current = setTimeout(() => {
        setState(loadingRef.current ? 'expire' : 'idle');
      }, minDuration);
    }, delay);

    return () => {
      clearTimeout(delayTimeout.current);
    };
  }, [state, delay, minDuration]);

  useEffect(
    () => () => {
      clearTimeout(delayTimeout.current);
      clearTimeout(minDurationTimeout.current);
    },
    [],
  );

  return state === 'display' || state === 'expire';
}
