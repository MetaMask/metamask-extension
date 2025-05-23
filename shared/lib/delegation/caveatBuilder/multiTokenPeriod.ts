import { bigIntToHex } from '@metamask/utils';
import { concat, Hex, isAddress, pad, toHex } from '../utils';
import type { DeleGatorEnvironment, Caveat } from '..';

export type TokenPeriodConfig = {
  token: Hex;
  periodAmount: bigint;
  periodDuration: number;
  startDate: number;
};

export const multiTokenPeriod = 'multiTokenPeriod';

/**
 * Creates a caveat for the MultiTokenPeriodEnforcer.
 * This enforcer allows setting periodic transfer limits for multiple tokens.
 * Each token can have its own period amount, duration, and start date.
 *
 * @param environment - The DeleGator environment
 * @param configs - Array of token period configurations
 * @returns The caveat object for the MultiTokenPeriodEnforcer
 */
export const multiTokenPeriodBuilder = (
  environment: DeleGatorEnvironment,
  configs: TokenPeriodConfig[],
): Caveat => {
  if (!configs || configs.length === 0) {
    throw new Error('MultiTokenPeriodBuilder: configs array cannot be empty');
  }

  configs.forEach((config) => {
    if (!isAddress(config.token)) {
      throw new Error(`Invalid token address: ${config.token}`);
    }

    if (config.periodAmount <= 0) {
      throw new Error('Invalid period amount: must be greater than 0');
    }

    if (config.periodDuration <= 0) {
      throw new Error('Invalid period duration: must be greater than 0');
    }
  });

  // Each config requires 116 bytes:
  // - 20 bytes for token address
  // - 32 bytes for periodAmount
  // - 32 bytes for periodDuration
  // - 32 bytes for startDate
  const termsArray = configs.reduce<Hex[]>(
    (acc, { token, periodAmount, periodDuration, startDate }) => [
      ...acc,
      pad(token, { size: 20 }),
      pad(bigIntToHex(periodAmount), { size: 32 }),
      pad(toHex(periodDuration, { size: 32 }), { size: 32 }),
      pad(toHex(startDate, { size: 32 }), { size: 32 }),
    ],
    [],
  );

  const terms = concat(termsArray);

  const {
    caveatEnforcers: { MultiTokenPeriodEnforcer },
  } = environment;

  return {
    enforcer: MultiTokenPeriodEnforcer,
    terms,
    args: '0x',
  };
};
