import { type Address, concat, isAddress } from 'viem';
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

  const terms = concat(redeemers);

  const {
    caveatEnforcers: { RedeemerEnforcer },
  } = environment;

  return {
    enforcer: RedeemerEnforcer,
    terms,
    args: '0x',
  };
};
