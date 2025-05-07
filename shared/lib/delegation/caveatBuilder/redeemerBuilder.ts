import type { Address, Hex } from '../utils';
import { concat, isAddress } from '../utils';
import type { Caveat, DeleGatorEnvironment } from '..';

export const redeemer = 'redeemer';

/**
 * Builds a caveat struct for the RedeemerEnforcer.
 *
 * @param environment - The DeleGator environment.
 * @param redeemers - The addresses which will be allowed as the redeemer.
 * @returns The Caveat.
 * @throws Error if the redeemer address is invalid.
 */
export const redeemerBuilder = (
  environment: DeleGatorEnvironment,
  redeemers: Address[],
): Caveat => {
  if (redeemers.length === 0) {
    throw new Error(
      'Invalid redeemers: must specify at least one redeemer address',
    );
  }

  for (const r of redeemers) {
    if (!isAddress(r)) {
      throw new Error('Invalid redeemers: must be a valid address');
    }
  }

  // The `encode` function from `@metamask/abi-utils` doesn't convert `bytes` to lowercase.
  // However, the `viem` encodeAbiParameters function seems to do it.
  // So we'll do it here to make sure the terms are consistent.
  const terms = concat(redeemers.map((r) => r.toLowerCase() as Hex));

  const {
    caveatEnforcers: { RedeemerEnforcer },
  } = environment;

  return {
    enforcer: RedeemerEnforcer,
    terms,
    args: '0x',
  };
};
