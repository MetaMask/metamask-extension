import type { BoxProps } from '..';

export type Slide = {
  id: string;
  title: string;
  description: string;
  image: string;
  href?: string;
  onClick?: () => void;
};

type CarouselBaseProps = {
  selectedItem?: number;
  showArrows?: boolean;
  onChange?: (index: number) => void;
  showStatus?: boolean;
  autoPlay?: boolean;
  swipeScrollTolerance?: number;
  centerSlidePercentage?: number;
  axis?: 'horizontal' | 'vertical';
  preventMovementUntilSwipeScrollTolerance?: boolean;
  emulateTouch?: boolean;
  centerMode?: boolean;
  swipeable?: boolean;
  className?: string;
  slides: Slide[];
  onClose?: (id: string) => void;
};

export type CarouselProps = Omit<BoxProps<'div'>, 'onChange'> &
  CarouselBaseProps;
