import {
  AddNetworkFields,
  RpcEndpointType,
} from '@metamask/network-controller';
import { capitalize, pick } from 'lodash';
/**
 * A type representing built-in network types, used as an identifier.
 */
export type NetworkType = (typeof NETWORK_TYPES)[keyof typeof NETWORK_TYPES];

/**
 * A union type of all possible hard-coded chain ids. This type is not
 * exhaustive and cannot be used for typing chainId in areas where the user or
 * dapp may specify any chainId.
 */
export type ChainId = (typeof CHAIN_IDS)[keyof typeof CHAIN_IDS];

/**
 * A type that is a union type of all possible hardcoded currency symbols.
 * This type is non-exhaustive, and cannot be used for areas where the user
 * or dapp may supply their own symbol.
 */
export type CurrencySymbol =
  (typeof CURRENCY_SYMBOLS)[keyof typeof CURRENCY_SYMBOLS];
/**
 * Test networks have special symbols that combine the network name and 'ETH'
 * so that they are distinct from mainnet and other networks that use 'ETH'.
 */
export type TestNetworkCurrencySymbol =
  (typeof TEST_NETWORK_TICKER_MAP)[keyof typeof TEST_NETWORK_TICKER_MAP];

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
export type RPCDefinition = {
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
 * Throughout the extension we set the current provider by referencing its
 * "type", which can be any of the values in the below object. These values
 * represent the built-in networks of MetaMask, including test nets, as well
 * as "rpc" which is the "type" of a custom network added by the user or via
 * wallet_addEthereumChain.
 */
export const NETWORK_TYPES = {
  GOERLI: 'goerli',
  LOCALHOST: 'localhost',
  MAINNET: 'mainnet',
  RPC: 'rpc',
  SEPOLIA: 'sepolia',
  LINEA_GOERLI: 'linea-goerli',
  LINEA_SEPOLIA: 'linea-sepolia',
  LINEA_MAINNET: 'linea-mainnet',
} as const;

export type NetworkTypes = (typeof NETWORK_TYPES)[keyof typeof NETWORK_TYPES];

/**
 * An object containing shortcut names for any non-builtin network. We need
 * this to be able to differentiate between networks that require custom
 * sections of code for our various features, such as swaps or token lists.
 */
export const NETWORK_NAMES = {
  HOMESTEAD: 'homestead',
};

export const CHAIN_SPEC_URL = 'https://chainid.network/chains.json';
/**
 * An object containing all of the chain ids for networks both built in and
 * those that we have added custom code to support our feature set.
 */
export const CHAIN_IDS = {
  MAINNET: '0x1',
  GOERLI: '0x5',
  LOCALHOST: '0x539',
  BSC: '0x38',
  BSC_TESTNET: '0x61',
  OPTIMISM: '0xa',
  OPTIMISM_TESTNET: '0xaa37dc',
  OPTIMISM_GOERLI: '0x1a4',
  BASE: '0x2105',
  BASE_TESTNET: '0x14a33',
  OPBNB: '0xcc',
  OPBNB_TESTNET: '0x15eb',
  POLYGON: '0x89',
  POLYGON_TESTNET: '0x13881',
  AVALANCHE: '0xa86a',
  AVALANCHE_TESTNET: '0xa869',
  FANTOM: '0xfa',
  FANTOM_TESTNET: '0xfa2',
  CELO: '0xa4ec',
  ARBITRUM: '0xa4b1',
  HARMONY: '0x63564c40',
  PALM: '0x2a15c308d',
  SEPOLIA: '0xaa36a7',
  LINEA_GOERLI: '0xe704',
  LINEA_SEPOLIA: '0xe705',
  LINEA_MAINNET: '0xe708',
  AURORA: '0x4e454152',
  MOONBEAM: '0x504',
  MOONBEAM_TESTNET: '0x507',
  MOONRIVER: '0x505',
  CRONOS: '0x19',
  GNOSIS: '0x64',
  ZKSYNC_ERA: '0x144',
  TEST_ETH: '0x539',
  ARBITRUM_GOERLI: '0x66eed',
  BLAST: '0x13e31',
  FILECOIN: '0x13a',
  POLYGON_ZKEVM: '0x44d',
  SCROLL: '0x82750',
  SCROLL_SEPOLIA: '0x8274f',
  WETHIO: '0x4e',
  CHZ: '0x15b38',
  NUMBERS: '0x290b',
  SEI: '0x531',
  APE_TESTNET: '0x8157',
  APE_MAINNET: '0x8173',
  BERACHAIN: '0x138d5',
  METACHAIN_ONE: '0x1b6e6',
  ARBITRUM_SEPOLIA: '0x66eee',
  NEAR: '0x18d',
  NEAR_TESTNET: '0x18e',
  GRAVITY_ALPHA_MAINNET: '0x659',
  GRAVITY_ALPHA_TESTNET_SEPOLIA: '0x34c1',
} as const;

export const CHAINLIST_CHAIN_IDS_MAP = {
  ...CHAIN_IDS,
  SCROLL: '0x82750',
  TAIKO_JOLNIR_L2_MAINNET: '0x28c5f',
  FANTOM_OPERA: '0xfa',
  CELO_MAINNET: '0xa4ec',
  KAVA_EVM: '0x8ae',
  HARMONY_MAINNET_SHARD_0: '0x63564c40',
  CRONOS_MAINNET_BETA: '0x19',
  Q_MAINNET: '0x8a71',
  HUOBI_ECO_CHAIN_MAINNET: '0x80',
  ACALA_NETWORK: '0x313',
  ARBITRUM_NOVA: '0xa4ba',
  ASTAR: '0x250',
  BAHAMUT_MAINNET: '0x142d',
  BLACKFORT_EXCHANGE_NETWORK: '0x1387',
  CANTO: '0x1e14',
  CONFLUX_ESPACE: '0x406',
  CORE_BLOCKCHAIN_MAINNET: '0x45c',
  DEXALOT_SUBNET: '0x6984c',
  DFK_CHAIN: '0xd2af',
  DOGECHAIN_MAINNET: '0x7d0',
  ENDURANCE_SMART_CHAIN_MAINNET: '0x288',
  ETHEREUM_CLASSIC_MAINNET: '0x3d',
  EVMOS: '0x2329',
  FLARE_MAINNET: '0xe',
  FUSE_GOLD_MAINNET: '0x7a',
  HAQQ_NETWORK: '0x2be3',
  IOTEX_MAINNET: '0x1251',
  KCC_MAINNET: '0x141',
  KLAYTN_MAINNET_CYPRESS: '0x2019',
  KROMA_MAINNET: '0xff',
  LIGHTLINK_PHOENIX_MAINNET: '0x762',
  MANTA_PACIFIC_MAINNET: '0xa9',
  MANTLE: '0x1388',
  NEAR_AURORA_MAINNET: '0x4e454152',
  NEBULA_MAINNET: '0x585eb4b1',
  OASYS_MAINNET: '0xf8',
  OKXCHAIN_MAINNET: '0x42',
  PGN_PUBLIC_GOODS_NETWORK: '0x1a8',
  PULSECHAIN_MAINNET: '0x171',
  SHARDEUM_LIBERTY_2X: '0x1f91',
  SHARDEUM_SPHINX_1X: '0x1f92',
  SHIB_MAINNET: '0x1b',
  SONGBIRD_CANARY_NETWORK: '0x13',
  STEP_NETWORK: '0x4d2',
  TELOS_EVM_MAINNET: '0x28',
  TENET: '0x617',
  VELAS_EVM_MAINNET: '0x6a',
  ZKATANA: '0x133e40',
  ZORA_MAINNET: '0x76adf1',
  FILECOIN: '0x13a',
  NUMBERS: '0x290b',
  APE: '0x8173',
  GRAVITY_ALPHA_MAINNET: '0x659',
  GRAVITY_ALPHA_TESTNET_SEPOLIA: '0x34c1',
} as const;

// To add a deprecation warning to a network, add it to the array
// `DEPRECATED_NETWORKS` and optionally add network specific logic to
// `ui/components/ui/deprecated-networks/deprecated-networks.js`.
export const DEPRECATED_NETWORKS = [
  CHAIN_IDS.GOERLI,
  CHAIN_IDS.ARBITRUM_GOERLI,
  CHAIN_IDS.OPTIMISM_GOERLI,
  CHAIN_IDS.POLYGON_TESTNET,
  CHAIN_IDS.LINEA_GOERLI,
];

/**
 * The largest possible chain ID we can handle.
 * Explanation: https://gist.github.com/rekmarks/a47bd5f2525936c4b8eee31a16345553
 */
export const MAX_SAFE_CHAIN_ID = 4503599627370476;

export const MAINNET_DISPLAY_NAME = 'Ethereum Mainnet';
export const GOERLI_DISPLAY_NAME = 'Goerli';
export const SEPOLIA_DISPLAY_NAME = 'Sepolia';
export const LINEA_GOERLI_DISPLAY_NAME = 'Linea Goerli';
export const LINEA_SEPOLIA_DISPLAY_NAME = 'Linea Sepolia';
export const LINEA_MAINNET_DISPLAY_NAME = 'Linea Mainnet';
export const LOCALHOST_DISPLAY_NAME = 'Localhost 8545';
export const BSC_DISPLAY_NAME = 'Binance Smart Chain';
export const POLYGON_DISPLAY_NAME = 'Polygon';
export const AVALANCHE_DISPLAY_NAME = 'Avalanche Network C-Chain';
export const ARBITRUM_DISPLAY_NAME = 'Arbitrum One';
export const BNB_DISPLAY_NAME = 'BNB Chain';
export const OPTIMISM_DISPLAY_NAME = 'OP Mainnet';
export const FANTOM_DISPLAY_NAME = 'Fantom Opera';
export const HARMONY_DISPLAY_NAME = 'Harmony Mainnet Shard 0';
export const PALM_DISPLAY_NAME = 'Palm';
export const CELO_DISPLAY_NAME = 'Celo Mainnet';
export const GNOSIS_DISPLAY_NAME = 'Gnosis';
export const ZK_SYNC_ERA_DISPLAY_NAME = 'zkSync Era Mainnet';
export const BASE_DISPLAY_NAME = 'Base Mainnet';
export const AURORA_DISPLAY_NAME = 'Aurora Mainnet';
export const CRONOS_DISPLAY_NAME = 'Cronos';
export const POLYGON_ZKEVM_DISPLAY_NAME = 'Polygon zkEVM';
export const MOONBEAM_DISPLAY_NAME = 'Moonbeam';
export const MOONRIVER_DISPLAY_NAME = 'Moonriver';
export const SCROLL_DISPLAY_NAME = 'Scroll';
export const SCROLL_SEPOLIA_DISPLAY_NAME = 'Scroll Sepolia';
export const OP_BNB_DISPLAY_NAME = 'opBNB';
export const BERACHAIN_DISPLAY_NAME = 'Berachain Artio';
export const METACHAIN_ONE_DISPLAY_NAME = 'Metachain One Mainnet';

export const infuraProjectId = process.env.INFURA_PROJECT_ID;
export const getRpcUrl = ({
  network,
  excludeProjectId = false,
}: {
  network: NetworkType;
  excludeProjectId?: boolean;
}) =>
  `https://${network}.infura.io/v3/${excludeProjectId ? '' : infuraProjectId}`;

export const MAINNET_RPC_URL = getRpcUrl({
  network: NETWORK_TYPES.MAINNET,
});
export const GOERLI_RPC_URL = getRpcUrl({ network: NETWORK_TYPES.GOERLI });
export const SEPOLIA_RPC_URL = getRpcUrl({ network: NETWORK_TYPES.SEPOLIA });
export const LINEA_GOERLI_RPC_URL = getRpcUrl({
  network: NETWORK_TYPES.LINEA_GOERLI,
});
export const LINEA_SEPOLIA_RPC_URL = getRpcUrl({
  network: NETWORK_TYPES.LINEA_SEPOLIA,
});
export const LINEA_MAINNET_RPC_URL = getRpcUrl({
  network: NETWORK_TYPES.LINEA_MAINNET,
});
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
  GNOSIS: 'XDAI',
  ETH: 'ETH',
  FANTOM: 'FTM',
  HARMONY: 'ONE',
  PALM: 'PALM',
  MATIC: 'MATIC',
  POL: 'POL',
  TEST_ETH: 'TESTETH',
  USDC: 'USDC',
  USDT: 'USDT',
  WETH: 'WETH',
  OPTIMISM: 'ETH',
  CRONOS: 'CRO',
  GLIMMER: 'GLMR',
  MOONRIVER: 'MOVR',
  ONE: 'ONE',
} as const;

// Non-EVM currency symbols
export const NON_EVM_CURRENCY_SYMBOLS = {
  BTC: 'BTC',
  SOL: 'SOL',
} as const;

const CHAINLIST_CURRENCY_SYMBOLS_MAP = {
  ...CURRENCY_SYMBOLS,
  ...NON_EVM_CURRENCY_SYMBOLS,
  BASE: 'ETH',
  LINEA_MAINNET: 'ETH',
  OPBNB: 'BNB',
  ZKSYNC_ERA: 'ETH',
  SCROLL: 'ETH',
  ZORA_MAINNET: 'ETH',
  TAIKO_JOLNIR_L2_MAINNET: 'ETH',
  POLYGON_ZKEVM: 'ETH',
  FANTOM_OPERA: 'FTM',
  CELO_MAINNET: 'CELO',
  ARBITRUM_NOVA: 'ETH',
  MANTLE: 'MNT',
  CORE_BLOCKCHAIN_MAINNET: 'CORE',
  MANTA_PACIFIC_MAINNET: 'ETH',
  PULSECHAIN_MAINNET: 'PLS',
  MOONBEAM: 'GLMR',
  FUSE_GOLD_MAINNET: 'FUSE',
  KAVA_EVM: 'KAVA',
  DFK_CHAIN: 'JEWEL',
  HARMONY_MAINNET_SHARD_0: 'ONE',
  PGN_PUBLIC_GOODS_NETWORK: 'ETH',
  LIGHTLINK_PHOENIX_MAINNET: 'ETH',
  NEAR_AURORA_MAINNET: 'ETH',
  KROMA_MAINNET: 'ETH',
  NEBULA_MAINNET: 'sFUEL',
  KLAYTN_MAINNET_CYPRESS: 'KLAY',
  ENDURANCE_SMART_CHAIN_MAINNET: 'ACE',
  CRONOS_MAINNET_BETA: 'CRO',
  FLARE_MAINNET: 'FLR',
  KCC_MAINNET: 'KCS',
  SHARDEUM_SPHINX_1X: 'SHM',
  ETHEREUM_CLASSIC_MAINNET: 'ETC',
  HAQQ_NETWORK: 'ISLM',
  SHARDEUM_LIBERTY_2X: 'SHM',
  BLACKFORT_EXCHANGE_NETWORK: 'BXN',
  CONFLUX_ESPACE: 'CFX',
  CANTO: 'CANTO',
  SHIB_MAINNET: 'SHIB',
  OKXCHAIN_MAINNET: 'OKT',
  ZKATANA: 'ETH',
  DEXALOT_SUBNET: 'ALOT',
  ASTAR: 'ASTR',
  EVMOS: 'EVMOS',
  BAHAMUT_MAINNET: 'FTN',
  SONGBIRD_CANARY_NETWORK: 'SGB',
  STEP_NETWORK: 'FITFI',
  VELAS_EVM_MAINNET: 'VLX',
  Q_MAINNET: 'QGOV',
  TELOS_EVM_MAINNET: 'TLOS',
  TENET: 'TENET',
  DOGECHAIN_MAINNET: 'DOGE',
  OASYS_MAINNET: 'OAS',
  HUOBI_ECO_CHAIN_MAINNET: 'HT',
  ACALA_NETWORK: 'ACA',
  IOTEX_MAINNET: 'IOTX',
  APE: 'APE',
} as const;

export const CHAINLIST_CURRENCY_SYMBOLS_MAP_NETWORK_COLLISION = {
  WETHIO: 'ZYN',
  CHZ: 'CHZ',
};

export const ETH_TOKEN_IMAGE_URL = './images/eth_logo.svg';
export const LINEA_GOERLI_TOKEN_IMAGE_URL = './images/linea-logo-testnet.png';
export const LINEA_SEPOLIA_TOKEN_IMAGE_URL = './images/linea-logo-testnet.png';
export const LINEA_MAINNET_TOKEN_IMAGE_URL = './images/linea-logo-mainnet.svg';
export const TEST_ETH_TOKEN_IMAGE_URL = './images/black-eth-logo.svg';
export const BNB_TOKEN_IMAGE_URL = './images/bnb.svg';
export const POL_TOKEN_IMAGE_URL = './images/pol-token.svg';
export const AVAX_TOKEN_IMAGE_URL = './images/avax-token.svg';
export const AETH_TOKEN_IMAGE_URL = './images/arbitrum.svg';
export const FTM_TOKEN_IMAGE_URL = './images/fantom-opera.svg';
export const HARMONY_ONE_TOKEN_IMAGE_URL = './images/harmony-one.svg';
export const OPTIMISM_TOKEN_IMAGE_URL = './images/optimism.svg';
export const PALM_TOKEN_IMAGE_URL = './images/palm.svg';
export const CELO_TOKEN_IMAGE_URL = './images/celo.svg';
export const GNOSIS_TOKEN_IMAGE_URL = './images/gnosis.svg';
export const ZK_SYNC_ERA_TOKEN_IMAGE_URL = './images/zk-sync.svg';
export const BASE_TOKEN_IMAGE_URL = './images/base.svg';
export const ACALA_TOKEN_IMAGE_URL = './images/acala-network-logo.svg';
export const ARBITRUM_NOVA_IMAGE_URL = './images/arbitrum-nova-logo.svg';
export const ASTAR_IMAGE_URL = './images/astar-logo.svg';
export const BAHAMUT_IMAGE_URL = './images/bahamut.png';
export const BLACKFORT_IMAGE_URL = './images/blackfort.png';
export const CANTO_IMAGE_URL = './images/canto.svg';
export const CONFLUX_ESPACE_IMAGE_URL = './images/conflux.svg';
export const CORE_BLOCKCHAIN_MAINNET_IMAGE_URL = './images/core.svg';
export const CRONOS_IMAGE_URL = './images/cronos.svg';
export const DEXALOT_SUBNET_IMAGE_URL = './images/dexalut-subnet.svg';
export const DFK_CHAIN_IMAGE_URL = './images/dfk.png';
export const DOGECHAIN_IMAGE_URL = './images/dogechain.jpeg';
export const ENDURANCE_SMART_CHAIN_MAINNET_IMAGE_URL =
  './images/endurance-smart-chain-mainnet.png';
export const ETHEREUM_CLASSIC_MAINNET_IMAGE_URL = './images/eth_classic.svg';
export const EVMOS_IMAGE_URL = './images/evmos.svg';
export const FLARE_MAINNET_IMAGE_URL = './images/flare-mainnet.svg';
export const FUSE_GOLD_MAINNET_IMAGE_URL = './images/fuse-mainnet.jpg';
export const HAQQ_NETWORK_IMAGE_URL = './images/haqq.svg';
export const IOTEX_MAINNET_IMAGE_URL = './images/iotex.svg';
export const IOTEX_TOKEN_IMAGE_URL = './images/iotex-token.svg';
export const APE_TOKEN_IMAGE_URL = './images/ape-token.svg';
export const KCC_MAINNET_IMAGE_URL = './images/kcc-mainnet.svg';
export const KLAYTN_MAINNET_IMAGE_URL = './images/klaytn.svg';
export const KROMA_MAINNET_IMAGE_URL = './images/kroma.svg';
export const LIGHT_LINK_IMAGE_URL = './images/lightlink.svg';
export const MANTA_PACIFIC_MAINNET_IMAGE_URL = './images/manta.svg';
export const MANTLE_MAINNET_IMAGE_URL = './images/mantle.svg';
export const MOONBEAM_IMAGE_URL = './images/moonbeam.svg';
export const MOONRIVER_IMAGE_URL = './images/moonriver.svg';
export const MOONBEAM_TOKEN_IMAGE_URL = './images/moonbeam-token.svg';
export const MOONRIVER_TOKEN_IMAGE_URL = './images/moonriver-token.svg';
export const NEAR_AURORA_MAINNET_IMAGE_URL = './images/near-aurora.svg';
export const NEBULA_MAINNET_IMAGE_URL = './images/nebula.svg';
export const OASYS_MAINNET_IMAGE_URL = './images/oasys.svg';
export const OKXCHAIN_MAINNET_IMAGE_URL = './images/okx.svg';
export const PGN_MAINNET_IMAGE_URL = './images/pgn.svg';
export const ZKEVM_MAINNET_IMAGE_URL = './images/polygon-zkevm.svg';
export const PULSECHAIN_MAINNET_IMAGE_URL = './images/pulse.svg';
export const SHARDEUM_LIBERTY_2X_IMAGE_URL = './images/shardeum-2.svg';
export const SHARDEUM_SPHINX_1X_IMAGE_URL = './images/shardeum-1.svg';
export const SHIB_MAINNET_IMAGE_URL = './images/shiba.svg';
export const SONGBIRD_MAINNET_IMAGE_URL = './images/songbird.svg';
export const STEP_NETWORK_IMAGE_URL = './images/step.svg';
export const TELOS_EVM_MAINNET_IMAGE_URL = './images/telos.svg';
export const TENET_MAINNET_IMAGE_URL = './images/tenet.svg';
export const VELAS_EVM_MAINNET_IMAGE_URL = './images/velas.svg';
export const ZKATANA_MAINNET_IMAGE_URL = './images/zkatana.png';
export const ZORA_MAINNET_IMAGE_URL = './images/zora.svg';
export const FILECOIN_MAINNET_IMAGE_URL = './images/filecoin.svg';
export const SCROLL_IMAGE_URL = './images/scroll.svg';
export const NUMBERS_MAINNET_IMAGE_URL = './images/numbers-mainnet.svg';
export const NUMBERS_TOKEN_IMAGE_URL = './images/numbers-token.png';
export const SEI_IMAGE_URL = './images/sei.svg';
export const NEAR_IMAGE_URL = './images/near.svg';
export const APE_IMAGE_URL = './images/ape.svg';
export const GRAVITY_ALPHA_MAINNET_IMAGE_URL = './images/gravity.svg';
export const GRAVITY_ALPHA_TESTNET_SEPOLIA_IMAGE_URL = './images/gravity.svg';

export const INFURA_PROVIDER_TYPES = [
  NETWORK_TYPES.MAINNET,
  NETWORK_TYPES.SEPOLIA,
  NETWORK_TYPES.LINEA_SEPOLIA,
  NETWORK_TYPES.LINEA_MAINNET,
] as const;

export const TEST_CHAINS = [
  CHAIN_IDS.SEPOLIA,
  CHAIN_IDS.LINEA_SEPOLIA,
  CHAIN_IDS.LOCALHOST,
];

export const MAINNET_CHAINS = [
  { chainId: CHAIN_IDS.MAINNET, rpcUrl: MAINNET_RPC_URL },
  { chainId: CHAIN_IDS.LINEA_MAINNET, rpcUrl: LINEA_MAINNET_RPC_URL },
];

const typedCapitalize = <K extends string>(k: K): Capitalize<K> =>
  capitalize(k) as Capitalize<typeof k>;

export const TEST_NETWORK_TICKER_MAP: {
  [K in Exclude<
    NetworkType,
    'localhost' | 'mainnet' | 'rpc' | 'linea-mainnet'
  >]: string;
} = {
  [NETWORK_TYPES.GOERLI]: `${typedCapitalize(NETWORK_TYPES.GOERLI)}${
    CURRENCY_SYMBOLS.ETH
  }`,
  [NETWORK_TYPES.SEPOLIA]: `${typedCapitalize(NETWORK_TYPES.SEPOLIA)}${
    CURRENCY_SYMBOLS.ETH
  }`,
  [NETWORK_TYPES.LINEA_GOERLI]: `Linea${CURRENCY_SYMBOLS.ETH}`,
  [NETWORK_TYPES.LINEA_SEPOLIA]: `Linea${CURRENCY_SYMBOLS.ETH}`,
};

/**
 * Map of all build-in Infura networks to their network, ticker and chain IDs.
 */
export const BUILT_IN_NETWORKS = {
  [NETWORK_TYPES.SEPOLIA]: {
    chainId: CHAIN_IDS.SEPOLIA,
    ticker: TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.SEPOLIA],
    blockExplorerUrl: `https://${NETWORK_TYPES.SEPOLIA}.etherscan.io`,
  },
  [NETWORK_TYPES.LINEA_SEPOLIA]: {
    chainId: CHAIN_IDS.LINEA_SEPOLIA,
    ticker: TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.LINEA_SEPOLIA],
    blockExplorerUrl: 'https://sepolia.lineascan.build',
  },
  [NETWORK_TYPES.MAINNET]: {
    chainId: CHAIN_IDS.MAINNET,
    blockExplorerUrl: `https://etherscan.io`,
    ticker: CURRENCY_SYMBOLS.ETH,
  },
  [NETWORK_TYPES.LINEA_MAINNET]: {
    chainId: CHAIN_IDS.LINEA_MAINNET,
    blockExplorerUrl: 'https://lineascan.build',
    ticker: CURRENCY_SYMBOLS.ETH,
  },
  [NETWORK_TYPES.LOCALHOST]: {
    chainId: CHAIN_IDS.LOCALHOST,
  },
} as const;

export const BUILT_IN_INFURA_NETWORKS = pick(
  BUILT_IN_NETWORKS,
  INFURA_PROVIDER_TYPES,
);

export type BuiltInInfuraNetwork = keyof typeof BUILT_IN_INFURA_NETWORKS;

// type SupportedNetworksType = {
//   [key: string]: {
//     domain: string;
//     subdomain: string;
//     networkId: string;
//   };
// };

export const NETWORK_TO_NAME_MAP = {
  [NETWORK_TYPES.GOERLI]: GOERLI_DISPLAY_NAME,
  [NETWORK_TYPES.MAINNET]: MAINNET_DISPLAY_NAME,
  [NETWORK_TYPES.LINEA_GOERLI]: LINEA_GOERLI_DISPLAY_NAME,
  [NETWORK_TYPES.LINEA_SEPOLIA]: LINEA_SEPOLIA_DISPLAY_NAME,
  [NETWORK_TYPES.LINEA_MAINNET]: LINEA_MAINNET_DISPLAY_NAME,
  [NETWORK_TYPES.LOCALHOST]: LOCALHOST_DISPLAY_NAME,
  [NETWORK_TYPES.SEPOLIA]: SEPOLIA_DISPLAY_NAME,

  [CHAIN_IDS.ARBITRUM]: ARBITRUM_DISPLAY_NAME,
  [CHAIN_IDS.AVALANCHE]: AVALANCHE_DISPLAY_NAME,
  [CHAIN_IDS.BSC]: BSC_DISPLAY_NAME,
  [CHAIN_IDS.BASE]: BASE_DISPLAY_NAME,
  [CHAIN_IDS.GOERLI]: GOERLI_DISPLAY_NAME,
  [CHAIN_IDS.MAINNET]: MAINNET_DISPLAY_NAME,
  [CHAIN_IDS.LINEA_GOERLI]: LINEA_GOERLI_DISPLAY_NAME,
  [CHAIN_IDS.LINEA_MAINNET]: LINEA_MAINNET_DISPLAY_NAME,
  [CHAIN_IDS.LINEA_SEPOLIA]: LINEA_SEPOLIA_DISPLAY_NAME,
  [CHAIN_IDS.LOCALHOST]: LOCALHOST_DISPLAY_NAME,
  [CHAIN_IDS.OPTIMISM]: OPTIMISM_DISPLAY_NAME,
  [CHAIN_IDS.POLYGON]: POLYGON_DISPLAY_NAME,
  [CHAIN_IDS.SCROLL]: SCROLL_DISPLAY_NAME,
  [CHAIN_IDS.SCROLL_SEPOLIA]: SCROLL_SEPOLIA_DISPLAY_NAME,
  [CHAIN_IDS.SEPOLIA]: SEPOLIA_DISPLAY_NAME,
  [CHAIN_IDS.OPBNB]: OP_BNB_DISPLAY_NAME,
  [CHAIN_IDS.ZKSYNC_ERA]: ZK_SYNC_ERA_DISPLAY_NAME,
  [CHAIN_IDS.BERACHAIN]: BERACHAIN_DISPLAY_NAME,
  [CHAIN_IDS.METACHAIN_ONE]: METACHAIN_ONE_DISPLAY_NAME,
} as const;

export const CHAIN_ID_TO_CURRENCY_SYMBOL_MAP = {
  [CHAINLIST_CHAIN_IDS_MAP.AVALANCHE]: CHAINLIST_CURRENCY_SYMBOLS_MAP.AVALANCHE,
  [CHAINLIST_CHAIN_IDS_MAP.APE]: CHAINLIST_CURRENCY_SYMBOLS_MAP.APE,
  [CHAINLIST_CHAIN_IDS_MAP.BSC]: CHAINLIST_CURRENCY_SYMBOLS_MAP.BNB,
  [CHAINLIST_CHAIN_IDS_MAP.BASE]: CHAINLIST_CURRENCY_SYMBOLS_MAP.BASE,
  [CHAINLIST_CHAIN_IDS_MAP.ARBITRUM]: CHAINLIST_CURRENCY_SYMBOLS_MAP.ARBITRUM,
  [CHAINLIST_CHAIN_IDS_MAP.LINEA_MAINNET]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.LINEA_MAINNET,
  [CHAINLIST_CHAIN_IDS_MAP.MAINNET]: CHAINLIST_CURRENCY_SYMBOLS_MAP.ETH,
  [CHAINLIST_CHAIN_IDS_MAP.OPBNB]: CHAINLIST_CURRENCY_SYMBOLS_MAP.OPBNB,
  [CHAINLIST_CHAIN_IDS_MAP.OPTIMISM]: CHAINLIST_CURRENCY_SYMBOLS_MAP.OPTIMISM,
  [CHAINLIST_CHAIN_IDS_MAP.POLYGON]: CHAINLIST_CURRENCY_SYMBOLS_MAP.POL,
  [CHAINLIST_CHAIN_IDS_MAP.ZKSYNC_ERA]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.ZKSYNC_ERA,
  [CHAINLIST_CHAIN_IDS_MAP.GOERLI]:
    TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.GOERLI],
  [CHAINLIST_CHAIN_IDS_MAP.SEPOLIA]:
    TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.SEPOLIA],
  [CHAINLIST_CHAIN_IDS_MAP.LINEA_GOERLI]:
    TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.LINEA_GOERLI],
  [CHAINLIST_CHAIN_IDS_MAP.LINEA_SEPOLIA]:
    TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.LINEA_SEPOLIA],
  [CHAINLIST_CHAIN_IDS_MAP.SCROLL]: CHAINLIST_CURRENCY_SYMBOLS_MAP.SCROLL,
  [CHAINLIST_CHAIN_IDS_MAP.ZORA_MAINNET]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.ZORA_MAINNET,
  [CHAINLIST_CHAIN_IDS_MAP.TAIKO_JOLNIR_L2_MAINNET]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.TAIKO_JOLNIR_L2_MAINNET,
  [CHAINLIST_CHAIN_IDS_MAP.POLYGON_ZKEVM]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.POLYGON_ZKEVM,
  [CHAINLIST_CHAIN_IDS_MAP.FANTOM_OPERA]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.FANTOM_OPERA,
  [CHAINLIST_CHAIN_IDS_MAP.CELO_MAINNET]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.CELO_MAINNET,
  [CHAINLIST_CHAIN_IDS_MAP.ARBITRUM_NOVA]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.ARBITRUM_NOVA,
  [CHAINLIST_CHAIN_IDS_MAP.MANTLE]: CHAINLIST_CURRENCY_SYMBOLS_MAP.MANTLE,
  [CHAINLIST_CHAIN_IDS_MAP.GNOSIS]: CHAINLIST_CURRENCY_SYMBOLS_MAP.GNOSIS,
  [CHAINLIST_CHAIN_IDS_MAP.CORE_BLOCKCHAIN_MAINNET]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.CORE_BLOCKCHAIN_MAINNET,
  [CHAINLIST_CHAIN_IDS_MAP.MANTA_PACIFIC_MAINNET]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.MANTA_PACIFIC_MAINNET,
  [CHAINLIST_CHAIN_IDS_MAP.PULSECHAIN_MAINNET]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.PULSECHAIN_MAINNET,
  [CHAINLIST_CHAIN_IDS_MAP.MOONBEAM]: CHAINLIST_CURRENCY_SYMBOLS_MAP.MOONBEAM,
  [CHAINLIST_CHAIN_IDS_MAP.FUSE_GOLD_MAINNET]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.FUSE_GOLD_MAINNET,
  [CHAINLIST_CHAIN_IDS_MAP.KAVA_EVM]: CHAINLIST_CURRENCY_SYMBOLS_MAP.KAVA_EVM,
  [CHAINLIST_CHAIN_IDS_MAP.DFK_CHAIN]: CHAINLIST_CURRENCY_SYMBOLS_MAP.DFK_CHAIN,
  [CHAINLIST_CHAIN_IDS_MAP.HARMONY_MAINNET_SHARD_0]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.HARMONY_MAINNET_SHARD_0,
  [CHAINLIST_CHAIN_IDS_MAP.PGN_PUBLIC_GOODS_NETWORK]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.PGN_PUBLIC_GOODS_NETWORK,
  [CHAINLIST_CHAIN_IDS_MAP.LIGHTLINK_PHOENIX_MAINNET]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.LIGHTLINK_PHOENIX_MAINNET,
  [CHAINLIST_CHAIN_IDS_MAP.NEAR_AURORA_MAINNET]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.NEAR_AURORA_MAINNET,
  [CHAINLIST_CHAIN_IDS_MAP.KROMA_MAINNET]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.KROMA_MAINNET,
  [CHAINLIST_CHAIN_IDS_MAP.NEBULA_MAINNET]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.NEBULA_MAINNET,
  [CHAINLIST_CHAIN_IDS_MAP.KLAYTN_MAINNET_CYPRESS]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.KLAYTN_MAINNET_CYPRESS,
  [CHAINLIST_CHAIN_IDS_MAP.MOONRIVER]: CHAINLIST_CURRENCY_SYMBOLS_MAP.MOONRIVER,
  [CHAINLIST_CHAIN_IDS_MAP.ENDURANCE_SMART_CHAIN_MAINNET]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.ENDURANCE_SMART_CHAIN_MAINNET,
  [CHAINLIST_CHAIN_IDS_MAP.CRONOS_MAINNET_BETA]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.CRONOS_MAINNET_BETA,
  [CHAINLIST_CHAIN_IDS_MAP.FLARE_MAINNET]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.FLARE_MAINNET,
  [CHAINLIST_CHAIN_IDS_MAP.KCC_MAINNET]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.KCC_MAINNET,
  [CHAINLIST_CHAIN_IDS_MAP.SHARDEUM_SPHINX_1X]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.SHARDEUM_SPHINX_1X,
  [CHAINLIST_CHAIN_IDS_MAP.ETHEREUM_CLASSIC_MAINNET]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.ETHEREUM_CLASSIC_MAINNET,
  [CHAINLIST_CHAIN_IDS_MAP.HAQQ_NETWORK]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.HAQQ_NETWORK,
  [CHAINLIST_CHAIN_IDS_MAP.SHARDEUM_LIBERTY_2X]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.SHARDEUM_LIBERTY_2X,
  [CHAINLIST_CHAIN_IDS_MAP.BLACKFORT_EXCHANGE_NETWORK]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.BLACKFORT_EXCHANGE_NETWORK,
  [CHAINLIST_CHAIN_IDS_MAP.CONFLUX_ESPACE]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.CONFLUX_ESPACE,
  [CHAINLIST_CHAIN_IDS_MAP.CANTO]: CHAINLIST_CURRENCY_SYMBOLS_MAP.CANTO,
  [CHAINLIST_CHAIN_IDS_MAP.SHIB_MAINNET]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.SHIB_MAINNET,
  [CHAINLIST_CHAIN_IDS_MAP.OKXCHAIN_MAINNET]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.OKXCHAIN_MAINNET,
  [CHAINLIST_CHAIN_IDS_MAP.ZKATANA]: CHAINLIST_CURRENCY_SYMBOLS_MAP.ZKATANA,
  [CHAINLIST_CHAIN_IDS_MAP.DEXALOT_SUBNET]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.DEXALOT_SUBNET,
  [CHAINLIST_CHAIN_IDS_MAP.ASTAR]: CHAINLIST_CURRENCY_SYMBOLS_MAP.ASTAR,
  [CHAINLIST_CHAIN_IDS_MAP.EVMOS]: CHAINLIST_CURRENCY_SYMBOLS_MAP.EVMOS,
  [CHAINLIST_CHAIN_IDS_MAP.BAHAMUT_MAINNET]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.BAHAMUT_MAINNET,
  [CHAINLIST_CHAIN_IDS_MAP.SONGBIRD_CANARY_NETWORK]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.SONGBIRD_CANARY_NETWORK,
  [CHAINLIST_CHAIN_IDS_MAP.STEP_NETWORK]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.STEP_NETWORK,
  [CHAINLIST_CHAIN_IDS_MAP.VELAS_EVM_MAINNET]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.VELAS_EVM_MAINNET,
  [CHAINLIST_CHAIN_IDS_MAP.Q_MAINNET]: CHAINLIST_CURRENCY_SYMBOLS_MAP.Q_MAINNET,
  [CHAINLIST_CHAIN_IDS_MAP.TELOS_EVM_MAINNET]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.TELOS_EVM_MAINNET,
  [CHAINLIST_CHAIN_IDS_MAP.TENET]: CHAINLIST_CURRENCY_SYMBOLS_MAP.TENET,
  [CHAINLIST_CHAIN_IDS_MAP.DOGECHAIN_MAINNET]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.DOGECHAIN_MAINNET,
  [CHAINLIST_CHAIN_IDS_MAP.OASYS_MAINNET]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.OASYS_MAINNET,
  [CHAINLIST_CHAIN_IDS_MAP.HUOBI_ECO_CHAIN_MAINNET]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.HUOBI_ECO_CHAIN_MAINNET,
  [CHAINLIST_CHAIN_IDS_MAP.ACALA_NETWORK]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.ACALA_NETWORK,
  [CHAINLIST_CHAIN_IDS_MAP.IOTEX_MAINNET]:
    CHAINLIST_CURRENCY_SYMBOLS_MAP.IOTEX_MAINNET,
} as const;

/**
 * A mapping for networks with chain ID collisions to their currencies symbols.
 * Useful for networks not listed on https://chainid.network/chains.json due to ID conflicts.
 */
export const CHAIN_ID_TO_CURRENCY_SYMBOL_MAP_NETWORK_COLLISION = {
  [CHAINLIST_CHAIN_IDS_MAP.CHZ]: [
    {
      currencySymbol: CHAINLIST_CURRENCY_SYMBOLS_MAP_NETWORK_COLLISION.CHZ,
    },
  ],
  [CHAINLIST_CHAIN_IDS_MAP.WETHIO]: [
    {
      currencySymbol: CHAINLIST_CURRENCY_SYMBOLS_MAP_NETWORK_COLLISION.WETHIO,
    },
  ],
};

export const CHAIN_ID_TO_TYPE_MAP = {
  [CHAIN_IDS.MAINNET]: NETWORK_TYPES.MAINNET,
  [CHAIN_IDS.GOERLI]: NETWORK_TYPES.GOERLI,
  [CHAIN_IDS.SEPOLIA]: NETWORK_TYPES.SEPOLIA,
  [CHAIN_IDS.LINEA_GOERLI]: NETWORK_TYPES.LINEA_GOERLI,
  [CHAIN_IDS.LINEA_SEPOLIA]: NETWORK_TYPES.LINEA_SEPOLIA,
  [CHAIN_IDS.LINEA_MAINNET]: NETWORK_TYPES.LINEA_MAINNET,
  [CHAIN_IDS.LOCALHOST]: NETWORK_TYPES.LOCALHOST,
} as const;

export const CHAIN_ID_TO_RPC_URL_MAP = {
  [CHAIN_IDS.GOERLI]: GOERLI_RPC_URL,
  [CHAIN_IDS.SEPOLIA]: SEPOLIA_RPC_URL,
  [CHAIN_IDS.LINEA_GOERLI]: LINEA_GOERLI_RPC_URL,
  [CHAIN_IDS.LINEA_SEPOLIA]: LINEA_SEPOLIA_RPC_URL,
  [CHAIN_IDS.MAINNET]: MAINNET_RPC_URL,
  [CHAIN_IDS.LINEA_MAINNET]: LINEA_MAINNET_RPC_URL,
  [CHAIN_IDS.LOCALHOST]: LOCALHOST_RPC_URL,
} as const;

export const CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP = {
  [CHAIN_IDS.MAINNET]: ETH_TOKEN_IMAGE_URL,
  [CHAIN_IDS.LINEA_GOERLI]: LINEA_GOERLI_TOKEN_IMAGE_URL,
  [CHAIN_IDS.LINEA_SEPOLIA]: LINEA_SEPOLIA_TOKEN_IMAGE_URL,
  [CHAIN_IDS.LINEA_MAINNET]: LINEA_MAINNET_TOKEN_IMAGE_URL,
  [CHAIN_IDS.AVALANCHE]: AVAX_TOKEN_IMAGE_URL,
  [CHAIN_IDS.BSC]: BNB_TOKEN_IMAGE_URL,
  [CHAIN_IDS.POLYGON]: POL_TOKEN_IMAGE_URL,
  [CHAIN_IDS.ARBITRUM]: AETH_TOKEN_IMAGE_URL,
  [CHAIN_IDS.FANTOM]: FTM_TOKEN_IMAGE_URL,
  [CHAIN_IDS.HARMONY]: HARMONY_ONE_TOKEN_IMAGE_URL,
  [CHAIN_IDS.OPTIMISM]: OPTIMISM_TOKEN_IMAGE_URL,
  [CHAIN_IDS.PALM]: PALM_TOKEN_IMAGE_URL,
  [CHAIN_IDS.CELO]: CELO_TOKEN_IMAGE_URL,
  [CHAIN_IDS.GNOSIS]: GNOSIS_TOKEN_IMAGE_URL,
  [CHAIN_IDS.ZKSYNC_ERA]: ZK_SYNC_ERA_TOKEN_IMAGE_URL,
  [CHAIN_IDS.NEAR]: NEAR_IMAGE_URL,
  [CHAIN_IDS.NEAR_TESTNET]: NEAR_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.ACALA_NETWORK]: ACALA_TOKEN_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.ARBITRUM_NOVA]: ARBITRUM_NOVA_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.ASTAR]: ASTAR_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.BAHAMUT_MAINNET]: BAHAMUT_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.BLACKFORT_EXCHANGE_NETWORK]: BLACKFORT_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.CANTO]: CANTO_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.CONFLUX_ESPACE]: CONFLUX_ESPACE_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.CORE_BLOCKCHAIN_MAINNET]:
    CORE_BLOCKCHAIN_MAINNET_IMAGE_URL,
  [CHAIN_IDS.CRONOS]: CRONOS_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.DEXALOT_SUBNET]: DEXALOT_SUBNET_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.DFK_CHAIN]: DFK_CHAIN_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.DOGECHAIN_MAINNET]: DOGECHAIN_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.ENDURANCE_SMART_CHAIN_MAINNET]:
    ENDURANCE_SMART_CHAIN_MAINNET_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.ETHEREUM_CLASSIC_MAINNET]:
    ETHEREUM_CLASSIC_MAINNET_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.EVMOS]: EVMOS_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.FLARE_MAINNET]: FLARE_MAINNET_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.FUSE_GOLD_MAINNET]: FUSE_GOLD_MAINNET_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.IOTEX_MAINNET]: IOTEX_MAINNET_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.HAQQ_NETWORK]: HAQQ_NETWORK_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.KCC_MAINNET]: KCC_MAINNET_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.KLAYTN_MAINNET_CYPRESS]: KLAYTN_MAINNET_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.KROMA_MAINNET]: KROMA_MAINNET_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.LIGHTLINK_PHOENIX_MAINNET]: LIGHT_LINK_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.MANTA_PACIFIC_MAINNET]:
    MANTA_PACIFIC_MAINNET_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.MANTLE]: MANTLE_MAINNET_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.MOONBEAM]: MOONBEAM_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.MOONRIVER]: MOONRIVER_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.NEAR_AURORA_MAINNET]: NEAR_AURORA_MAINNET_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.NEBULA_MAINNET]: NEBULA_MAINNET_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.OASYS_MAINNET]: OASYS_MAINNET_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.OKXCHAIN_MAINNET]: OKXCHAIN_MAINNET_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.PGN_PUBLIC_GOODS_NETWORK]: PGN_MAINNET_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.POLYGON_ZKEVM]: ZKEVM_MAINNET_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.PULSECHAIN_MAINNET]: PULSECHAIN_MAINNET_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.SHARDEUM_LIBERTY_2X]: SHARDEUM_LIBERTY_2X_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.SHARDEUM_SPHINX_1X]: SHARDEUM_SPHINX_1X_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.SHIB_MAINNET]: SHIB_MAINNET_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.SONGBIRD_CANARY_NETWORK]: SONGBIRD_MAINNET_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.STEP_NETWORK]: STEP_NETWORK_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.TELOS_EVM_MAINNET]: TELOS_EVM_MAINNET_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.TENET]: TENET_MAINNET_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.VELAS_EVM_MAINNET]: VELAS_EVM_MAINNET_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.ZKATANA]: ZKATANA_MAINNET_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.ZORA_MAINNET]: ZORA_MAINNET_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.FILECOIN]: FILECOIN_MAINNET_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.APE_TESTNET]: APE_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.APE_MAINNET]: APE_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.BASE]: BASE_TOKEN_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.NUMBERS]: NUMBERS_MAINNET_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.SEI]: SEI_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.GRAVITY_ALPHA_MAINNET]:
    GRAVITY_ALPHA_MAINNET_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.GRAVITY_ALPHA_TESTNET_SEPOLIA]:
    GRAVITY_ALPHA_TESTNET_SEPOLIA_IMAGE_URL,
} as const;

export const CHAIN_ID_TO_ETHERS_NETWORK_NAME_MAP = {
  [CHAIN_IDS.GOERLI]: NETWORK_TYPES.GOERLI,
  [CHAIN_IDS.SEPOLIA]: NETWORK_TYPES.SEPOLIA,
  [CHAIN_IDS.LINEA_GOERLI]: NETWORK_TYPES.LINEA_GOERLI,
  [CHAIN_IDS.LINEA_SEPOLIA]: NETWORK_TYPES.LINEA_SEPOLIA,
  [CHAIN_IDS.MAINNET]: NETWORK_NAMES.HOMESTEAD,
  [CHAIN_IDS.LINEA_MAINNET]: NETWORK_TYPES.LINEA_MAINNET,
} as const;

export const CHAIN_ID_TOKEN_IMAGE_MAP = {
  [CHAIN_IDS.MAINNET]: ETH_TOKEN_IMAGE_URL,
  [CHAIN_IDS.TEST_ETH]: TEST_ETH_TOKEN_IMAGE_URL,
  [CHAIN_IDS.ARBITRUM]: ETH_TOKEN_IMAGE_URL,
  [CHAIN_IDS.BASE]: ETH_TOKEN_IMAGE_URL,
  [CHAIN_IDS.LINEA_MAINNET]: ETH_TOKEN_IMAGE_URL,
  [CHAIN_IDS.BSC]: BNB_TOKEN_IMAGE_URL,
  [CHAIN_IDS.POLYGON]: POL_TOKEN_IMAGE_URL,
  [CHAIN_IDS.AVALANCHE]: AVAX_TOKEN_IMAGE_URL,
  [CHAIN_IDS.OPTIMISM]: ETH_TOKEN_IMAGE_URL,
  [CHAIN_IDS.CELO]: CELO_TOKEN_IMAGE_URL,
  [CHAIN_IDS.GNOSIS]: GNOSIS_TOKEN_IMAGE_URL,
  [CHAIN_IDS.FANTOM]: FTM_TOKEN_IMAGE_URL,
  [CHAIN_IDS.FILECOIN]: FILECOIN_MAINNET_IMAGE_URL,
  [CHAIN_IDS.SCROLL]: SCROLL_IMAGE_URL,
  [CHAIN_IDS.SCROLL_SEPOLIA]: SCROLL_IMAGE_URL,
  [CHAIN_IDS.NUMBERS]: NUMBERS_TOKEN_IMAGE_URL,
  [CHAIN_IDS.SEI]: SEI_IMAGE_URL,
  [CHAIN_IDS.NEAR]: NEAR_IMAGE_URL,
  [CHAIN_IDS.NEAR_TESTNET]: NEAR_IMAGE_URL,
  [CHAIN_IDS.MOONRIVER]: MOONRIVER_TOKEN_IMAGE_URL,
  [CHAIN_IDS.MOONBEAM]: MOONBEAM_TOKEN_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.IOTEX_MAINNET]: IOTEX_TOKEN_IMAGE_URL,
  [CHAINLIST_CHAIN_IDS_MAP.APE_MAINNET]: APE_TOKEN_IMAGE_URL,
  [CHAIN_IDS.GRAVITY_ALPHA_MAINNET]: GRAVITY_ALPHA_MAINNET_IMAGE_URL,
  [CHAIN_IDS.GRAVITY_ALPHA_TESTNET_SEPOLIA]:
    GRAVITY_ALPHA_TESTNET_SEPOLIA_IMAGE_URL,
} as const;

export const INFURA_BLOCKED_KEY = 'countryBlocked';

const defaultEtherscanDomain = 'etherscan.io';
const defaultEtherscanSubdomainPrefix = 'api';

/**
 * Map of all Etherscan supported networks.
 */
export const ETHERSCAN_SUPPORTED_NETWORKS = {
  [CHAIN_IDS.GOERLI]: {
    domain: defaultEtherscanDomain,
    subdomain: `${defaultEtherscanSubdomainPrefix}-${
      CHAIN_ID_TO_TYPE_MAP[CHAIN_IDS.GOERLI]
    }`,
  },
  [CHAIN_IDS.MAINNET]: {
    domain: defaultEtherscanDomain,
    subdomain: defaultEtherscanSubdomainPrefix,
  },
  [CHAIN_IDS.SEPOLIA]: {
    domain: defaultEtherscanDomain,
    subdomain: `${defaultEtherscanSubdomainPrefix}-${
      CHAIN_ID_TO_TYPE_MAP[CHAIN_IDS.SEPOLIA]
    }`,
  },
  [CHAIN_IDS.LINEA_GOERLI]: {
    domain: 'lineascan.build',
    subdomain: 'goerli',
  },
  [CHAIN_IDS.LINEA_SEPOLIA]: {
    domain: 'lineascan.build',
    subdomain: 'sepolia',
  },
  [CHAIN_IDS.LINEA_MAINNET]: {
    domain: 'lineascan.build',
    subdomain: defaultEtherscanSubdomainPrefix,
  },
  [CHAIN_IDS.BSC]: {
    domain: 'bscscan.com',
    subdomain: defaultEtherscanSubdomainPrefix,
  },
  [CHAIN_IDS.BSC_TESTNET]: {
    domain: 'bscscan.com',
    subdomain: `${defaultEtherscanSubdomainPrefix}-testnet`,
  },
  [CHAIN_IDS.OPTIMISM]: {
    domain: defaultEtherscanDomain,
    subdomain: `${defaultEtherscanSubdomainPrefix}-optimistic`,
  },
  [CHAIN_IDS.OPTIMISM_TESTNET]: {
    domain: defaultEtherscanDomain,
    subdomain: `${defaultEtherscanSubdomainPrefix}-sepolia-optimistic`,
  },
  [CHAIN_IDS.POLYGON]: {
    domain: 'polygonscan.com',
    subdomain: defaultEtherscanSubdomainPrefix,
  },
  [CHAIN_IDS.POLYGON_TESTNET]: {
    domain: 'polygonscan.com',
    subdomain: `${defaultEtherscanSubdomainPrefix}-mumbai`,
  },
  [CHAIN_IDS.AVALANCHE]: {
    domain: 'snowtrace.io',
    subdomain: defaultEtherscanSubdomainPrefix,
  },
  [CHAIN_IDS.AVALANCHE_TESTNET]: {
    domain: 'snowtrace.io',
    subdomain: `${defaultEtherscanSubdomainPrefix}-testnet`,
  },
  [CHAIN_IDS.FANTOM]: {
    domain: 'ftmscan.com',
    subdomain: defaultEtherscanSubdomainPrefix,
  },
  [CHAIN_IDS.FANTOM_TESTNET]: {
    domain: 'ftmscan.com',
    subdomain: `${defaultEtherscanSubdomainPrefix}-testnet`,
  },
  [CHAIN_IDS.MOONBEAM]: {
    domain: 'moonscan.io',
    subdomain: `${defaultEtherscanSubdomainPrefix}-moonbeam`,
  },
  [CHAIN_IDS.MOONBEAM_TESTNET]: {
    domain: 'moonscan.io',
    subdomain: `${defaultEtherscanSubdomainPrefix}-moonbase`,
  },
  [CHAIN_IDS.MOONRIVER]: {
    domain: 'moonscan.io',
    subdomain: `${defaultEtherscanSubdomainPrefix}-moonriver`,
  },
  [CHAIN_IDS.GNOSIS]: {
    domain: 'gnosisscan.io',
    subdomain: `${defaultEtherscanSubdomainPrefix}-gnosis`,
  },
};

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

export const FEATURED_RPCS: AddNetworkFields[] = [
  {
    chainId: CHAIN_IDS.LINEA_MAINNET,
    name: LINEA_MAINNET_DISPLAY_NAME,
    nativeCurrency: CURRENCY_SYMBOLS.ETH,
    rpcEndpoints: [
      {
        url: `https://linea-mainnet.infura.io/v3/${infuraProjectId}`,
        type: RpcEndpointType.Custom,
      },
    ],
    defaultRpcEndpointIndex: 0,
    blockExplorerUrls: ['https://lineascan.build/'],
    defaultBlockExplorerUrlIndex: 0,
  },
  {
    chainId: CHAIN_IDS.ARBITRUM,
    name: ARBITRUM_DISPLAY_NAME,
    nativeCurrency: CURRENCY_SYMBOLS.ARBITRUM,
    rpcEndpoints: [
      {
        url: `https://arbitrum-mainnet.infura.io/v3/${infuraProjectId}`,
        type: RpcEndpointType.Custom,
      },
    ],
    defaultRpcEndpointIndex: 0,
    blockExplorerUrls: ['https://explorer.arbitrum.io'],
    defaultBlockExplorerUrlIndex: 0,
  },
  {
    chainId: CHAIN_IDS.AVALANCHE,
    name: AVALANCHE_DISPLAY_NAME,
    nativeCurrency: CURRENCY_SYMBOLS.AVALANCHE,
    rpcEndpoints: [
      {
        url: `https://avalanche-mainnet.infura.io/v3/${infuraProjectId}`,
        type: RpcEndpointType.Custom,
      },
    ],
    defaultRpcEndpointIndex: 0,
    blockExplorerUrls: ['https://snowtrace.io/'],
    defaultBlockExplorerUrlIndex: 0,
  },
  {
    chainId: CHAIN_IDS.BSC,
    name: BSC_DISPLAY_NAME,
    nativeCurrency: CURRENCY_SYMBOLS.BNB,
    rpcEndpoints: [
      {
        url: 'https://bsc-dataseed.binance.org/',
        type: RpcEndpointType.Custom,
      },
    ],
    defaultRpcEndpointIndex: 0,
    blockExplorerUrls: ['https://bscscan.com/'],
    defaultBlockExplorerUrlIndex: 0,
  },
  {
    chainId: CHAIN_IDS.OPTIMISM,
    name: OPTIMISM_DISPLAY_NAME,
    nativeCurrency: CURRENCY_SYMBOLS.ETH,
    rpcEndpoints: [
      {
        url: `https://optimism-mainnet.infura.io/v3/${infuraProjectId}`,
        type: RpcEndpointType.Custom,
      },
    ],
    defaultRpcEndpointIndex: 0,
    blockExplorerUrls: ['https://optimistic.etherscan.io/'],
    defaultBlockExplorerUrlIndex: 0,
  },
  {
    chainId: CHAIN_IDS.POLYGON,
    name: `${POLYGON_DISPLAY_NAME} ${capitalize(NETWORK_TYPES.MAINNET)}`,
    nativeCurrency: CURRENCY_SYMBOLS.POL,
    rpcEndpoints: [
      {
        url: `https://polygon-mainnet.infura.io/v3/${infuraProjectId}`,
        type: RpcEndpointType.Custom,
      },
    ],
    defaultRpcEndpointIndex: 0,
    blockExplorerUrls: ['https://polygonscan.com/'],
    defaultBlockExplorerUrlIndex: 0,
  },
  {
    chainId: CHAIN_IDS.ZKSYNC_ERA,
    name: ZK_SYNC_ERA_DISPLAY_NAME,
    nativeCurrency: CURRENCY_SYMBOLS.ETH,
    rpcEndpoints: [
      {
        url: `https://mainnet.era.zksync.io`,
        type: RpcEndpointType.Custom,
      },
    ],
    defaultRpcEndpointIndex: 0,
    blockExplorerUrls: ['https://explorer.zksync.io/'],
    defaultBlockExplorerUrlIndex: 0,
  },
  {
    chainId: CHAIN_IDS.BASE,
    name: BASE_DISPLAY_NAME,
    nativeCurrency: CURRENCY_SYMBOLS.ETH,
    rpcEndpoints: [
      {
        url: `https://mainnet.base.org`,
        type: RpcEndpointType.Custom,
      },
    ],
    defaultRpcEndpointIndex: 0,
    blockExplorerUrls: ['https://basescan.org'],
    defaultBlockExplorerUrlIndex: 0,
  },
];

/**
 * Represents the availability state of the currently selected network.
 */
export enum NetworkStatus {
  /**
   * The network may or may not be able to receive requests, but either no
   * attempt has been made to determine this, or an attempt was made but was
   * unsuccessful.
   */
  Unknown = 'unknown',
  /**
   * The network is able to receive and respond to requests.
   */
  Available = 'available',
  /**
   * The network is unable to receive and respond to requests for unknown
   * reasons.
   */
  Unavailable = 'unavailable',
  /**
   * The network is not only unavailable, but is also inaccessible for the user
   * specifically based on their location. This state only applies to Infura
   * networks.
   */
  Blocked = 'blocked',
}

export const TEST_NETWORKS = [
  GOERLI_DISPLAY_NAME,
  SEPOLIA_DISPLAY_NAME,
  LINEA_GOERLI_DISPLAY_NAME,
  LINEA_SEPOLIA_DISPLAY_NAME,
];

export const TEST_NETWORK_IDS = [
  CHAIN_IDS.GOERLI,
  CHAIN_IDS.SEPOLIA,
  CHAIN_IDS.LINEA_GOERLI,
  CHAIN_IDS.LINEA_SEPOLIA,
  CHAIN_IDS.ARBITRUM_SEPOLIA,
];
