import { memoize } from 'lodash';
import { Hex } from '@metamask/utils';
import { getTokenStandardAndDetails } from '../../../store/actions';

export const ERC20_DEFAULT_DECIMALS = 18;

/**
 * Fetches the decimals for the given token address.
 *
 * @param {Hex | string} address - The ethereum token contract address. It is expected to be in hex format.
 * We currently accept strings since we have a patch that accepts a custom string
 * {@see .yarn/patches/@metamask-eth-json-rpc-middleware-npm-14.0.1-b6c2ccbe8c.patch}
 */
export const fetchErc20Decimals = memoize(
  async (address: Hex | string): Promise<number> => {
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
  },
);
