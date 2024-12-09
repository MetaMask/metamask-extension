import type { BoxProps } from '../box';

export type CarouselProps = BoxProps<'div'> & {
  slides?: {
    id: string;
    title: string;
    description: string;
    image: string;
    href?: string;
    undismissable?: boolean;
    onClick?: () => void;
  }[];
  isLoading?: boolean;
  onClose?: (id: string) => void;
};
