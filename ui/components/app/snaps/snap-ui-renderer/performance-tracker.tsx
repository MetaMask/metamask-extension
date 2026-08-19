'use no memo';

/* eslint-disable react-hooks/refs -- Intentional render-phase ref updates for perf test instrumentation only. */

import React, { useRef } from 'react';

/**
 * Tracks re-render count via a DOM attribute for perf tests and benchmarks.
 * DO NOT USE IN PRODUCTION — only mount when `PERF_DEBUG` is true.
 */
export const PerformanceTracker = () => {
  const rendersRef = useRef(0);
  rendersRef.current += 1;

  return (
    <span data-testid="performance" data-renders={rendersRef.current} />
  );
};
