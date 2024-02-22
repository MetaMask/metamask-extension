import {
  BackgroundColor,
  BorderColor,
} from '../../../helpers/constants/design-system';
import type { StyleUtilityProps } from '../../component-library/box';

export interface BadgeStatusProps extends StyleUtilityProps {
  /** * Additional class name for the ImportTokenLink component. */
  className?: string;
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
