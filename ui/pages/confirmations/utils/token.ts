import { BigNumber } from 'bignumber.js';
import { memoize } from 'lodash';
import { Hex } from '@metamask/utils';
import { AssetsContractController } from '@metamask/assets-controllers';

import {
  getTokenStandardAndDetails,
  getTokenStandardAndDetailsByChain,
  TokenStandAndDetails,
} from '../../../store/actions';

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

export const memoizedGetTokenStandardAndDetailsByChain = memoize(
  async (
    tokenAddress?: Hex | string,
    chainId?: Hex | string,
  ): Promise<TokenDetails | Record<string, never>> => {
    try {
      if (!tokenAddress) {
        return {};
      }

      return (await getTokenStandardAndDetailsByChain(
        tokenAddress,
        undefined,
        undefined,
        chainId,
      )) as TokenDetails;
    } catch {
      return {};
    }
  },
  // Custom resolver to use both tokenAddress and chainId as cache key
  (tokenAddress, chainId) => `${tokenAddress}-${chainId}`,
);

/**
 * Fetches the decimals for the given token address.
 *
 * @param address - The ethereum token contract address. It is expected to be in hex format.
 * @param chainId - ChainId on which we need to check token. It is expected to be in hex format.
 * We currently accept strings since we have a patch that accepts a custom string
 * {@see .yarn/patches/@metamask-eth-json-rpc-middleware-npm-14.0.1-b6c2ccbe8c.patch}
 */
export const fetchErc20Decimals = async (
  address: Hex | string,
  chainId?: Hex | string,
): Promise<number> => {
  try {
    const result = (await getTokenStandardAndDetailsByChain(
      address,
      undefined,
      undefined,
      chainId,
    )) as TokenDetailsERC20;
    const { decimals: decStr } = result;
    const decimals = parseTokenDetailDecimals(decStr);

    return decimals ?? ERC20_DEFAULT_DECIMALS;
  } catch {
    return ERC20_DEFAULT_DECIMALS;
  }
};

/**
 * Fetches the decimals for the given token addresses.
 *
 * @param addresses - The array ofethereum token contract address. Addresses are expected to be in hex format.
 * @param chainId - ChainId on which we need to check token. It is expected to be in hex format.
 */
export const fetchAllErc20Decimals = async (
  addresses: Hex[],
  chainId: Hex,
): Promise<Record<Hex, number>> => {
  const uniqueAddresses = [
    ...new Set(addresses.map((address) => address.toLowerCase() as Hex)),
  ];
  const allDecimals = await Promise.all(
    uniqueAddresses.map((address) => fetchErc20Decimals(address, chainId)),
  );
  return Object.fromEntries(
    allDecimals.map((decimals, i) => [uniqueAddresses[i], decimals]),
  );
};

export const fetchAllTokenDetails = async (
  addresses: Hex[],
  chainId: Hex,
): Promise<Record<Hex, TokenStandAndDetails>> => {
  const uniqueAddresses = [
    ...new Set(addresses.map((address) => address.toLowerCase() as Hex)),
  ];
  const tokenDetails = await Promise.all(
    uniqueAddresses.map((address) =>
      getTokenStandardAndDetailsByChain(address, undefined, undefined, chainId),
    ),
  );
  return Object.fromEntries(
    tokenDetails.map((tokenDetail, i) => [uniqueAddresses[i], tokenDetail]),
  );
};

export const calculateTokenAmount = (
  value: string,
  decimals: number,
  base: number = 10,
  conversionRate: number = 1,
) => {
  const divisor = new BigNumber(10).pow(decimals ?? 0);
  return new BigNumber(String(value), base)
    .div(divisor)
    .times(new BigNumber(conversionRate, 10));
};

export function getTokenValueFromRecord<Type>(
  record: Record<Hex, Type>,
  tokenAddress: Hex,
): Type | undefined {
  const address = Object.keys(record).find((key) => {
    return key.toLowerCase() === tokenAddress.toLowerCase();
  });
  return address ? record[address as Hex] : undefined;
}
