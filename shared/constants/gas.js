import { addHexPrefix } from 'ethereumjs-util';
import { decimalToHex } from '../../ui/helpers/utils/conversions.util';

export const GAS_LIMITS = {
  // maximum gasLimit of a simple send
  SIMPLE: addHexPrefix(decimalToHex(21_000)),
  // a base estimate for token transfers.
  BASE_TOKEN_ESTIMATE: addHexPrefix(decimalToHex(100_000)),
};
