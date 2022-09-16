import { capitalize } from 'lodash';
/**
 * A type representing any valid value for 'type' for setProviderType and other
 * methods that add or manipulate networks in MetaMask state.
 */
export type NetworkType = typeof NETWORK_TYPES[keyof typeof NETWORK_TYPES];

/**
 * A union type of all possible hard-coded chain ids. This type is not
 * exhaustive and cannot be used for typing chainId in areas where the user or
 * dapp may specify any chainId.
 */
export type ChainId = typeof CHAIN_IDS[keyof typeof CHAIN_IDS];

/**
 * A type that is a union type of all possible hardcoded currency symbols.
 * This type is non-exhaustive, and cannot be used for areas where the user
 * or dapp may supply their own symbol.
 */
type CurrencySymbol = typeof CURRENCY_SYMBOLS[keyof typeof CURRENCY_SYMBOLS];
/**
 * For certain specific situations we need the above type, but with all symbols
 * in lowercase format.
 */
type LowercaseCurrencySymbol = Lowercase<CurrencySymbol>;
/**
 * Test networks have special symbols that combine the network name and 'ETH'
 * so that they are distinct from mainnet and other networks that use 'ETH'.
 */
export type TestNetworkCurrencySymbol =
  typeof TEST_NETWORK_TICKER_MAP[keyof typeof TEST_NETWORK_TICKER_MAP];

/**
 * MoonPay is a fiat onramp provider, and there are some special strings that
 * inform the MoonPay API which network the user is attempting to onramp into.
 * This type reflects those possible values.
 */
type MoonPayNetworkAbbreviation = 'bsc' | 'cchain' | 'polygon';

/**
 * MoonPay requires some settings that are configured per network that it is
 * enabled on. This type describes those settings.
 */
type MoonPayChainSettings = {
  /**
   * What should the default onramp currency be, for example 'eth' on 'mainnet'
   * This type matches a single LowercaseCurrencySymbol or a
   * LowercaseCurrencySymbol and a MoonPayNetworkAbbreviation joined by a '_'.
   */
  defaultCurrencyCode:
    | LowercaseCurrencySymbol
    | `${LowercaseCurrencySymbol}_${MoonPayNetworkAbbreviation}`;
  /**
   * We must also configure all possible onramp currencies we wish to support.
   * This type matches 1 to 3 LowercaseCurrencySymbols, joined by ','. It also
   * matches 1 or 2 LowercaseCurrencySymbols with a
   * MoonPayNetworkAbbreviation joined by a '_', and concatenated with ','.
   */
  showOnlyCurrencies:
    | `${LowercaseCurrencySymbol}`
    | `${LowercaseCurrencySymbol},${LowercaseCurrencySymbol}`
    | `${LowercaseCurrencySymbol},${LowercaseCurrencySymbol},${LowercaseCurrencySymbol}`
    | `${LowercaseCurrencySymbol},${LowercaseCurrencySymbol},${LowercaseCurrencySymbol},${LowercaseCurrencySymbol}`
    | `${LowercaseCurrencySymbol}_${MoonPayNetworkAbbreviation}`
    | `${LowercaseCurrencySymbol}_${MoonPayNetworkAbbreviation},${LowercaseCurrencySymbol}_${MoonPayNetworkAbbreviation}`;
};

/**
 * An object containing preferences for an RPC definition
 */
type RPCPreferences = {
  /**
   * A URL for the block explorer for the RPC's network
   */
  blockExplorerUrl: `https://${string}`;
  /**
   * A image reflecting the asset symbol for the network
   */
  imageUrl: string;
};

/**
 * An object that describes a network to be used inside of MetaMask
 */
type RPCDefinition = {
  /**
   * The hex encoded ChainId for the network
   */
  chainId: ChainId;
  /**
   * The nickname for the network
   */
  nickname: string;
  /**
   * The URL for the client to send network requests to
   */
  rpcUrl: `https://${string}`;
  /**
   * The Currency Symbol for the network
   */
  ticker: string;
  /**
   * Additional preferences for the network, such as blockExplorerUrl
   */
  rpcPrefs: RPCPreferences;
};

/**
 * Wyre is a fiat onramp provider. We must provide some settings for networks
 * that support Wyre.
 */
type WyreChainSettings = {
  /**
   * The network name
   */
  srn: string;
  /**
   * The native currency for the network
   */
  currencyCode: CurrencySymbol;
};

/**
 * For each chain that we support fiat onramps for, we provide a set of
 * configuration options that help for initializing the connectiong to the
 * onramp providers.
 */
type BuyableChainSettings = {
  /**
   * The native currency for the given chain
   */
  nativeCurrency: CurrencySymbol | TestNetworkCurrencySymbol;
  /**
   * The network name or identifier
   */
  network: string;
  /**
   * The list of supported currencies for the Transak onramp provider
   */
  transakCurrencies?: CurrencySymbol[];
  /**
   * A configuration object for the MoonPay onramp provider
   */
  moonPay?: MoonPayChainSettings;
  /**
   * A configuration object for the Wyre onramp provider
   */
  wyre?: WyreChainSettings;
  /**
   * The list of supported currencies for the CoinbasePay onramp provider
   */
  coinbasePayCurrencies?: CurrencySymbol[];
};

/**
 * Throughout the extension we set the current provider by referencing its
 * "type", which can be any of the values in the below object. These values
 * represent the built-in networks of MetaMask, including test nets, as well
 * as "rpc" which is the "type" of a custom network added by the user or via
 * wallet_addEthereumChain.
 */
export const NETWORK_TYPES = {
  GOERLI: 'goerli',
  KOVAN: 'kovan',
  LOCALHOST: 'localhost',
  MAINNET: 'mainnet',
  RINKEBY: 'rinkeby',
  ROPSTEN: 'ropsten',
  RPC: 'rpc',
  SEPOLIA: 'sepolia',
} as const;

/**
 * An object containing shortcut names for any non-builtin network. We need
 * this to be able to differentiate between networks that require custom
 * sections of code for our various features, such as swaps or token lists.
 */
export const NETWORK_NAMES = {
  HOMESTEAD: 'homestead',
};

/**
 * The Network ID for our builtin networks. This is the decimal equivalent of
 * the chain id for the network, but is expresssed as a string. Many moons ago
 * the decision was made on the extension team to expressly use chainId with
 * hex encoding over network id. Consider that when accessing this object. Note
 * for cross product purposes: alignment with mobile on this matter has not
 * been fully achieved, thus it is possible for some dependencies to still
 * ask for or require network id.
 */
export const NETWORK_IDS = {
  MAINNET: '1',
  ROPSTEN: '3',
  RINKEBY: '4',
  GOERLI: '5',
  KOVAN: '42',
  LOCALHOST: '1337',
  SEPOLIA: '11155111',
} as const;

/**
 * An object containing all of the chain ids for networks both built in and
 * those that we have added custom code to support our feature set.
 */
export const CHAIN_IDS = {
  MAINNET: '0x1',
  ROPSTEN: '0x3',
  RINKEBY: '0x4',
  GOERLI: '0x5',
  KOVAN: '0x2a',
  LOCALHOST: '0x539',
  BSC: '0x38',
  OPTIMISM: '0xa',
  OPTIMISM_TESTNET: '0x1a4',
  POLYGON: '0x89',
  AVALANCHE: '0xa86a',
  FANTOM: '0xfa',
  CELO: '0xa4ec',
  ARBITRUM: '0xa4b1',
  HARMONY: '0x63564c40',
  PALM: '0x2a15c308d',
  SEPOLIA: '0xaa36a7',
} as const;

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
export const SEPOLIA_DISPLAY_NAME = 'Sepolia';
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

export const infuraProjectId = process.env.INFURA_PROJECT_ID;
export const getRpcUrl = ({
  network,
  excludeProjectId = false,
}: {
  network: NetworkType;
  excludeProjectId?: boolean;
}) =>
  `https://${network}.infura.io/v3/${excludeProjectId ? '' : infuraProjectId}`;

export const ROPSTEN_RPC_URL = getRpcUrl({
  network: NETWORK_TYPES.ROPSTEN,
});
export const RINKEBY_RPC_URL = getRpcUrl({
  network: NETWORK_TYPES.RINKEBY,
});
export const KOVAN_RPC_URL = getRpcUrl({ network: NETWORK_TYPES.KOVAN });
export const MAINNET_RPC_URL = getRpcUrl({
  network: NETWORK_TYPES.MAINNET,
});
export const GOERLI_RPC_URL = getRpcUrl({ network: NETWORK_TYPES.GOERLI });
export const SEPOLIA_RPC_URL = getRpcUrl({ network: NETWORK_TYPES.SEPOLIA });
export const LOCALHOST_RPC_URL = 'http://localhost:8545';

/**
 * An object containing the token symbols for various tokens that are either
 * native currencies or those that have been special cased by the extension
 * for supporting our feature set.
 */
export const CURRENCY_SYMBOLS = {
  ARBITRUM: 'ETH',
  AVALANCHE: 'AVAX',
  BNB: 'BNB',
  BUSD: 'BUSD',
  CELO: 'CELO',
  DAI: 'DAI',
  ETH: 'ETH',
  FANTOM: 'FTM',
  HARMONY: 'ONE',
  PALM: 'PALM',
  MATIC: 'MATIC',
  TEST_ETH: 'TESTETH',
  USDC: 'USDC',
  USDT: 'USDT',
  WETH: 'WETH',
} as const;

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

export const INFURA_PROVIDER_TYPES = [
  NETWORK_TYPES.ROPSTEN,
  NETWORK_TYPES.RINKEBY,
  NETWORK_TYPES.KOVAN,
  NETWORK_TYPES.MAINNET,
  NETWORK_TYPES.GOERLI,
  NETWORK_TYPES.SEPOLIA,
];

export const TEST_CHAINS = [
  CHAIN_IDS.ROPSTEN,
  CHAIN_IDS.RINKEBY,
  CHAIN_IDS.GOERLI,
  CHAIN_IDS.KOVAN,
  CHAIN_IDS.SEPOLIA,
  CHAIN_IDS.LOCALHOST,
];

const typedCapitalize = <K extends string>(k: K): Capitalize<K> =>
  capitalize(k) as Capitalize<typeof k>;

export const TEST_NETWORK_TICKER_MAP: {
  [K in Exclude<
    NetworkType,
    'localhost' | 'mainnet' | 'rpc'
  >]: `${Capitalize<K>}${typeof CURRENCY_SYMBOLS.ETH}`;
} = {
  [NETWORK_TYPES.ROPSTEN]: `${typedCapitalize(NETWORK_TYPES.ROPSTEN)}${
    CURRENCY_SYMBOLS.ETH
  }`,
  [NETWORK_TYPES.RINKEBY]: `${typedCapitalize(NETWORK_TYPES.RINKEBY)}${
    CURRENCY_SYMBOLS.ETH
  }`,
  [NETWORK_TYPES.KOVAN]: `${typedCapitalize(NETWORK_TYPES.KOVAN)}${
    CURRENCY_SYMBOLS.ETH
  }`,
  [NETWORK_TYPES.GOERLI]: `${typedCapitalize(NETWORK_TYPES.GOERLI)}${
    CURRENCY_SYMBOLS.ETH
  }`,
  [NETWORK_TYPES.SEPOLIA]: `${typedCapitalize(NETWORK_TYPES.SEPOLIA)}${
    CURRENCY_SYMBOLS.ETH
  }`,
};

/**
 * Map of all build-in Infura networks to their network, ticker and chain IDs.
 */
export const BUILT_IN_NETWORKS = {
  [NETWORK_TYPES.ROPSTEN]: {
    networkId: NETWORK_IDS.ROPSTEN,
    chainId: CHAIN_IDS.ROPSTEN,
    ticker: TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.ROPSTEN],
  },
  [NETWORK_TYPES.RINKEBY]: {
    networkId: NETWORK_IDS.RINKEBY,
    chainId: CHAIN_IDS.RINKEBY,
    ticker: TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.RINKEBY],
  },
  [NETWORK_TYPES.KOVAN]: {
    networkId: NETWORK_IDS.KOVAN,
    chainId: CHAIN_IDS.KOVAN,
    ticker: TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.KOVAN],
  },
  [NETWORK_TYPES.GOERLI]: {
    networkId: NETWORK_IDS.GOERLI,
    chainId: CHAIN_IDS.GOERLI,
    ticker: TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.GOERLI],
  },
  [NETWORK_TYPES.SEPOLIA]: {
    networkId: NETWORK_IDS.SEPOLIA,
    chainId: CHAIN_IDS.SEPOLIA,
    ticker: TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.SEPOLIA],
  },
  [NETWORK_TYPES.MAINNET]: {
    networkId: NETWORK_IDS.MAINNET,
    chainId: CHAIN_IDS.MAINNET,
  },
  [NETWORK_TYPES.LOCALHOST]: {
    networkId: NETWORK_IDS.LOCALHOST,
    chainId: CHAIN_IDS.LOCALHOST,
  },
} as const;

export const NETWORK_TO_NAME_MAP = {
  [NETWORK_TYPES.ROPSTEN]: ROPSTEN_DISPLAY_NAME,
  [NETWORK_TYPES.RINKEBY]: RINKEBY_DISPLAY_NAME,
  [NETWORK_TYPES.KOVAN]: KOVAN_DISPLAY_NAME,
  [NETWORK_TYPES.MAINNET]: MAINNET_DISPLAY_NAME,
  [NETWORK_TYPES.GOERLI]: GOERLI_DISPLAY_NAME,
  [NETWORK_TYPES.SEPOLIA]: SEPOLIA_DISPLAY_NAME,
  [NETWORK_TYPES.LOCALHOST]: LOCALHOST_DISPLAY_NAME,

  [NETWORK_IDS.ROPSTEN]: ROPSTEN_DISPLAY_NAME,
  [NETWORK_IDS.RINKEBY]: RINKEBY_DISPLAY_NAME,
  [NETWORK_IDS.KOVAN]: KOVAN_DISPLAY_NAME,
  [NETWORK_IDS.GOERLI]: GOERLI_DISPLAY_NAME,
  [NETWORK_IDS.SEPOLIA]: SEPOLIA_DISPLAY_NAME,
  [NETWORK_IDS.MAINNET]: MAINNET_DISPLAY_NAME,
  [NETWORK_IDS.LOCALHOST]: LOCALHOST_DISPLAY_NAME,

  [CHAIN_IDS.ROPSTEN]: ROPSTEN_DISPLAY_NAME,
  [CHAIN_IDS.RINKEBY]: RINKEBY_DISPLAY_NAME,
  [CHAIN_IDS.KOVAN]: KOVAN_DISPLAY_NAME,
  [CHAIN_IDS.GOERLI]: GOERLI_DISPLAY_NAME,
  [CHAIN_IDS.SEPOLIA]: SEPOLIA_DISPLAY_NAME,
  [CHAIN_IDS.MAINNET]: MAINNET_DISPLAY_NAME,
  [CHAIN_IDS.LOCALHOST]: LOCALHOST_DISPLAY_NAME,
} as const;

export const CHAIN_ID_TO_TYPE_MAP = {
  [CHAIN_IDS.MAINNET]: NETWORK_TYPES.MAINNET,
  [CHAIN_IDS.GOERLI]: NETWORK_TYPES.GOERLI,
  [CHAIN_IDS.SEPOLIA]: NETWORK_TYPES.SEPOLIA,
  [CHAIN_IDS.KOVAN]: NETWORK_TYPES.KOVAN,
  [CHAIN_IDS.LOCALHOST]: NETWORK_TYPES.LOCALHOST,
  [CHAIN_IDS.RINKEBY]: NETWORK_TYPES.RINKEBY,
  [CHAIN_IDS.ROPSTEN]: NETWORK_TYPES.ROPSTEN,
} as const;

export const CHAIN_ID_TO_RPC_URL_MAP = {
  [CHAIN_IDS.ROPSTEN]: ROPSTEN_RPC_URL,
  [CHAIN_IDS.RINKEBY]: RINKEBY_RPC_URL,
  [CHAIN_IDS.KOVAN]: KOVAN_RPC_URL,
  [CHAIN_IDS.GOERLI]: GOERLI_RPC_URL,
  [CHAIN_IDS.SEPOLIA]: SEPOLIA_RPC_URL,
  [CHAIN_IDS.MAINNET]: MAINNET_RPC_URL,
  [CHAIN_IDS.LOCALHOST]: LOCALHOST_RPC_URL,
} as const;

export const CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP = {
  [CHAIN_IDS.MAINNET]: ETH_TOKEN_IMAGE_URL,
  [CHAIN_IDS.AVALANCHE]: AVAX_TOKEN_IMAGE_URL,
  [CHAIN_IDS.BSC]: BNB_TOKEN_IMAGE_URL,
  [CHAIN_IDS.POLYGON]: MATIC_TOKEN_IMAGE_URL,
  [CHAIN_IDS.ARBITRUM]: AETH_TOKEN_IMAGE_URL,
  [CHAIN_IDS.FANTOM]: FTM_TOKEN_IMAGE_URL,
  [CHAIN_IDS.HARMONY]: HARMONY_ONE_TOKEN_IMAGE_URL,
  [CHAIN_IDS.OPTIMISM]: OPTIMISM_TOKEN_IMAGE_URL,
  [CHAIN_IDS.PALM]: PALM_TOKEN_IMAGE_URL,
} as const;

export const NETWORK_ID_TO_ETHERS_NETWORK_NAME_MAP = {
  [NETWORK_IDS.ROPSTEN]: NETWORK_TYPES.ROPSTEN,
  [NETWORK_IDS.RINKEBY]: NETWORK_TYPES.RINKEBY,
  [NETWORK_IDS.GOERLI]: NETWORK_TYPES.GOERLI,
  [NETWORK_IDS.SEPOLIA]: NETWORK_TYPES.SEPOLIA,
  [NETWORK_IDS.MAINNET]: NETWORK_NAMES.HOMESTEAD,
} as const;

export const CHAIN_ID_TO_NETWORK_ID_MAP = {
  [CHAIN_IDS.MAINNET]: NETWORK_IDS.MAINNET,
  [CHAIN_IDS.GOERLI]: NETWORK_IDS.GOERLI,
  [CHAIN_IDS.SEPOLIA]: NETWORK_IDS.SEPOLIA,
  [CHAIN_IDS.KOVAN]: NETWORK_IDS.KOVAN,
  [CHAIN_IDS.LOCALHOST]: NETWORK_IDS.LOCALHOST,
  [CHAIN_IDS.RINKEBY]: NETWORK_IDS.RINKEBY,
  [CHAIN_IDS.ROPSTEN]: NETWORK_IDS.ROPSTEN,
} as const;

export const NATIVE_CURRENCY_TOKEN_IMAGE_MAP = {
  [CURRENCY_SYMBOLS.ETH]: ETH_TOKEN_IMAGE_URL,
  [CURRENCY_SYMBOLS.TEST_ETH]: TEST_ETH_TOKEN_IMAGE_URL,
  [CURRENCY_SYMBOLS.BNB]: BNB_TOKEN_IMAGE_URL,
  [CURRENCY_SYMBOLS.MATIC]: MATIC_TOKEN_IMAGE_URL,
  [CURRENCY_SYMBOLS.AVALANCHE]: AVAX_TOKEN_IMAGE_URL,
} as const;

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
 * optional access lists
 * LONDON - future, upcoming fork that introduces the baseFeePerGas, an amount
 * of the ETH transaction fees that will be burned instead of given to the
 * miner. This change necessitated the third type of transaction envelope to
 * specify maxFeePerGas and maxPriorityFeePerGas moving the fee bidding system
 * to a second price auction model.
 */
export const HARDFORKS = {
  BERLIN: 'berlin',
  LONDON: 'london',
} as const;

export const CHAIN_ID_TO_GAS_LIMIT_BUFFER_MAP = {
  [CHAIN_IDS.OPTIMISM]: 1,
  [CHAIN_IDS.OPTIMISM_TESTNET]: 1,
};

/**
 * Ethereum JSON-RPC methods that are known to exist but that we intentionally
 * do not support.
 */
export const UNSUPPORTED_RPC_METHODS = new Set([
  // This is implemented later in our middleware stack – specifically, in
  // eth-json-rpc-middleware – but our UI does not support it.
  'eth_signTransaction' as const,
]);

export const IPFS_DEFAULT_GATEWAY_URL = 'dweb.link';

// The first item in transakCurrencies must be the
// default crypto currency for the network
const BUYABLE_CHAIN_ETHEREUM_NETWORK_NAME = 'ethereum';

export const BUYABLE_CHAINS_MAP: {
  [K in Exclude<
    ChainId,
    | typeof CHAIN_IDS.LOCALHOST
    | typeof CHAIN_IDS.PALM
    | typeof CHAIN_IDS.HARMONY
    | typeof CHAIN_IDS.OPTIMISM
    | typeof CHAIN_IDS.OPTIMISM_TESTNET
    | typeof CHAIN_IDS.ARBITRUM
  >]: BuyableChainSettings;
} = {
  [CHAIN_IDS.MAINNET]: {
    nativeCurrency: CURRENCY_SYMBOLS.ETH,
    network: BUYABLE_CHAIN_ETHEREUM_NETWORK_NAME,
    transakCurrencies: [CURRENCY_SYMBOLS.ETH, 'USDT', 'USDC', 'DAI'],
    moonPay: {
      defaultCurrencyCode: 'eth',
      showOnlyCurrencies: 'eth,usdt,usdc,dai',
    },
    wyre: {
      srn: 'ethereum',
      currencyCode: CURRENCY_SYMBOLS.ETH,
    },
    coinbasePayCurrencies: [CURRENCY_SYMBOLS.ETH, 'USDC', 'DAI'],
  },
  [CHAIN_IDS.ROPSTEN]: {
    nativeCurrency: TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.ROPSTEN],
    network: BUYABLE_CHAIN_ETHEREUM_NETWORK_NAME,
  },
  [CHAIN_IDS.RINKEBY]: {
    nativeCurrency: TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.RINKEBY],
    network: BUYABLE_CHAIN_ETHEREUM_NETWORK_NAME,
  },
  [CHAIN_IDS.GOERLI]: {
    nativeCurrency: TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.GOERLI],
    network: BUYABLE_CHAIN_ETHEREUM_NETWORK_NAME,
  },
  [CHAIN_IDS.SEPOLIA]: {
    nativeCurrency: TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.SEPOLIA],
    network: BUYABLE_CHAIN_ETHEREUM_NETWORK_NAME,
  },
  [CHAIN_IDS.KOVAN]: {
    nativeCurrency: TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.KOVAN],
    network: BUYABLE_CHAIN_ETHEREUM_NETWORK_NAME,
  },
  [CHAIN_IDS.BSC]: {
    nativeCurrency: CURRENCY_SYMBOLS.BNB,
    network: 'bsc',
    transakCurrencies: [CURRENCY_SYMBOLS.BNB, CURRENCY_SYMBOLS.BUSD],
    moonPay: {
      defaultCurrencyCode: 'bnb_bsc',
      showOnlyCurrencies: 'bnb_bsc,busd_bsc',
    },
  },
  [CHAIN_IDS.POLYGON]: {
    nativeCurrency: CURRENCY_SYMBOLS.MATIC,
    network: 'polygon',
    transakCurrencies: [
      CURRENCY_SYMBOLS.MATIC,
      CURRENCY_SYMBOLS.USDT,
      CURRENCY_SYMBOLS.USDC,
      CURRENCY_SYMBOLS.DAI,
    ],
    moonPay: {
      defaultCurrencyCode: 'matic_polygon',
      showOnlyCurrencies: 'matic_polygon,usdc_polygon',
    },
    wyre: {
      srn: 'matic',
      currencyCode: CURRENCY_SYMBOLS.MATIC,
    },
  },
  [CHAIN_IDS.AVALANCHE]: {
    nativeCurrency: CURRENCY_SYMBOLS.AVALANCHE,
    network: 'avaxcchain',
    transakCurrencies: [CURRENCY_SYMBOLS.AVALANCHE],
    moonPay: {
      defaultCurrencyCode: 'avax_cchain',
      showOnlyCurrencies: 'avax_cchain',
    },
    wyre: {
      srn: 'avalanche',
      currencyCode: CURRENCY_SYMBOLS.AVALANCHE,
    },
    coinbasePayCurrencies: [CURRENCY_SYMBOLS.AVALANCHE],
  },
  [CHAIN_IDS.FANTOM]: {
    nativeCurrency: CURRENCY_SYMBOLS.FANTOM,
    network: 'fantom',
    transakCurrencies: [CURRENCY_SYMBOLS.FANTOM],
  },
  [CHAIN_IDS.CELO]: {
    nativeCurrency: CURRENCY_SYMBOLS.CELO,
    network: 'celo',
    transakCurrencies: [CURRENCY_SYMBOLS.CELO],
    moonPay: {
      defaultCurrencyCode: 'celo',
      showOnlyCurrencies: 'celo',
    },
  },
};

export const FEATURED_RPCS: RPCDefinition[] = [
  {
    chainId: CHAIN_IDS.ARBITRUM,
    nickname: ARBITRUM_DISPLAY_NAME,
    rpcUrl: `https://arbitrum-mainnet.infura.io/v3/${infuraProjectId}`,
    ticker: CURRENCY_SYMBOLS.ARBITRUM,
    rpcPrefs: {
      blockExplorerUrl: 'https://explorer.arbitrum.io',
      imageUrl: AETH_TOKEN_IMAGE_URL,
    },
  },
  {
    chainId: CHAIN_IDS.AVALANCHE,
    nickname: AVALANCHE_DISPLAY_NAME,
    rpcUrl: `https://avalanche-mainnet.infura.io/v3/${infuraProjectId}`,
    ticker: CURRENCY_SYMBOLS.AVALANCHE,
    rpcPrefs: {
      blockExplorerUrl: 'https://snowtrace.io/',
      imageUrl: AVAX_TOKEN_IMAGE_URL,
    },
  },
  {
    chainId: CHAIN_IDS.BSC,
    nickname: BNB_DISPLAY_NAME,
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    ticker: CURRENCY_SYMBOLS.BNB,
    rpcPrefs: {
      blockExplorerUrl: 'https://bscscan.com/',
      imageUrl: BNB_TOKEN_IMAGE_URL,
    },
  },
  {
    chainId: CHAIN_IDS.FANTOM,
    nickname: FANTOM_DISPLAY_NAME,
    rpcUrl: 'https://rpc.ftm.tools/',
    ticker: CURRENCY_SYMBOLS.FANTOM,
    rpcPrefs: {
      blockExplorerUrl: 'https://ftmscan.com/',
      imageUrl: FTM_TOKEN_IMAGE_URL,
    },
  },
  {
    chainId: CHAIN_IDS.HARMONY,
    nickname: HARMONY_DISPLAY_NAME,
    rpcUrl: 'https://api.harmony.one/',
    ticker: CURRENCY_SYMBOLS.HARMONY,
    rpcPrefs: {
      blockExplorerUrl: 'https://explorer.harmony.one/',
      imageUrl: HARMONY_ONE_TOKEN_IMAGE_URL,
    },
  },
  {
    chainId: CHAIN_IDS.OPTIMISM,
    nickname: OPTIMISM_DISPLAY_NAME,
    rpcUrl: `https://optimism-mainnet.infura.io/v3/${infuraProjectId}`,
    ticker: CURRENCY_SYMBOLS.ETH,
    rpcPrefs: {
      blockExplorerUrl: 'https://optimistic.etherscan.io/',
      imageUrl: OPTIMISM_TOKEN_IMAGE_URL,
    },
  },
  {
    chainId: CHAIN_IDS.PALM,
    nickname: PALM_DISPLAY_NAME,
    rpcUrl: `https://palm-mainnet.infura.io/v3/${infuraProjectId}`,
    ticker: CURRENCY_SYMBOLS.PALM,
    rpcPrefs: {
      blockExplorerUrl: 'https://explorer.palm.io/',
      imageUrl: PALM_TOKEN_IMAGE_URL,
    },
  },
  {
    chainId: CHAIN_IDS.POLYGON,
    nickname: `${POLYGON_DISPLAY_NAME} ${capitalize(NETWORK_TYPES.MAINNET)}`,
    rpcUrl: `https://polygon-mainnet.infura.io/v3/${infuraProjectId}`,
    ticker: CURRENCY_SYMBOLS.MATIC,
    rpcPrefs: {
      blockExplorerUrl: 'https://polygonscan.com/',
      imageUrl: MATIC_TOKEN_IMAGE_URL,
    },
  },
];
