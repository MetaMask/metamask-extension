import { capitalize } from 'lodash';

export const ROPSTEN = 'ropsten';
export const RINKEBY = 'rinkeby';
export const KOVAN = 'kovan';
export const MAINNET = 'mainnet';
export const GOERLI = 'goerli';
export const LOCALHOST = 'localhost';
export const NETWORK_TYPE_RPC = 'rpc';

export const MAINNET_NETWORK_ID = '1';
export const ROPSTEN_NETWORK_ID = '3';
export const RINKEBY_NETWORK_ID = '4';
export const GOERLI_NETWORK_ID = '5';
export const KOVAN_NETWORK_ID = '42';
export const LOCALHOST_NETWORK_ID = '1337';

export const MAINNET_CHAIN_ID = '0x1';
export const ROPSTEN_CHAIN_ID = '0x3';
export const RINKEBY_CHAIN_ID = '0x4';
export const GOERLI_CHAIN_ID = '0x5';
export const KOVAN_CHAIN_ID = '0x2a';
export const LOCALHOST_CHAIN_ID = '0x539';
export const BSC_CHAIN_ID = '0x38';
export const OPTIMISM_CHAIN_ID = '0xa';
export const OPTIMISM_TESTNET_CHAIN_ID = '0x1a4';
export const POLYGON_CHAIN_ID = '0x89';
export const AVALANCHE_CHAIN_ID = '0xa86a';
export const FANTOM_CHAIN_ID = '0xfa';
export const CELO_CHAIN_ID = '0xa4ec';
export const ARBITRUM_CHAIN_ID = '0xa4b1';
export const HARMONY_CHAIN_ID = '0x63564c40';
export const PALM_CHAIN_ID = '0x2a15c308d';

/**
 * The largest possible chain ID we can handle.
 * Explanation: https://gist.github.com/rekmarks/a47bd5f2525936c4b8eee31a16345553
 */
export const MAX_SAFE_CHAIN_ID = 4503599627370476;

export const ROPSTEN_DISPLAY_NAME = 'Ropsten';
export const RINKEBY_DISPLAY_NAME = 'Rinkeby';
export const KOVAN_DISPLAY_NAME = 'Kovan';
export const MAINNET_DISPLAY_NAME = 'Ethereum Mainnet';
export const GOERLI_DISPLAY_NAME = 'Goerli';
export const LOCALHOST_DISPLAY_NAME = 'Localhost 8545';
export const BSC_DISPLAY_NAME = 'Binance Smart Chain';
export const POLYGON_DISPLAY_NAME = 'Polygon';
export const AVALANCHE_DISPLAY_NAME = 'Avalanche Network C-Chain';
export const ARBITRUM_DISPLAY_NAME = 'Arbitrum One';
export const BNB_DISPLAY_NAME =
  'BNB Smart Chain (previously Binance Smart Chain Mainnet)';
export const OPTIMISM_DISPLAY_NAME = 'Optimism';
export const FANTOM_DISPLAY_NAME = 'Fantom Opera';
export const HARMONY_DISPLAY_NAME = 'Harmony Mainnet Shard 0';
export const PALM_DISPLAY_NAME = 'Palm';

const infuraProjectId = process.env.INFURA_PROJECT_ID;
export const getRpcUrl = ({ network, excludeProjectId = false }) =>
  `https://${network}.infura.io/v3/${excludeProjectId ? '' : infuraProjectId}`;

export const ROPSTEN_RPC_URL = getRpcUrl({ network: ROPSTEN });
export const RINKEBY_RPC_URL = getRpcUrl({ network: RINKEBY });
export const KOVAN_RPC_URL = getRpcUrl({ network: KOVAN });
export const MAINNET_RPC_URL = getRpcUrl({ network: MAINNET });
export const GOERLI_RPC_URL = getRpcUrl({ network: GOERLI });
export const LOCALHOST_RPC_URL = 'http://localhost:8545';

export const ETH_SYMBOL = 'ETH';
export const WETH_SYMBOL = 'WETH';
export const TEST_ETH_SYMBOL = 'TESTETH';
export const BNB_SYMBOL = 'BNB';
export const MATIC_SYMBOL = 'MATIC';
export const AVALANCHE_SYMBOL = 'AVAX';
export const FANTOM_SYMBOL = 'FTM';
export const CELO_SYMBOL = 'CELO';
export const ARBITRUM_SYMBOL = 'AETH';
export const HARMONY_SYMBOL = 'ONE';
export const PALM_SYMBOL = 'PALM';

export const ETH_TOKEN_IMAGE_URL = './images/eth_logo.svg';
export const TEST_ETH_TOKEN_IMAGE_URL = './images/black-eth-logo.svg';
export const BNB_TOKEN_IMAGE_URL = './images/bnb.png';
export const MATIC_TOKEN_IMAGE_URL = './images/matic-token.png';
export const AVAX_TOKEN_IMAGE_URL = './images/avax-token.png';
export const AETH_TOKEN_IMAGE_URL = './images/arbitrum.svg';
export const FTM_TOKEN_IMAGE_URL = './images/fantom-opera.svg';
export const HARMONY_ONE_TOKEN_IMAGE_URL = './images/harmony-one.svg';
export const OPTIMISM_TOKEN_IMAGE_URL = './images/optimism.svg';
export const PALM_TOKEN_IMAGE_URL = './images/palm.svg';

export const INFURA_PROVIDER_TYPES = [ROPSTEN, RINKEBY, KOVAN, MAINNET, GOERLI];

export const TEST_CHAINS = [
  ROPSTEN_CHAIN_ID,
  RINKEBY_CHAIN_ID,
  GOERLI_CHAIN_ID,
  KOVAN_CHAIN_ID,
  LOCALHOST_CHAIN_ID,
];

export const TEST_NETWORK_TICKER_MAP = {
  [ROPSTEN]: `${capitalize(ROPSTEN)}${ETH_SYMBOL}`,
  [RINKEBY]: `${capitalize(RINKEBY)}${ETH_SYMBOL}`,
  [KOVAN]: `${capitalize(KOVAN)}${ETH_SYMBOL}`,
  [GOERLI]: `${capitalize(GOERLI)}${ETH_SYMBOL}`,
};

/**
 * Map of all build-in Infura networks to their network, ticker and chain IDs.
 */
export const NETWORK_TYPE_TO_ID_MAP = {
  [ROPSTEN]: {
    networkId: ROPSTEN_NETWORK_ID,
    chainId: ROPSTEN_CHAIN_ID,
    ticker: TEST_NETWORK_TICKER_MAP[ROPSTEN],
  },
  [RINKEBY]: {
    networkId: RINKEBY_NETWORK_ID,
    chainId: RINKEBY_CHAIN_ID,
    ticker: TEST_NETWORK_TICKER_MAP[RINKEBY],
  },
  [KOVAN]: {
    networkId: KOVAN_NETWORK_ID,
    chainId: KOVAN_CHAIN_ID,
    ticker: TEST_NETWORK_TICKER_MAP[KOVAN],
  },
  [GOERLI]: {
    networkId: GOERLI_NETWORK_ID,
    chainId: GOERLI_CHAIN_ID,
    ticker: TEST_NETWORK_TICKER_MAP[GOERLI],
  },
  [MAINNET]: {
    networkId: MAINNET_NETWORK_ID,
    chainId: MAINNET_CHAIN_ID,
  },
  [LOCALHOST]: {
    networkId: LOCALHOST_NETWORK_ID,
    chainId: LOCALHOST_CHAIN_ID,
  },
};

export const NETWORK_TO_NAME_MAP = {
  [ROPSTEN]: ROPSTEN_DISPLAY_NAME,
  [RINKEBY]: RINKEBY_DISPLAY_NAME,
  [KOVAN]: KOVAN_DISPLAY_NAME,
  [MAINNET]: MAINNET_DISPLAY_NAME,
  [GOERLI]: GOERLI_DISPLAY_NAME,
  [LOCALHOST]: LOCALHOST_DISPLAY_NAME,

  [ROPSTEN_NETWORK_ID]: ROPSTEN_DISPLAY_NAME,
  [RINKEBY_NETWORK_ID]: RINKEBY_DISPLAY_NAME,
  [KOVAN_NETWORK_ID]: KOVAN_DISPLAY_NAME,
  [GOERLI_NETWORK_ID]: GOERLI_DISPLAY_NAME,
  [MAINNET_NETWORK_ID]: MAINNET_DISPLAY_NAME,
  [LOCALHOST_NETWORK_ID]: LOCALHOST_DISPLAY_NAME,

  [ROPSTEN_CHAIN_ID]: ROPSTEN_DISPLAY_NAME,
  [RINKEBY_CHAIN_ID]: RINKEBY_DISPLAY_NAME,
  [KOVAN_CHAIN_ID]: KOVAN_DISPLAY_NAME,
  [GOERLI_CHAIN_ID]: GOERLI_DISPLAY_NAME,
  [MAINNET_CHAIN_ID]: MAINNET_DISPLAY_NAME,
  [LOCALHOST_CHAIN_ID]: LOCALHOST_DISPLAY_NAME,
};

export const CHAIN_ID_TO_TYPE_MAP = Object.entries(
  NETWORK_TYPE_TO_ID_MAP,
).reduce((chainIdToTypeMap, [networkType, { chainId }]) => {
  chainIdToTypeMap[chainId] = networkType;
  return chainIdToTypeMap;
}, {});

export const CHAIN_ID_TO_RPC_URL_MAP = {
  [ROPSTEN_CHAIN_ID]: ROPSTEN_RPC_URL,
  [RINKEBY_CHAIN_ID]: RINKEBY_RPC_URL,
  [KOVAN_CHAIN_ID]: KOVAN_RPC_URL,
  [GOERLI_CHAIN_ID]: GOERLI_RPC_URL,
  [MAINNET_CHAIN_ID]: MAINNET_RPC_URL,
  [LOCALHOST_CHAIN_ID]: LOCALHOST_RPC_URL,
};

export const CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP = {
  [MAINNET_CHAIN_ID]: ETH_TOKEN_IMAGE_URL,
  [AVALANCHE_CHAIN_ID]: AVAX_TOKEN_IMAGE_URL,
  [BSC_CHAIN_ID]: BNB_TOKEN_IMAGE_URL,
  [POLYGON_CHAIN_ID]: MATIC_TOKEN_IMAGE_URL,
  [ARBITRUM_CHAIN_ID]: AETH_TOKEN_IMAGE_URL,
  [BSC_CHAIN_ID]: BNB_TOKEN_IMAGE_URL,
  [FANTOM_CHAIN_ID]: FTM_TOKEN_IMAGE_URL,
  [HARMONY_CHAIN_ID]: HARMONY_ONE_TOKEN_IMAGE_URL,
  [OPTIMISM_CHAIN_ID]: OPTIMISM_TOKEN_IMAGE_URL,
  [PALM_CHAIN_ID]: PALM_TOKEN_IMAGE_URL,
};

export const CHAIN_ID_TO_NETWORK_ID_MAP = Object.values(
  NETWORK_TYPE_TO_ID_MAP,
).reduce((chainIdToNetworkIdMap, { chainId, networkId }) => {
  chainIdToNetworkIdMap[chainId] = networkId;
  return chainIdToNetworkIdMap;
}, {});

export const NATIVE_CURRENCY_TOKEN_IMAGE_MAP = {
  [ETH_SYMBOL]: ETH_TOKEN_IMAGE_URL,
  [TEST_ETH_SYMBOL]: TEST_ETH_TOKEN_IMAGE_URL,
  [BNB_SYMBOL]: BNB_TOKEN_IMAGE_URL,
  [MATIC_SYMBOL]: MATIC_TOKEN_IMAGE_URL,
  [AVALANCHE_SYMBOL]: AVAX_TOKEN_IMAGE_URL,
};

export const INFURA_BLOCKED_KEY = 'countryBlocked';

/**
 * Hardforks are points in the chain where logic is changed significantly
 * enough where there is a fork and the new fork becomes the active chain.
 * These constants are presented in chronological order starting with BERLIN
 * because when we first needed to track the hardfork we had launched support
 * for EIP-2718 (where transactions can have types and different shapes) and
 * EIP-2930 (optional access lists), which were included in BERLIN.
 *
 * BERLIN - forked at block number 12,244,000, included typed transactions and
 *  optional access lists
 * LONDON - future, upcoming fork that introduces the baseFeePerGas, an amount
 *  of the ETH transaction fees that will be burned instead of given to the
 *  miner. This change necessitated the third type of transaction envelope to
 *  specify maxFeePerGas and maxPriorityFeePerGas moving the fee bidding system
 *  to a second price auction model.
 */
export const HARDFORKS = {
  BERLIN: 'berlin',
  LONDON: 'london',
};

export const CHAIN_ID_TO_GAS_LIMIT_BUFFER_MAP = {
  [OPTIMISM_CHAIN_ID]: 1,
  [OPTIMISM_TESTNET_CHAIN_ID]: 1,
};

/**
 * Ethereum JSON-RPC methods that are known to exist but that we intentionally
 * do not support.
 */
export const UNSUPPORTED_RPC_METHODS = new Set([
  // This is implemented later in our middleware stack – specifically, in
  // eth-json-rpc-middleware – but our UI does not support it.
  'eth_signTransaction',
]);

export const IPFS_DEFAULT_GATEWAY_URL = 'dweb.link';

// The first item in transakCurrencies must be the
// default crypto currency for the network
const BUYABLE_CHAIN_ETHEREUM_NETWORK_NAME = 'ethereum';

export const BUYABLE_CHAINS_MAP = {
  [MAINNET_CHAIN_ID]: {
    nativeCurrency: ETH_SYMBOL,
    network: BUYABLE_CHAIN_ETHEREUM_NETWORK_NAME,
    transakCurrencies: [ETH_SYMBOL, 'USDT', 'USDC', 'DAI'],
    moonPay: {
      defaultCurrencyCode: 'eth',
      showOnlyCurrencies: 'eth,usdt,usdc,dai',
    },
    wyre: {
      srn: 'ethereum',
      currencyCode: ETH_SYMBOL,
    },
    coinbasePayCurrencies: [ETH_SYMBOL, 'USDC', 'DAI'],
  },
  [ROPSTEN_CHAIN_ID]: {
    nativeCurrency: TEST_NETWORK_TICKER_MAP[ROPSTEN],
    network: BUYABLE_CHAIN_ETHEREUM_NETWORK_NAME,
  },
  [RINKEBY_CHAIN_ID]: {
    nativeCurrency: TEST_NETWORK_TICKER_MAP[RINKEBY],
    network: BUYABLE_CHAIN_ETHEREUM_NETWORK_NAME,
  },
  [GOERLI_CHAIN_ID]: {
    nativeCurrency: TEST_NETWORK_TICKER_MAP[GOERLI],
    network: BUYABLE_CHAIN_ETHEREUM_NETWORK_NAME,
  },
  [KOVAN_CHAIN_ID]: {
    nativeCurrency: TEST_NETWORK_TICKER_MAP[KOVAN],
    network: BUYABLE_CHAIN_ETHEREUM_NETWORK_NAME,
  },
  [BSC_CHAIN_ID]: {
    nativeCurrency: BNB_SYMBOL,
    network: 'bsc',
    transakCurrencies: [BNB_SYMBOL, 'BUSD'],
    moonPay: {
      defaultCurrencyCode: 'bnb_bsc',
      showOnlyCurrencies: 'bnb_bsc,busd_bsc',
    },
  },
  [POLYGON_CHAIN_ID]: {
    nativeCurrency: MATIC_SYMBOL,
    network: 'polygon',
    transakCurrencies: [MATIC_SYMBOL, 'USDT', 'USDC', 'DAI'],
    moonPay: {
      defaultCurrencyCode: 'matic_polygon',
      showOnlyCurrencies: 'matic_polygon,usdc_polygon',
    },
    wyre: {
      srn: 'matic',
      currencyCode: MATIC_SYMBOL,
    },
  },
  [AVALANCHE_CHAIN_ID]: {
    nativeCurrency: AVALANCHE_SYMBOL,
    network: 'avaxcchain',
    transakCurrencies: [AVALANCHE_SYMBOL],
    moonPay: {
      defaultCurrencyCode: 'avax_cchain',
      showOnlyCurrencies: 'avax_cchain',
    },
    wyre: {
      srn: 'avalanche',
      currencyCode: AVALANCHE_SYMBOL,
    },
    coinbasePayCurrencies: [AVALANCHE_SYMBOL],
  },
  [FANTOM_CHAIN_ID]: {
    nativeCurrency: FANTOM_SYMBOL,
    network: 'fantom',
    transakCurrencies: [FANTOM_SYMBOL],
  },
  [CELO_CHAIN_ID]: {
    nativeCurrency: CELO_SYMBOL,
    network: 'celo',
    transakCurrencies: [CELO_SYMBOL],
    moonPay: {
      defaultCurrencyCode: 'celo',
      showOnlyCurrencies: 'celo',
    },
  },
};

export const FEATURED_RPCS = [
  {
    chainId: ARBITRUM_CHAIN_ID,
    nickname: ARBITRUM_DISPLAY_NAME,
    rpcUrl: `https://arbitrum-mainnet.infura.io/v3/${infuraProjectId}`,
    ticker: ARBITRUM_SYMBOL,
    rpcPrefs: {
      blockExplorerUrl: 'https://explorer.arbitrum.io',
      imageUrl: AETH_TOKEN_IMAGE_URL,
    },
  },
  {
    chainId: AVALANCHE_CHAIN_ID,
    nickname: AVALANCHE_DISPLAY_NAME,
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    ticker: AVALANCHE_SYMBOL,
    rpcPrefs: {
      blockExplorerUrl: 'https://snowtrace.io/',
      imageUrl: AVAX_TOKEN_IMAGE_URL,
    },
  },
  {
    chainId: BSC_CHAIN_ID,
    nickname: BNB_DISPLAY_NAME,
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    ticker: BNB_SYMBOL,
    rpcPrefs: {
      blockExplorerUrl: 'https://bscscan.com/',
      imageUrl: BNB_TOKEN_IMAGE_URL,
    },
  },
  {
    chainId: FANTOM_CHAIN_ID,
    nickname: FANTOM_DISPLAY_NAME,
    rpcUrl: 'https://rpc.ftm.tools/',
    ticker: FANTOM_SYMBOL,
    rpcPrefs: {
      blockExplorerUrl: 'https://ftmscan.com/',
      imageUrl: FTM_TOKEN_IMAGE_URL,
    },
  },
  {
    chainId: HARMONY_CHAIN_ID,
    nickname: HARMONY_DISPLAY_NAME,
    rpcUrl: 'https://api.harmony.one/',
    ticker: HARMONY_SYMBOL,
    rpcPrefs: {
      blockExplorerUrl: 'https://explorer.harmony.one/',
      imageUrl: HARMONY_ONE_TOKEN_IMAGE_URL,
    },
  },
  {
    chainId: OPTIMISM_CHAIN_ID,
    nickname: OPTIMISM_DISPLAY_NAME,
    rpcUrl: `https://optimism-mainnet.infura.io/v3/${infuraProjectId}`,
    ticker: ETH_SYMBOL,
    rpcPrefs: {
      blockExplorerUrl: 'https://optimistic.etherscan.io/',
      imageUrl: OPTIMISM_TOKEN_IMAGE_URL,
    },
  },
  {
    chainId: PALM_CHAIN_ID,
    nickname: PALM_DISPLAY_NAME,
    rpcUrl: `https://palm-mainnet.infura.io/v3/${infuraProjectId}`,
    ticker: PALM_SYMBOL,
    rpcPrefs: {
      blockExplorerUrl: 'https://explorer.palm.io/',
      imageUrl: PALM_TOKEN_IMAGE_URL,
    },
  },
  {
    chainId: POLYGON_CHAIN_ID,
    nickname: `${POLYGON_DISPLAY_NAME} ${capitalize(MAINNET)}`,
    rpcUrl: `https://polygon-mainnet.infura.io/v3/${infuraProjectId}`,
    ticker: MATIC_SYMBOL,
    rpcPrefs: {
      blockExplorerUrl: 'https://polygonscan.com/',
      imageUrl: MATIC_TOKEN_IMAGE_URL,
    },
  },
];
