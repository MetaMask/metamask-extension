import type { CarouselSlide } from '../../../../../shared/constants/app-state';
import type { NavigationAction, TransitionState } from '../types';

export type StackCardProps = {
  slide: CarouselSlide;
  isCurrentCard: boolean;
  isLastSlide?: boolean;
  isExiting?: boolean;
  transitionState?: TransitionState;
  onSlideClick?: (slideId: string, navigation?: NavigationAction) => void;
  onTransitionToNextCard?: (slideId: string, isLastSlide: boolean) => void;
  className?: string;
};
