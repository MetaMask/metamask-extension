import type { ErrorType } from '../../errors/utils';
import type { Hex } from '../../types/misc';

export type IsHexErrorType = ErrorType;

export function isHex(
  value: unknown,
  { strict = true }: { strict?: boolean | undefined } = {},
): value is Hex {
  if (!value) {
    return false;
  }
  if (typeof value !== 'string') {
    return false;
  }
  return strict ? /^0x[0-9a-fA-F]*$/u.test(value) : value.startsWith('0x');
}
