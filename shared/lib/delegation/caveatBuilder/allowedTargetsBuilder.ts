import type { Address } from '../utils';
import { concat, isAddress } from '../utils';
import type { Caveat, DeleGatorEnvironment } from '..';

export const allowedTargets = 'allowedTargets';

/**
 * Builds a caveat struct for AllowedTargetsEnforcer.
 *
 * @param environment - The DeleGator environment.
 * @param targets - The array of allowed target addresses.
 * @returns The Caveat.
 * @throws Error if no targets are provided or if any of the addresses are invalid.
 */
export const allowedTargetsBuilder = (
  environment: DeleGatorEnvironment,
  targets: Address[],
): Caveat => {
  if (targets.length === 0) {
    throw new Error(
      'Invalid targets: must provide at least one target address',
    );
  }

  // we check that the address is valid, but doesn't need to be checksummed
  const invalidAddresses = targets.filter(
    (target) => !isAddress(target, { strict: false }),
  );

  if (invalidAddresses.length > 0) {
    throw new Error('Invalid targets: must be valid addresses');
  }

  const terms = concat(targets);

  const {
    caveatEnforcers: { AllowedTargetsEnforcer },
  } = environment;

  return {
    enforcer: AllowedTargetsEnforcer,
    terms,
    args: '0x',
  };
};
