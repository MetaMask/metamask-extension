import { useState, useCallback, useEffect } from 'react';
import { ANIMATION_TIMINGS } from './animationTimings';

interface UseTransitionToEmptyProps {
  onEmptyStateComplete: () => void;
}

/**
 * Hook for managing transition to empty state and fold-up animation
 * Encapsulates the timing sequence: appear → pause → fold → complete
 */
export const useTransitionToEmpty = ({
  onEmptyStateComplete,
}: UseTransitionToEmptyProps) => {
  const [emptyStatePhase, setEmptyStatePhase] = useState<
    'hidden' | 'showing' | 'folding' | 'complete'
  >('hidden');

  const triggerFoldAnimation = useCallback(() => {
    setEmptyStatePhase('folding');

    // Complete after fold animation
    setTimeout(() => {
      setEmptyStatePhase('complete');
      onEmptyStateComplete();
    }, ANIMATION_TIMINGS.EMPTY_STATE_DURATION);
  }, [onEmptyStateComplete]);

  const startEmptyStateSequence = useCallback(() => {
    setEmptyStatePhase('showing');
  }, []);

  // Auto-trigger fold after a brief delay to allow component to stabilize
  useEffect(() => {
    if (emptyStatePhase === 'showing') {
      const stabilizationTimer = setTimeout(() => {
        triggerFoldAnimation();
      }, 100); // Very brief delay just to let the component render properly

      return () => clearTimeout(stabilizationTimer);
    }
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
