import log from 'loglevel';

import { SWAPS_API_V2_BASE_URL } from '../../../shared/constants/swaps';
import {
  GOERLI_CHAIN_ID,
  KOVAN_CHAIN_ID,
  MAINNET_CHAIN_ID,
  RINKEBY_CHAIN_ID,
  ROPSTEN_CHAIN_ID,
  BUYABLE_CHAINS_MAP,
} from '../../../shared/constants/network';
import { SECOND } from '../../../shared/constants/time';
import getFetchWithTimeout from '../../../shared/modules/fetch-with-timeout';
import {
  TRANSAK_API_KEY,
  MOONPAY_API_KEY,
  COINBASEPAY_API_KEY,
} from '../constants/on-ramp';

const fetchWithTimeout = getFetchWithTimeout(SECOND * 30);

/**
 * Create a Wyre purchase URL.
 *
 * @param {string} walletAddress - Ethereum destination address
 * @param {string} chainId - Current chain ID
 * @returns String
 */
const createWyrePurchaseUrl = async (walletAddress, chainId) => {
  const { wyre = {} } = BUYABLE_CHAINS_MAP[chainId];
  const { srn, currencyCode } = wyre;

  const networkId = parseInt(chainId, 16);
  const fiatOnRampUrlApi = `${SWAPS_API_V2_BASE_URL}/networks/${networkId}/fiatOnRampUrl?serviceName=wyre&destinationAddress=${walletAddress}`;
  const wyrePurchaseUrlFallback = `https://pay.sendwyre.com/purchase?dest=${srn}:${walletAddress}&destCurrency=${currencyCode}&accountId=AC-7AG3W4XH4N2&paymentMethod=debit-card`;
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
 * Create a Transak Checkout URL.
 * API docs here: https://www.notion.so/Query-Parameters-9ec523df3b874ec58cef4fa3a906f238
 *
 * @param {string} walletAddress - Ethereum destination address
 * @param {string} chainId - Current chain ID
 * @returns String
 */
const createTransakUrl = (walletAddress, chainId) => {
  const { transakCurrencies, network } = BUYABLE_CHAINS_MAP[chainId];

  const queryParams = new URLSearchParams({
    apiKey: TRANSAK_API_KEY,
    hostURL: 'https://metamask.io',
    cryptoCurrencyList: transakCurrencies.join(','),
    defaultCryptoCurrency: transakCurrencies[0],
    networks: network,
    walletAddress,
  });

  return `https://global.transak.com/?${queryParams}`;
};

/**
 * Create a MoonPay Checkout URL.
 *
 * @param {string} walletAddress - Destination address
 * @param {string} chainId - Current chain ID
 * @returns String
 */
const createMoonPayUrl = async (walletAddress, chainId) => {
  const {
    moonPay: { defaultCurrencyCode, showOnlyCurrencies } = {},
  } = BUYABLE_CHAINS_MAP[chainId];
  const moonPayQueryParams = new URLSearchParams({
    apiKey: MOONPAY_API_KEY,
    walletAddress,
    defaultCurrencyCode,
    showOnlyCurrencies,
  });
  const queryParams = new URLSearchParams({
    url: `https://buy.moonpay.com?${moonPayQueryParams}`,
    context: 'extension',
  });
  const moonPaySignUrl = `${SWAPS_API_V2_BASE_URL}/moonpaySign/?${queryParams}`;
  try {
    const response = await fetchWithTimeout(moonPaySignUrl, {
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
    log.warn('Failed to create a MoonPay purchase URL', parsedResponse);
  } catch (err) {
    log.warn('Failed to create a MoonPay purchase URL', err);
  }
  return '';
};

/**
 * Create a Coinbase Pay Checkout URL.
 *
 * @param {string} walletAddress - Ethereum destination address
 * @param {string} chainId - Current chain ID
 * @returns String
 */
const createCoinbasePayUrl = (walletAddress, chainId) => {
  const { coinbasePayCurrencies } = BUYABLE_CHAINS_MAP[chainId];
  const queryParams = new URLSearchParams({
    appId: COINBASEPAY_API_KEY,
    attribution: 'extension',
    destinationWallets: JSON.stringify([
      {
        address: walletAddress,
        assets: coinbasePayCurrencies,
      },
    ]),
  });
  return `https://pay.coinbase.com/buy?${queryParams}`;
};

/**
 * Gives the caller a url at which the user can acquire eth, depending on the network they are in
 *
 * @param {object} opts - Options required to determine the correct url
 * @param {string} opts.chainId - The chainId for which to return a url
 * @param {string} opts.address - The address the bought ETH should be sent to.  Only relevant if chainId === '0x1'.
 * @param opts.service
 * @returns {string|undefined} The url at which the user can access ETH, while in the given chain. If the passed
 * chainId does not match any of the specified cases, or if no chainId is given, returns undefined.
 */
export default async function getBuyUrl({ chainId, address, service }) {
  // default service by network if not specified
  if (!service) {
    // eslint-disable-next-line no-param-reassign
    service = getDefaultServiceForChain(chainId);
  }

  switch (service) {
    case 'wyre':
      return await createWyrePurchaseUrl(address, chainId);
    case 'transak':
      return createTransakUrl(address, chainId);
    case 'moonpay':
      return createMoonPayUrl(address, chainId);
    case 'coinbase':
      return createCoinbasePayUrl(address, chainId);
    case 'metamask-faucet':
      return 'https://faucet.metamask.io/';
    case 'rinkeby-faucet':
      return 'https://www.rinkeby.io/';
    case 'kovan-faucet':
      return 'https://github.com/kovan-testnet/faucet';
    case 'goerli-faucet':
      return 'https://goerli-faucet.slock.it/';
    default:
      throw new Error(
        `Unknown cryptocurrency exchange or faucet: "${service}"`,
      );
  }
}

function getDefaultServiceForChain(chainId) {
  switch (chainId) {
    case MAINNET_CHAIN_ID:
      return 'wyre';
    case ROPSTEN_CHAIN_ID:
      return 'metamask-faucet';
    case RINKEBY_CHAIN_ID:
      return 'rinkeby-faucet';
    case KOVAN_CHAIN_ID:
      return 'kovan-faucet';
    case GOERLI_CHAIN_ID:
      return 'goerli-faucet';
    default:
      throw new Error(
        `No default cryptocurrency exchange or faucet for chainId: "${chainId}"`,
      );
  }
}
