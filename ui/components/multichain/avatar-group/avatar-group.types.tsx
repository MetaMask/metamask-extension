import { BorderColor } from '../../../helpers/constants/design-system';
import { AvatarTokenSize } from '../../component-library';
import type { StyleUtilityProps } from '../../component-library/box';

export interface AvatarGroupProps extends StyleUtilityProps {
  /** * Additional class name for the ImportTokenLink component. */
  className?: string;
  /** * Limit to show only a certain number of tokens and extras in Text */
  limit: number;
  /** * List of Avatar Tokens */
  members: {
    label: string;
    src?: string;
    size?: string;
  }[];
  /** * Size of Avatar Tokens */
  size?: AvatarTokenSize;
  /** * Border Color of Avatar Tokens */
  borderColor?: BorderColor;
}
