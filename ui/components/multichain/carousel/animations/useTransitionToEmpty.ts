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

  const triggerFoldAnimation = useCallback(() => {
    setEmptyStatePhase('folding');

    // Complete after fold animation
    foldTimeoutRef.current = setTimeout(() => {
      setEmptyStatePhase('complete');
      onEmptyStateComplete();
    }, ANIMATION_TIMINGS.EMPTY_STATE_DURATION);
  }, [onEmptyStateComplete]);

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

  // Auto-trigger fold after a brief delay to allow component to stabilize
  useEffect(() => {
    if (emptyStatePhase === 'showing') {
      const stabilizationTimer = setTimeout(() => {
        triggerFoldAnimation();
      }, 100); // Very brief delay just to let the component render properly

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
