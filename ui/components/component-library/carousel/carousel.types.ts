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
  isLoading?: boolean;
  onClose?: (id: string) => void;
};
