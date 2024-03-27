import { BorderColor } from '../../../helpers/constants/design-system';
import { AvatarTokenSize } from '../../component-library';
import type { StyleUtilityProps } from '../../component-library/box';

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface AvatarGroupProps extends StyleUtilityProps {
  /** * Additional class name for the AvatarGroup component */
  className?: string;
  /** * Limit to show only a certain number of tokens and extras in Text */
  limit: number;
  /** * Type of Avatar: Token/Account */
  avatarType?: AvatarType;
  /** * List of Avatar Tokens */
  members: {
    /** * Image of Avatar Token */
    avatarValue: string;
    /** * Symbol of Avatar Token */
    symbol?: string;
  }[];
  /** * Size of Avatar Tokens. For AvatarGroup we are considering AvatarTokenSize.Xs, AvatarTokenSize.Sm, AvatarTokenSize.Md  */
  size?: AvatarTokenSize;
  /** * Border Color of Avatar Tokens */
  borderColor?: BorderColor;
}

export enum AvatarType {
  TOKEN = 'TOKEN',
  ACCOUNT = 'ACCOUNT',
}
