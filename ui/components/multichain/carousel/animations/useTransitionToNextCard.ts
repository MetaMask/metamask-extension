import { useCallback } from 'react';
import { ANIMATION_TIMINGS } from './animationTimings';

interface UseTransitionToNextCardProps {
  onSlideRemove: (slideId: string, isLastSlide: boolean) => void;
  isTransitioning: boolean;
  setIsTransitioning: (transitioning: boolean) => void;
}

/**
 * Hook for managing transition from current card to next card
 * Encapsulates the animation timing and state management
 */
export const useTransitionToNextCard = ({
  onSlideRemove,
  isTransitioning,
  setIsTransitioning,
}: UseTransitionToNextCardProps) => {
  const transitionToNextCard = useCallback(
    (slideId: string, isLastSlide: boolean) => {
      if (isTransitioning) {
        return;
      }

      setIsTransitioning(true);

      // Remove the slide immediately - TransitionGroup will handle smooth animations
      onSlideRemove(slideId, isLastSlide);

      // Reset transition state after animation completes
      setTimeout(() => {
        setIsTransitioning(false);
      }, ANIMATION_TIMINGS.CARD_EXIT_DURATION + 50); // Small buffer for animation completion
    },
    [onSlideRemove, isTransitioning, setIsTransitioning],
  );

  return {
    transitionToNextCard,
    isTransitioning,
  };
};
