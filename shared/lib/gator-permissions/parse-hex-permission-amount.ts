import { BigNumber } from 'bignumber.js';
import type { Hex } from '@metamask/utils';
import { hexToBigInt } from '@metamask/utils';

/**
 * Parses a permission amount string as an unsigned EVM integer (hex on the wire).
 *
 * Strings without a `0x` prefix are still interpreted as hexadecimal, not decimal.
 * That matches uint values from RPC / typed data and avoids `new BigNumber(str)`
 * auto-detection: unprefixed hex like `"1000"` must mean `0x1000` (4096), not
 * decimal 1000 — otherwise renderers that do `toString(16)` before formatting
 * would show the wrong value.
 *
 * @param value - Hex string with or without `0x` / `0X` prefix.
 */
export function parseHexPermissionAmount(value: string): BigNumber {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error('Cannot parse empty permission amount');
  }

  const hex = (
    trimmed.startsWith('0x') || trimmed.startsWith('0X')
      ? trimmed
      : `0x${trimmed}`
  ) as Hex;

  return new BigNumber(hexToBigInt(hex).toString(10));
}
