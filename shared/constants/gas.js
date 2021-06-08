import { addHexPrefix } from 'ethereumjs-util';

const TWENTY_ONE_THOUSAND = 21000;
const ONE_HUNDRED_THOUSAND = 100000;

export const GAS_LIMITS = {
  // maximum gasLimit of a simple send
  SIMPLE: addHexPrefix(TWENTY_ONE_THOUSAND.toString(16)),
  // a base estimate for token transfers.
  BASE_TOKEN_ESTIMATE: addHexPrefix(ONE_HUNDRED_THOUSAND.toString(16)),
};
