import { Size } from '../../../helpers/constants/design-system';

export enum AvatarAccountVariant {
  Jazzicon = 'jazzicon',
  Blockies = 'blockies',
}

export enum AvatarAccountSize {
  Xs = Size.XS,
  Sm = Size.SM,
  Md = Size.MD,
  Lg = Size.LG,
  Xl = Size.XL,
}

export const AvatarAccountDiameter = {
  [AvatarAccountSize.Xs]: 16,
  [AvatarAccountSize.Sm]: 24,
  [AvatarAccountSize.Md]: 32,
  [AvatarAccountSize.Lg]: 40,
  [AvatarAccountSize.Xl]: 48,
} as const;
