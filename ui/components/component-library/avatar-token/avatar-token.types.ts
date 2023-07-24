import { AvatarBaseProps } from '../avatar-base';

export enum AvatarTokenSize {
  Xs = 'xs',
  Sm = 'sm',
  Md = 'md',
  Lg = 'lg',
  Xl = 'xl',
}

/**
 * Props for the AvatarToken component
 */
export interface AvatarTokenProps extends Omit<AvatarBaseProps, 'children'> {
  /**
   * The name accepts the string to render the first letter of the AvatarToken. This will be used as the fallback display if no image url is passed to the src
   */
  name?: string;
  /**
   * The src accepts the string of the image to be rendered
   */
  src?: string;
  /**
   * The showHalo accepts a boolean prop to render the image with halo effect
   */
  showHalo?: boolean;
  /**
   * The size of the AvatarToken.
   * Possible values could be 'AvatarTokenSize.Xs' 16px, 'AvatarTokenSize.Sm' 24px, 'AvatarTokenSize.Md' 32px, 'AvatarTokenSize.Lg' 40px, 'AvatarTokenSize.Xl' 48px
   * Defaults to AvatarTokenSize.Md
   */
  size?: AvatarTokenSize;
}
