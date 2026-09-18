import type { CarouselSlide } from '../../../../../shared/constants/app-state';
import type { TransitionState } from '../types';

export type StackCardProps = {
  slide: CarouselSlide;
  isCurrentCard: boolean;
  isLastSlide?: boolean;
  isExiting?: boolean;
  transitionState?: TransitionState;
  onSlideClick?: (slideId: string) => boolean | void;
  onTransitionToNextCard?: (slideId: string, isLastSlide: boolean) => void;
  className?: string;
};
