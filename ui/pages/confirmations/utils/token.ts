import { memoize } from 'lodash';
import { Hex } from '@metamask/utils';
import { AssetsContractController } from '@metamask/assets-controllers';
import { getTokenStandardAndDetails } from '../../../store/actions';

export type TokenDetailsERC20 = Awaited<
  ReturnType<
    ReturnType<AssetsContractController['getERC20Standard']>['getDetails']
  >
> & { decimalsNumber: number };

export type TokenDetailsERC721 = Awaited<
  ReturnType<
    ReturnType<AssetsContractController['getERC721Standard']>['getDetails']
  >
>;

export type TokenDetailsERC1155 = Awaited<
  ReturnType<
    ReturnType<AssetsContractController['getERC1155Standard']>['getDetails']
  >
>;

export type TokenDetails =
  | TokenDetailsERC20
  | TokenDetailsERC721
  | TokenDetailsERC1155;

export const ERC20_DEFAULT_DECIMALS = 18;

export const parseTokenDetailDecimals = (
  decStr?: string,
): number | undefined => {
  if (!decStr) {
    return undefined;
  }

  for (const radix of [10, 16]) {
    const parsedDec = parseInt(decStr, radix);
    if (isFinite(parsedDec)) {
      return parsedDec;
    }
  }
  return undefined;
};

export const memoizedGetTokenStandardAndDetails = memoize(
  async (
    tokenAddress?: Hex | string,
    userAddress?: string,
    tokenId?: string,
  ): Promise<TokenDetails | Record<string, never>> => {
    try {
      if (!tokenAddress) {
        return {};
      }

      return (await getTokenStandardAndDetails(
        tokenAddress,
        userAddress,
        tokenId,
      )) as TokenDetails;
    } catch {
      return {};
    }
  },
);

/**
 * Fetches the decimals for the given token address.
 *
 * @param address - The ethereum token contract address. It is expected to be in hex format.
 * We currently accept strings since we have a patch that accepts a custom string
 * {@see .yarn/patches/@metamask-eth-json-rpc-middleware-npm-14.0.1-b6c2ccbe8c.patch}
 */
export const fetchErc20Decimals = async (
  address: Hex | string,
): Promise<number> => {
  try {
    const { decimals: decStr } = (await memoizedGetTokenStandardAndDetails(
      address,
    )) as TokenDetailsERC20;
    const decimals = parseTokenDetailDecimals(decStr);

    return decimals ?? ERC20_DEFAULT_DECIMALS;
  } catch {
    return ERC20_DEFAULT_DECIMALS;
  }
};
