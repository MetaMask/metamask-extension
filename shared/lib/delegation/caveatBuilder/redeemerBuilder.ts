import type { Caveat, DeleGatorEnvironment } from '..';
import { type Address, concat, isAddress } from 'viem';

export const redeemer = 'redeemer';

/**
 * Builds a caveat struct for the RedeemerEnforcer.
 *
 * @param environment - The DeleGator environment.
 * @param redeemer[] - The addresses which will be allowed as the redeemer.
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

  for (let i = 0; i < redeemers.length; i++) {
    if (!isAddress(redeemers[i]!)) {
      throw new Error('Invalid redeemers: must be a valid address');
    }
  }

  const terms = concat(redeemers);

  const {
    caveatEnforcers: { RedeemerEnforcer },
  } = environment;

  return {
    enforcer: RedeemerEnforcer!,
    terms,
    args: '0x',
  };
};
