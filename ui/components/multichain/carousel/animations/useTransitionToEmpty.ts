import { useState, useCallback, useEffect, useRef } from 'react';
import { ANIMATION_TIMINGS } from './animationTimings';

type UseTransitionToEmptyProps = {
  onEmptyStateComplete: () => void;
};

/**
 * Hook for managing transition to empty state and fold-up animation
 * Encapsulates the timing sequence: appear → pause → fold → complete
 *
 * @param props - Configuration object for the empty state transition
 * @param props.onEmptyStateComplete - Callback when empty state animation completes
 * @returns Object with state and control functions for empty state animation
 */
export const useTransitionToEmpty = ({
  onEmptyStateComplete,
}: UseTransitionToEmptyProps) => {
  const [emptyStatePhase, setEmptyStatePhase] = useState<
    'hidden' | 'showing' | 'folding' | 'complete'
  >('hidden');

  const foldTimeoutRef = useRef<NodeJS.Timeout>();
  const onEmptyStateCompleteRef = useRef(onEmptyStateComplete);

  // Keep the latest callback for the fold timer. Writing the ref during
  // render is what react-hooks/refs rejects; an effect is allowed, and the
  // timer is long enough that this lands before it fires.
  useEffect(() => {
    onEmptyStateCompleteRef.current = onEmptyStateComplete;
  }, [onEmptyStateComplete]);

  const triggerFoldAnimation = useCallback(() => {
    setEmptyStatePhase('folding');

    // Complete after fold animation
    foldTimeoutRef.current = setTimeout(() => {
      setEmptyStatePhase('complete');
      onEmptyStateCompleteRef.current();
    }, ANIMATION_TIMINGS.EMPTY_STATE_DURATION);
  }, []);

  const startEmptyStateSequence = useCallback(() => {
    setEmptyStatePhase('showing');
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (foldTimeoutRef.current) {
        clearTimeout(foldTimeoutRef.current);
      }
    };
  }, []);

  // Hold the caught-up message long enough to paint, then fold. A new
  // callback identity must not restart this timer — the home screen
  // re-renders while the message is up.
  useEffect(() => {
    if (emptyStatePhase === 'showing') {
      const stabilizationTimer = setTimeout(() => {
        triggerFoldAnimation();
      }, 100);

      return () => clearTimeout(stabilizationTimer);
    }
    return undefined;
  }, [emptyStatePhase, triggerFoldAnimation]);

  const resetEmptyState = useCallback(() => {
    setEmptyStatePhase('hidden');
  }, []);

  return {
    emptyStatePhase,
    startEmptyStateSequence,
    triggerFoldAnimation,
    resetEmptyState,
    isEmptyStateVisible:
      emptyStatePhase === 'showing' || emptyStatePhase === 'folding',
    isEmptyStateFolding: emptyStatePhase === 'folding',
  };
};
