import { memoize } from 'lodash';
import { Hex } from '@metamask/utils';
import { getTokenStandardAndDetails } from '../../../store/actions';
import { ERC20_DEFAULT_DECIMALS } from '../constants/token';

// Fetches the decimals for the given token address.
export const fetchErc20Decimals = memoize(async (address: Hex): Promise<number> => {
  try {
    const { decimals: decStr } = await getTokenStandardAndDetails(address);
    if (!decStr) {
      return ERC20_DEFAULT_DECIMALS;
    }
    for (const radix of [10, 16]) {
      const parsedDec = parseInt(decStr, radix);
      if (isFinite(parsedDec)) {
        return parsedDec;
      }
    }
    return ERC20_DEFAULT_DECIMALS;
  } catch {
    return ERC20_DEFAULT_DECIMALS;
  }
})