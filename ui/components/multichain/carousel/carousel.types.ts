export type CarouselSlide = {
  id: string;
  title: string;
  description: string;
  image: string;
  onClick?: () => void;
  dismissed?: boolean;
  href?: string;
  undismissable?: boolean;
};

export type CarouselProps = {
  slides: CarouselSlide[];
  isLoading?: boolean;
  onClose?: (id: string) => void;
  onClick?: (id: string) => void;
};
