import {
  BackgroundColor,
  BorderColor,
  TextColor,
} from '../../../helpers/constants/design-system';

export enum AvatarBaseSizes {
  XS = 'xs',
  SM = 'sm',
  MD = 'md',
  LG = 'lg',
  XL = 'xl',
}

export interface AvatarBaseProps {
  size?: AvatarBaseSizes;
  children?: React.ReactNode;
  backgroundColor?: BackgroundColor;
  borderColor?: BorderColor;
  color?: TextColor;
  className?: string;
}
