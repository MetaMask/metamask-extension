import log from 'loglevel';

import { isNullOrUndefined } from '@metamask/utils';
import { SWAPS_API_V2_BASE_URL } from '../../../shared/constants/swaps';
import {
  BUYABLE_CHAINS_MAP,
  CHAIN_IDS,
  WyreChainSettings,
  CurrencySymbol,
  ChainId,
} from '../../../shared/constants/network';
import getFetchWithTimeout from '../../../shared/modules/fetch-with-timeout';

const fetchWithTimeout = getFetchWithTimeout();

/**
 * Create a Wyre purchase URL.
 *
 * @param walletAddress - Ethereum destination address
 * @param chainId - Current chain ID
 * @param symbol - Token symbol to buy
 * @returns String
 */
const createWyrePurchaseUrl = async (
  walletAddress: string,
  chainId: keyof typeof BUYABLE_CHAINS_MAP,
  symbol?: CurrencySymbol,
): Promise<any> => {
  const { wyre = {} as WyreChainSettings } = BUYABLE_CHAINS_MAP[chainId];
  const { srn, currencyCode } = wyre;

  const networkId = parseInt(chainId, 16);
  const fiatOnRampUrlApi = `${SWAPS_API_V2_BASE_URL}/networks/${networkId}/fiatOnRampUrl?serviceName=wyre&destinationAddress=${walletAddress}&currency=${
    symbol || currencyCode
  }`;
  const wyrePurchaseUrlFallback = `https://pay.sendwyre.com/purchase?dest=${srn}:${walletAddress}&destCurrency=${
    symbol || currencyCode
  }&accountId=AC-7AG3W4XH4N2&paymentMethod=debit-card`;
  try {
    const response = await fetchWithTimeout(fiatOnRampUrlApi, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    const parsedResponse = await response.json();
    if (response.ok && parsedResponse.url) {
      return parsedResponse.url;
    }
    log.warn('Failed to create a Wyre purchase URL', parsedResponse);
  } catch (err) {
    log.warn('Failed to create a Wyre purchase URL', err);
  }
  return wyrePurchaseUrlFallback; // In case the API call would fail, we return a fallback URL for Wyre's Checkout.
};

/**
 * Gives the caller a url at which the user can acquire eth, depending on the network they are in
 *
 * @param opts - Options required to determine the correct url
 * @param opts.chainId - The chainId for which to return a url
 * @param opts.address - The address the bought ETH should be sent to.  Only relevant if chainId === '0x1'.
 * @param opts.service
 * @param opts.symbol - The symbol of the token to buy. Only relevant if buying a token.
 * @returns The url at which the user can access ETH, while in the given chain. If the passed
 * chainId does not match any of the specified cases, or if no chainId is given, returns undefined.
 */
export default async function getBuyUrl({
  chainId,
  address,
  service,
  symbol,
}: {
  chainId: keyof typeof BUYABLE_CHAINS_MAP;
  address?: string;
  service?: string;
  symbol?: CurrencySymbol;
}): Promise<string> {
  let serviceToUse = service;
  // default service by network if not specified
  if (isNullOrUndefined(service)) {
    // eslint-disable-next-line no-param-reassign
    serviceToUse = getDefaultServiceForChain(chainId);
  }

  switch (serviceToUse) {
    case 'wyre':
      if (address) {
        return await createWyrePurchaseUrl(address as string, chainId, symbol);
      }
      throw new Error('Address is required when requesting url for Wyre');
    case 'metamask-faucet':
      return 'https://faucet.metamask.io/';
    case 'goerli-faucet':
      return 'https://goerli-faucet.slock.it/';
    case 'sepolia-faucet':
      return 'https://faucet.sepolia.dev/';
    default:
      throw new Error(
        `Unknown cryptocurrency exchange or faucet: "${service}"`,
      );
  }
}

function getDefaultServiceForChain(chainId: ChainId): string {
  switch (chainId) {
    case CHAIN_IDS.MAINNET:
      return 'wyre';
    case CHAIN_IDS.GOERLI:
      return 'goerli-faucet';
    case CHAIN_IDS.SEPOLIA:
      return 'sepolia-faucet';
    default:
      throw new Error(
        `No default cryptocurrency exchange or faucet for chainId: "${chainId}"`,
      );
  }
}
