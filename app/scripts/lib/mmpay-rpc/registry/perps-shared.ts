import { USDC_DECIMALS } from '@metamask/perps-controller';
import { add0x, type Hex } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import { mmPayRpcErrors } from '../errors';
import type { MmPayRpcMessenger } from '../types';

const AMOUNT_PATTERN = /^\d+(\.\d{1,6})?$/u;

export type PerpsPayParams = {
  amount?: string;
};

/**
 * Validates perps `payParams`: optional, and only a positive USDC `amount`.
 *
 * @param payParams - The raw `payParams`.
 * @returns The validated params.
 */
export function validatePerpsPayParams(payParams: unknown): PerpsPayParams {
  if (payParams === undefined) {
    return {};
  }

  if (
    typeof payParams !== 'object' ||
    payParams === null ||
    Array.isArray(payParams)
  ) {
    throw mmPayRpcErrors.invalidParams('payParams', 'an object');
  }

  const unknownKey = Object.keys(payParams).find((key) => key !== 'amount');

  if (unknownKey) {
    throw mmPayRpcErrors.invalidParams(
      `payParams.${unknownKey}`,
      'no such field',
    );
  }

  const { amount } = payParams as { amount?: unknown };

  if (amount === undefined) {
    return {};
  }

  if (
    typeof amount !== 'string' ||
    !AMOUNT_PATTERN.test(amount) ||
    new BigNumber(amount).isZero()
  ) {
    throw mmPayRpcErrors.invalidParams(
      'payParams.amount',
      'a positive decimal string with up to 6 decimals',
    );
  }

  return { amount };
}

/**
 * Converts a USDC amount to its raw hex value.
 *
 * @param amount - The decimal amount, or `undefined` for no amount.
 * @returns The raw amount, or `0x0` when no amount is given.
 */
export function toUsdcAmountRaw(amount: string | undefined): Hex {
  if (amount === undefined) {
    return '0x0';
  }

  return add0x(
    new BigNumber(amount)
      .times(new BigNumber(10).pow(USDC_DECIMALS))
      .truncated()
      .toString(16),
  );
}

/**
 * Throws the geo-block error when the user isn't eligible for perps.
 *
 * @param messenger - Root messenger.
 */
export async function assertPerpsEligible(messenger: MmPayRpcMessenger) {
  if (messenger.call('PerpsController:getState').isEligible) {
    return;
  }

  // `isEligible` starts as false until the first check completes, so refresh
  // once before blocking.
  await messenger.call('PerpsController:refreshEligibility');

  if (!messenger.call('PerpsController:getState').isEligible) {
    throw mmPayRpcErrors.perpsNotEligible();
  }
}
