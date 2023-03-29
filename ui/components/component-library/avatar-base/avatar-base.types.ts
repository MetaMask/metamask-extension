import {
  BackgroundColor,
  BorderColor,
  Size,
  TextColor,
} from '../../../helpers/constants/design-system';

export enum AvatarBaseSizes {
  XS = Size.XS,
  SM = Size.SM,
  MD = Size.MD,
  LG = Size.LG,
  XL = Size.XL,
}

export interface AvatarBaseProps {
  size?: AvatarBaseSizes;
  children?: React.ReactNode;
  backgroundColor?: BackgroundColor;
  borderColor?: BorderColor;
  color?: TextColor;
  className?: string;
}
