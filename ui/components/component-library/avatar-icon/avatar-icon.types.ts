import {
  BackgroundColor,
  BorderColor,
  IconColor,
  TextColor,
} from '../../../helpers/constants/design-system';
import { IconName, IconProps } from '../icon';
import { AvatarBaseSize } from '../avatar-base/avatar-base.types';
import { ValidTag } from '../text/text.types';
import { BoxProps } from 'ui/components/ui/box/box';

export interface AvatarIconProps extends BoxProps {
  /**
   * The name of the icon to display. Should be one of IconName
   */
  iconName: IconName;
  /**
   * Props for the icon inside AvatarIcon. All Icon props can be used
   */
  iconProps?: Omit<IconProps, 'name'> & {
    'data-testid'?: string;
  };
  /**
   * The size of the AvatarIcon
   * Possible values could be 'AvatarBaseSize.Xs' 16px, 'AvatarBaseSize.Sm' 24px, 'AvatarBaseSize.Md' 32px, 'AvatarBaseSize.Lg' 40px, 'AvatarBaseSize.Xl' 48px
   * Defaults to AvatarBaseSize.Md
   */
  size?: AvatarBaseSize;
  /**
   * The background color of the AvatarIcon
   * Defaults to BackgroundColor.primaryMuted
   */
  backgroundColor?: BackgroundColor;
  /**
   * The color of the text inside the AvatarIcon
   * Defaults to TextColor.primaryDefault
   */
  color?: TextColor | IconColor;
  /**
   * Additional classNames to be added to the AvatarIcon
   */
  className?: string;
  /**
   * The background color of the AvatarBase
   * Defaults to Color.borderDefault
   */
  borderColor?: BorderColor;
  /**
   * Changes the root html element tag of the Text component.
   */
  as?: ValidTag;
}
