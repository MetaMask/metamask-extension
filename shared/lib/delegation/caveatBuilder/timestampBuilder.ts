import { Hex, bytesToHex } from '@metamask/utils';
import { encodePacked } from '@metamask/abi-utils';
import type { DeleGatorEnvironment, Caveat } from '..';

export const timestamp = 'timestamp';

/**
 * Builds a caveat struct for the TimestampEnforcer.
 * This enforcer restricts when a delegation can be used based on block timestamp.
 *
 * @param environment - The DeleGator environment.
 * @param notBefore - Unix timestamp (seconds) - delegation cannot be used before this time. Use 0n for no start restriction.
 * @param notAfter - Unix timestamp (seconds) - delegation cannot be used after this time. Use 0n for no end restriction.
 * @returns The Caveat.
 * @throws Error if the timestamps are invalid.
 */
export const timestampBuilder = (
  environment: DeleGatorEnvironment,
  notBefore: bigint,
  notAfter: bigint,
): Caveat => {
  if (typeof notBefore !== 'bigint' || notBefore < 0n) {
    throw new Error('Invalid notBefore: must be a non-negative bigint');
  }

  if (typeof notAfter !== 'bigint' || notAfter < 0n) {
    throw new Error('Invalid notAfter: must be a non-negative bigint');
  }

  // If both are specified and non-zero, notAfter must be greater than notBefore
  if (notBefore > 0n && notAfter > 0n && notAfter <= notBefore) {
    throw new Error('Invalid timestamps: notAfter must be greater than notBefore');
  }

  // Encode as two uint128 values packed together (32 bytes total)
  // The TimestampEnforcer expects: abi.encodePacked(uint128 notBefore, uint128 notAfter)
  const terms = bytesToHex(
    encodePacked(
      ['uint128', 'uint128'],
      [notBefore, notAfter],
    ),
  );

  const {
    caveatEnforcers: { TimestampEnforcer },
  } = environment;

  return {
    enforcer: TimestampEnforcer,
    terms,
    args: '0x',
  };
};
