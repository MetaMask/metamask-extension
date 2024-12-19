import { CarouselSlide } from '../../../../shared/constants/app-state';

export type CarouselProps = {
  slides: CarouselSlide[];
  isLoading?: boolean;
  onClose?: (isLastSlide: boolean, id: string) => void;
  onClick?: (id: string) => void;
  onRenderSlides?: (slides: CarouselSlide[]) => void;
};
