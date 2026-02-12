import { CarouselSlide } from '../../../../shared/constants/app-state';

// Navigation action types for slides
export type NavigationAction = {
  type: 'external' | 'internal' | 'modal';
  href?: string;
  modal?: string;
  action?: string;
};

// Enhanced carousel slide with navigation
export type EnhancedCarouselSlide = CarouselSlide & {
  navigation?: NavigationAction;
  testID?: string;
  testIDTitle?: string;
  testIDCloseButton?: string;
};

// Main carousel props
export type CarouselProps = {
  slides: CarouselSlide[];
  className?: string;
  isLoading?: boolean;
  onSlideClick?: (slideId: string, navigation?: NavigationAction) => void;
  onEmptyState?: () => void;
  onSlideClose?: (slideId: string, isLastSlide: boolean) => void;
  onRenderSlides?: (slides: CarouselSlide[]) => void;
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
