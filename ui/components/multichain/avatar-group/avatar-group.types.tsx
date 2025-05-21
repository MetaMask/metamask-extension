import { BorderColor } from '../../../helpers/constants/design-system';
import { AvatarTokenSize } from '../../component-library/avatar-token/avatar-token.types';
import type { StyleUtilityProps } from '../../component-library/box';

export type AvatarGroupProps = StyleUtilityProps & {
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
  /** * Whether the tag should be displayed as separate text or within an overlay avatar */
  isTagOverlay?: boolean;
};

export enum AvatarType {
  TOKEN = 'TOKEN',
  ACCOUNT = 'ACCOUNT',
  NETWORK = 'NETWORK',
}
