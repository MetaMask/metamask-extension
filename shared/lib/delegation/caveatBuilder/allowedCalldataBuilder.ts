import type { Hex } from '../utils';
import { concat, isHex, toHex } from '../utils';
import type { Caveat, DeleGatorEnvironment } from '..';

export const allowedCalldata = 'allowedCalldata';

/**
 * Builds a caveat struct for AllowedCalldataEnforcer.
 *
 * @param environment - The DeleGator environment.
 * @param startIndex - The start index of the subset of calldata bytes.
 * @param value - The expected value for the subset of calldata.
 * @returns The Caveat.
 * @throws Error if the value is not a valid hex string, if startIndex is negative, or if startIndex is not a whole number.
 */
export const allowedCalldataBuilder = (
  environment: DeleGatorEnvironment,
  startIndex: number,
  value: Hex,
): Caveat => {
  if (!isHex(value)) {
    throw new Error('Invalid value: must be a valid hex string');
  }

  if (startIndex < 0) {
    throw new Error('Invalid startIndex: must be zero or positive');
  }

  if (!Number.isInteger(startIndex)) {
    throw new Error('Invalid startIndex: must be a whole number');
  }

  const startIndexHex = toHex(startIndex, { size: 32 });

  const terms = concat([startIndexHex, value]);

  const {
    caveatEnforcers: { AllowedCalldataEnforcer },
  } = environment;

  return {
    enforcer: AllowedCalldataEnforcer,
    terms,
    args: '0x',
  };
};
