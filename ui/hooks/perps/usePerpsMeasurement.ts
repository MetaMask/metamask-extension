import { useEffect, useRef } from 'react';

/**
 * Measures the time from component mount to when data becomes ready
 * and reports it as a Sentry custom measurement.
 *
 * Intended for tracking screen load performance on key Perps views.
 * Fires once per component lifecycle -- subsequent `isReady` changes
 * after the first `true` are ignored.
 *
 * @param measurementName - Sentry measurement name (e.g. 'PerpsTabLoaded').
 * @param isReady - Set to `true` once the view's primary data has loaded.
 */
export function usePerpsMeasurement(
  measurementName: string,
  isReady: boolean,
): void {
  const mountTimeRef = useRef<number>(performance.now());
  const hasReportedRef = useRef(false);

  useEffect(() => {
    if (isReady && !hasReportedRef.current) {
      hasReportedRef.current = true;
      const duration = performance.now() - mountTimeRef.current;
      globalThis.sentry?.setMeasurement?.(
        measurementName,
        duration,
        'millisecond',
      );
    }
  }, [isReady, measurementName]);
}
