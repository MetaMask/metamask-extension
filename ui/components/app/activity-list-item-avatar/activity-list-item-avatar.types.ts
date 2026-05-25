import type { Hex } from '@metamask/utils';

export type ResolvedActivityToken = {
  symbol: string;
  address: string;
  chainId: Hex;
  imageUrl?: string;
  // Display name for when imageUrl is missing or fails to load
  fallbackName: string;
};

export type ActivityListItemAvatarConfig =
  | { variant: 'single'; token: ResolvedActivityToken }
  | {
      variant: 'dual';
      /** Source token (left) */
      from: ResolvedActivityToken;
      /** Destination token (right) */
      to: ResolvedActivityToken;
    };
