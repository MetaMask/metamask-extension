import { useCallback, useEffect, useRef } from 'react';
import { ANIMATION_TIMINGS } from './animationTimings';

type UseTransitionToNextCardProps = {
  onSlideRemove: (slideId: string, isLastSlide: boolean) => void;
  isTransitioning: boolean;
  setIsTransitioning: (transitioning: boolean) => void;
};

/**
 * Hook for managing transition from current card to next card
 * Encapsulates the animation timing and state management
 *
 * @param props - Configuration object for the transition hook
 * @param props.onSlideRemove - Callback to remove a slide
 * @param props.isTransitioning - Current transition state
 * @param props.setIsTransitioning - Function to update transition state
 * @returns Object containing transition function and current state
 */
export const useTransitionToNextCard = ({
  onSlideRemove,
  isTransitioning,
  setIsTransitioning,
}: UseTransitionToNextCardProps) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const transitionToNextCard = useCallback(
    (slideId: string, isLastSlide: boolean) => {
      if (isTransitioning) {
        return;
      }

      setIsTransitioning(true);

      // Remove the slide immediately - TransitionGroup will handle smooth animations
      onSlideRemove(slideId, isLastSlide);

      // Reset transition state after animation completes
      timeoutRef.current = setTimeout(() => {
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
