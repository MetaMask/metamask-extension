import type { Hex } from '@metamask/utils';

/**
 * Whether this user has a usable Money Account, and its address when they do.
 *
 * The background answer to "should the Money surface be shown at all", produced
 * by `MoneyAccountAvailabilityService` and consumed in the UI by
 * `useMoneyAccountInfo`. It lives in `shared` because it is the contract
 * between the two, not an implementation detail of either.
 *
 * The address is only present in the available case: when the account is
 * unavailable the entire Money surface is hidden, so there is nothing for a
 * caller to render it against. Callers get one answer rather than a flag per
 * input to recombine, and no second round trip for the address.
 */
export type MoneyAccountAvailability =
  | { isAvailable: true; address: Hex }
  | { isAvailable: false };
