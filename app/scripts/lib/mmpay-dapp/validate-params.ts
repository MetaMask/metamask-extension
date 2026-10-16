import type { Hex } from '@metamask/utils';
import { rpcErrors } from '@metamask/rpc-errors';
import { BigNumber } from 'bignumber.js';

import { isMmPayType } from './registry';
import type { MmPayParams } from './types';

const AMOUNT_PATTERN = /^\d+(\.\d{1,6})?$/u;

/**
 * Validate raw JSON-RPC params for `wallet_mmPay`.
 *
 * @param raw - Params object as received from the dApp.
 * @returns A typed `MmPayParams` when valid.
 * @throws An `invalidParams` RPC error describing the first failed check.
 */
export function validateMmPayParams(raw: unknown): MmPayParams {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw rpcErrors.invalidParams({
      message: 'wallet_mmPay: params must be an object',
    });
  }

  const { type, amount } = raw as { type?: unknown; amount?: unknown };

  if (!isMmPayType(type)) {
    throw rpcErrors.invalidParams({
      message:
        'wallet_mmPay: params.type must be one of: perpsDeposit, perpsWithdraw',
    });
  }

  if (amount !== undefined) {
    if (typeof amount !== 'string' || !AMOUNT_PATTERN.test(amount)) {
      throw rpcErrors.invalidParams({
        message:
          'wallet_mmPay: params.amount must be a decimal string with up to 6 fractional digits',
      });
    }

    let parsed: BigNumber;
    try {
      parsed = new BigNumber(amount);
    } catch {
      throw rpcErrors.invalidParams({
        message: 'wallet_mmPay: params.amount is not a valid number',
      });
    }

    if (!parsed.isFinite() || parsed.lessThanOrEqualTo(0)) {
      throw rpcErrors.invalidParams({
        message: 'wallet_mmPay: params.amount must be greater than 0',
      });
    }
  }

  return {
    type,
    amount: amount as string | undefined,
  };
}

/**
 * Convert a human-readable decimal `amount` into a raw hex base-unit value.
 *
 * @param amount - Human-readable decimal string (for example `"10"`), or
 * `undefined` to stage an empty transaction.
 * @param decimals - Token decimals (6 for USDC).
 * @returns `'0x0'` when `amount` is `undefined`, otherwise `amount * 10^decimals`
 * as a hex string.
 */
export function toAmountRaw(amount: string | undefined, decimals: number): Hex {
  if (amount === undefined) {
    return '0x0' as Hex;
  }

  const base = new BigNumber(10).pow(decimals);
  const raw = new BigNumber(amount).times(base).truncated();
  return `0x${raw.toString(16)}` as Hex;
}
