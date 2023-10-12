import { AvatarTokenSize } from '../../component-library';
import type { StyleUtilityProps } from '../../component-library/box';

export interface AvatarGroupProps extends StyleUtilityProps {
  /** * Additional class name for the ImportTokenLink component. */
  className?: string;
  limit: number;
  members: {
    label: string;
    src?: string;
    size?: string;
  }[];
  size?: AvatarTokenSize;
}
