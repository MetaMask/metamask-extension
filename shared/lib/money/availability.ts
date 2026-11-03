import type { Hex } from '@metamask/utils';

/**
 * Whether this user has a usable Money Account, and its address when they do.
 */
export type MoneyAccountAvailability =
  | { isAvailable: true; address: Hex }
  | { isAvailable: false };
