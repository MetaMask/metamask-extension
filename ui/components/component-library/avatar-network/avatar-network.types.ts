import { AvatarBaseSize } from '../avatar-base/avatar-base.types';
import { ValidTag } from '../text/text.types';
import type { BoxProps } from '../../ui/box/box.d';
import {
  BackgroundColor,
  BorderColor,
  TextColor,
} from 'ui/helpers/constants/design-system';

/**
 * Props for the AvatarNetwork component
 */
export interface AvatarNetworkProps extends BoxProps {
  /**
   * The name accepts the string to render the first alphabet of the Avatar Name
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
   * The size of the AvatarNetwork
   * Possible values could be AvatarBaseSize.Xs(16px), AvatarBaseSize.Sm(24px), AvatarBaseSize.Md(32px), AvatarBaseSize.Lg(40px), AvatarBaseSize.Xl(48px)
   * Defaults to AvatarBaseSize.Md
   */
  size?: AvatarBaseSize;
  /**
   * The background color of the AvatarNetwork
   * Defaults to BackgroundColor.backgroundAlternative
   */
  backgroundColor?: BackgroundColor;
  /**
   * The background color of the AvatarNetwork
   * Defaults to BorderColor.borderDefault
   */
  borderColor?: BorderColor;
  /**
   * The color of the text inside the AvatarNetwork
   * Defaults to TextColor.textDefault
   */
  color?: TextColor;
  /**
   * Additional classNames to be added to the AvatarNetwork
   */
  className?: string;
  /**
   * Changes the root html element tag of the Text component.
   */
  as?: ValidTag;
}
