<<<<<<< HEAD
import {
  BackgroundColor,
  BorderColor,
} from '../../../helpers/constants/design-system';
=======
import { BackgroundColor, BorderColor } from 'ui/helpers/constants/design-system';
>>>>>>> f7380e849e (converted components to typescript)
import type { StyleUtilityProps } from '../../component-library/box';

export interface BadgeStatusProps extends StyleUtilityProps {
  /** * Additional class name for the ImportTokenLink component. */
  className?: string;
<<<<<<< HEAD
  /**
   * Border color based on the connection status
   */
  badgeBorderColor?: BorderColor;
  /**
   * Background Color of Badge
   */
  badgeBackgroundColor?: BackgroundColor;
  /**
   * Connection status message on Tooltip
   */
  text: string;
  /**
   * To determine connection status
   */
  isConnectedAndNotActive: boolean;
  /**
   * Address for AvatarAccount
   */
  address: string;
}
=======
    /**
   * Border color based on the connection status
   */
  badgeBorderColor?: BorderColor,
  /**
   * Background Color of Badge
   */
  badgeBackgroundColor?: BackgroundColor,
  /**
   * Connection status message on Tooltip
   */
  text: string,
  /**
   * To determine connection status
   */
  isConnectedAndNotActive: boolean,
  /**
   * Address for AvatarAccount
   */
  address: string,
}
>>>>>>> f7380e849e (converted components to typescript)
