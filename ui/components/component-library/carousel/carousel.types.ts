export type CarouselSlide = {
  id: string;
  title: string;
  description: string;
  image: string;
  onClick?: () => void;
  href?: string;
  undismissable?: boolean;
};

export type CarouselProps = {
  slides: CarouselSlide[];
  selectedItem?: number;
  showArrows?: boolean;
  showStatus?: boolean;
  autoPlay?: boolean;
  axis?: 'horizontal' | 'vertical';
  centerMode?: boolean;
  swipeable?: boolean;
  swipeScrollTolerance?: number;
  centerSlidePercentage?: number;
  isLoading?: boolean;
  onClose?: (id: string) => void;
};
