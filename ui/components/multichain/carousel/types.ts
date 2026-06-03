import type { CarouselSlide } from '../../../../shared/constants/app-state';

// Main carousel props
export type CarouselProps = {
  slides: CarouselSlide[];
  className?: string;
  isLoading?: boolean;
  onSlideClick?: (slideId: string) => boolean | void;
  onEmptyState?: () => void;
  onSlideClose?: (slideId: string, isLastSlide: boolean) => void;
  onActiveSlideChange?: (slide: CarouselSlide) => void;
};

// Carousel state management
export type CarouselState = {
  activeSlideIndex: number;
  isTransitioning: boolean;
  hasTriggeredEmptyState: boolean;
};

// Transition states for animations
export type TransitionState = 'entering' | 'entered' | 'exiting' | 'exited';

// Props for the carousel wrapper
export type CarouselWithEmptyStateProps = CarouselProps & {
  onComplete?: () => void;
};
