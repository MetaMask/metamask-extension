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
  const [state, setState] = useState<State>('idle');
  const timeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (loading && state === 'idle') {
      clearTimeout(timeout.current);

      timeout.current = setTimeout(() => {
        timeout.current = setTimeout(() => setState('expire'), minDuration);
        setState('display');
      }, delay);

      setState('delay');
    }

    if (!loading && state !== 'display') {
      clearTimeout(timeout.current);
      setState('idle');
    }
  }, [loading, state, delay, minDuration]);

  useEffect(() => () => clearTimeout(timeout.current), []);

  return state === 'display' || state === 'expire';
}
