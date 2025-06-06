import { Hex } from '@metamask/utils';
import type { DeleGatorEnvironment, Caveat } from '..';
import { isHex } from '../utils';

export const argsEqualityCheck = 'argsEqualityCheck';

/**
 * Builds a caveat struct for the ArgsEqualityCheckEnforcer.
 *
 * @param environment - The DeleGator environment.
 * @param args - The expected value for args.
 * @returns The Caveat.
 * @throws Error if the args is invalid.
 */
export const argsEqualityCheckBuilder = (
  environment: DeleGatorEnvironment,
  args: Hex,
): Caveat => {
  if (!isHex(args)) {
    throw new Error('Invalid args: must be a valid hex string');
  }

  const terms = args;

  const {
    caveatEnforcers: { ArgsEqualityCheckEnforcer },
  } = environment;

  if (!ArgsEqualityCheckEnforcer) {
    throw new Error('ArgsEqualityCheckEnforcer not found in environment');
  }

  return {
    enforcer: ArgsEqualityCheckEnforcer,
    terms,
    args: '0x',
  };
};
