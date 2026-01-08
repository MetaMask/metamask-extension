import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import {
  BRIDGE_DEV_API_BASE_URL,
  BRIDGE_PROD_API_BASE_URL,
  ChainId,
  formatChainIdToCaip,
} from '@metamask/bridge-controller';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import { type CaipAssetType } from '@metamask/utils';
import { MultichainNetworks } from './multichain/networks';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  CHAIN_IDS,
  NETWORK_TO_NAME_MAP,
} from './network';

export const ALLOWED_MULTICHAIN_BRIDGE_CHAIN_IDS = [
  MultichainNetworks.SOLANA,
  ///: BEGIN:ONLY_INCLUDE_IF(bitcoin-swaps)
  MultichainNetworks.BITCOIN,
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(tron)
  MultichainNetworks.TRON,
  ///: END:ONLY_INCLUDE_IF
];

const ALLOWED_EVM_BRIDGE_CHAIN_IDS = [
  CHAIN_IDS.MAINNET,
  CHAIN_IDS.BSC,
  CHAIN_IDS.POLYGON,
  CHAIN_IDS.ZKSYNC_ERA,
  CHAIN_IDS.AVALANCHE,
  CHAIN_IDS.OPTIMISM,
  CHAIN_IDS.ARBITRUM,
  CHAIN_IDS.LINEA_MAINNET,
  CHAIN_IDS.BASE,
  CHAIN_IDS.SEI,
  CHAIN_IDS.MONAD,
];

export const ALLOWED_BRIDGE_CHAIN_IDS = [
  ...ALLOWED_MULTICHAIN_BRIDGE_CHAIN_IDS,
  ...ALLOWED_EVM_BRIDGE_CHAIN_IDS,
  CHAIN_IDS.LINEA_MAINNET,
  CHAIN_IDS.BASE,
  MultichainNetworks.SOLANA,
  MultichainNetworks.BITCOIN,
  ///: BEGIN:ONLY_INCLUDE_IF(tron)
  MultichainNetworks.TRON,
  ///: END:ONLY_INCLUDE_IF
] as const;

export const ALLOWED_BRIDGE_CHAIN_IDS_IN_CAIP =
  ALLOWED_EVM_BRIDGE_CHAIN_IDS.map(toEvmCaipChainId).concat(
    ALLOWED_MULTICHAIN_BRIDGE_CHAIN_IDS,
  );

export const ALL_ALLOWED_BRIDGE_CHAIN_IDS = [
  ...ALLOWED_BRIDGE_CHAIN_IDS,
  ...ALLOWED_BRIDGE_CHAIN_IDS_IN_CAIP,
  ...Object.values(ChainId),
];

export type AllowedBridgeChainIds =
  | (typeof ALLOWED_BRIDGE_CHAIN_IDS)[number]
  | (typeof ALLOWED_BRIDGE_CHAIN_IDS_IN_CAIP)[number];

export const BRIDGE_API_BASE_URL = process.env.BRIDGE_USE_DEV_APIS
  ? BRIDGE_DEV_API_BASE_URL
  : BRIDGE_PROD_API_BASE_URL;

export const BRIDGE_CHAIN_ID_TO_NETWORK_IMAGE_MAP: Record<
  (typeof ALLOWED_BRIDGE_CHAIN_IDS_IN_CAIP)[number],
  string
> = ALLOWED_BRIDGE_CHAIN_IDS.reduce(
  (acc, chainId) => {
    acc[formatChainIdToCaip(chainId)] =
      CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[chainId];
    return acc;
  },
  {} as Record<(typeof ALLOWED_BRIDGE_CHAIN_IDS_IN_CAIP)[number], string>,
);

export const NETWORK_TO_SHORT_NETWORK_NAME_MAP: Record<
  AllowedBridgeChainIds,
  string
> = {
  [CHAIN_IDS.MAINNET]: 'Ethereum',
  [toEvmCaipChainId(CHAIN_IDS.MAINNET)]: 'Ethereum',
  [CHAIN_IDS.LINEA_MAINNET]: 'Linea',
  [toEvmCaipChainId(CHAIN_IDS.LINEA_MAINNET)]: 'Linea',
  [CHAIN_IDS.POLYGON]: NETWORK_TO_NAME_MAP[CHAIN_IDS.POLYGON],
  [toEvmCaipChainId(CHAIN_IDS.POLYGON)]: NETWORK_TO_NAME_MAP[CHAIN_IDS.POLYGON],
  [CHAIN_IDS.AVALANCHE]: 'Avalanche',
  [toEvmCaipChainId(CHAIN_IDS.AVALANCHE)]: 'Avalanche',
  [CHAIN_IDS.BSC]: NETWORK_TO_NAME_MAP[CHAIN_IDS.BSC],
  [toEvmCaipChainId(CHAIN_IDS.BSC)]: NETWORK_TO_NAME_MAP[CHAIN_IDS.BSC],
  [CHAIN_IDS.ARBITRUM]: NETWORK_TO_NAME_MAP[CHAIN_IDS.ARBITRUM],
  [toEvmCaipChainId(CHAIN_IDS.ARBITRUM)]:
    NETWORK_TO_NAME_MAP[CHAIN_IDS.ARBITRUM],
  [CHAIN_IDS.OPTIMISM]: NETWORK_TO_NAME_MAP[CHAIN_IDS.OPTIMISM],
  [toEvmCaipChainId(CHAIN_IDS.OPTIMISM)]:
    NETWORK_TO_NAME_MAP[CHAIN_IDS.OPTIMISM],
  [CHAIN_IDS.ZKSYNC_ERA]: 'ZkSync Era',
  [toEvmCaipChainId(CHAIN_IDS.ZKSYNC_ERA)]: 'ZkSync Era',
  [CHAIN_IDS.BASE]: 'Base',
  [toEvmCaipChainId(CHAIN_IDS.BASE)]: 'Base',
  [CHAIN_IDS.SEI]: 'Sei',
  [toEvmCaipChainId(CHAIN_IDS.SEI)]: 'Sei',
  [CHAIN_IDS.MONAD]: 'Monad',
  [toEvmCaipChainId(CHAIN_IDS.MONAD)]: 'Monad',
  [MultichainNetworks.SOLANA]: 'Solana',
  [MultichainNetworks.SOLANA_TESTNET]: 'Solana Testnet',
  [MultichainNetworks.SOLANA_DEVNET]: 'Solana Devnet',
  ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
  [MultichainNetworks.BITCOIN]: 'Bitcoin',
  [MultichainNetworks.BITCOIN_TESTNET]: 'Bitcoin Testnet',
  [MultichainNetworks.BITCOIN_SIGNET]: 'Bitcoin Mutinynet',
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(tron)
  [MultichainNetworks.TRON]: 'Tron',
  ///: END:ONLY_INCLUDE_IF
};

export const STATIC_METAMASK_BASE_URL = 'https://static.cx.metamask.io';

export const BRIDGE_CHAINID_COMMON_TOKEN_PAIR: Partial<
  Record<
    (typeof ALLOWED_BRIDGE_CHAIN_IDS_IN_CAIP)[number],
    {
      address: string;
      symbol: string;
      decimals: number;
      name: string;
      assetId: CaipAssetType;
    }
  >
> = {
  [toEvmCaipChainId(CHAIN_IDS.MAINNET)]: {
    // ETH -> mUSD on mainnet
    address: '0xaca92e438df0b2401ff60da7e4337b687a2435da',
    symbol: 'mUSD',
    decimals: 6,
    name: 'MetaMask USD',
    assetId: `${toEvmCaipChainId(CHAIN_IDS.MAINNET)}/erc20:${toChecksumHexAddress('0xaca92e438df0b2401ff60da7e4337b687a2435da')}`,
  },
  [toEvmCaipChainId(CHAIN_IDS.OPTIMISM)]: {
    // ETH -> USDC on Optimism
    address: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
    symbol: 'USDC',
    decimals: 6,
    name: 'USD Coin',
    assetId: `${toEvmCaipChainId(CHAIN_IDS.OPTIMISM)}/erc20:${toChecksumHexAddress('0x0b2c639c533813f4aa9d7837caf62653d097ff85')}`,
  },
  [toEvmCaipChainId(CHAIN_IDS.ARBITRUM)]: {
    // ETH -> USDC on Arbitrum
    address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
    symbol: 'USDC',
    decimals: 6,
    name: 'USD Coin',
    assetId: `${toEvmCaipChainId(CHAIN_IDS.ARBITRUM)}/erc20:${toChecksumHexAddress('0xaf88d065e77c8cc2239327c5edb3a432268e5831')}`,
  },
  [toEvmCaipChainId(CHAIN_IDS.BASE)]: {
    // ETH -> USDC on Base
    address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    symbol: 'USDC',
    decimals: 6,
    name: 'USD Coin',
    assetId: `${toEvmCaipChainId(CHAIN_IDS.BASE)}/erc20:${toChecksumHexAddress('0x833589fcd6edb6e08f4c7c32d4f71b54bda02913')}`,
  },
  [toEvmCaipChainId(CHAIN_IDS.POLYGON)]: {
    // POL -> USDT on Polygon
    address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
    symbol: 'USDT',
    decimals: 6,
    name: 'Tether USD',
    assetId: `${toEvmCaipChainId(CHAIN_IDS.POLYGON)}/erc20:${toChecksumHexAddress('0xc2132d05d31c914a87c6611c10748aeb04b58e8f')}`,
  },
  [toEvmCaipChainId(CHAIN_IDS.BSC)]: {
    // BNB -> USDT on BSC
    address: '0x55d398326f99059ff775485246999027b3197955',
    symbol: 'USDT',
    decimals: 18,
    name: 'Tether USD',
    assetId: `${toEvmCaipChainId(CHAIN_IDS.BSC)}/erc20:${toChecksumHexAddress('0x55d398326f99059ff775485246999027b3197955')}`,
  },
  [toEvmCaipChainId(CHAIN_IDS.AVALANCHE)]: {
    // AVAX -> USDC on Avalanche
    address: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e',
    symbol: 'USDC',
    decimals: 6,
    name: 'USD Coin',
    assetId: `${toEvmCaipChainId(CHAIN_IDS.AVALANCHE)}/erc20:${toChecksumHexAddress('0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e')}`,
  },
  [toEvmCaipChainId(CHAIN_IDS.ZKSYNC_ERA)]: {
    // ETH -> USDT on zkSync Era
    address: '0x493257fd37edb34451f62edf8d2a0c418852ba4c',
    symbol: 'USDT',
    decimals: 6,
    name: 'Tether USD',
    assetId: `${toEvmCaipChainId(CHAIN_IDS.ZKSYNC_ERA)}/erc20:${toChecksumHexAddress('0x493257fd37edb34451f62edf8d2a0c418852ba4c')}`,
  },
  [toEvmCaipChainId(CHAIN_IDS.LINEA_MAINNET)]: {
    // ETH -> mUSD on Linea
    address: '0xaca92e438df0b2401ff60da7e4337b687a2435da',
    symbol: 'mUSD',
    decimals: 6,
    name: 'MetaMask USD',
    assetId: `${toEvmCaipChainId(CHAIN_IDS.LINEA_MAINNET)}/erc20:${toChecksumHexAddress('0xaca92e438df0b2401ff60da7e4337b687a2435da')}`,
  },
  [toEvmCaipChainId(CHAIN_IDS.SEI)]: {
    // SEI -> USDC on Sei
    address: '0xe15fC38F6D8c56aF07bbCBe3BAf5708A2Bf42392',
    symbol: 'USDC',
    decimals: 6,
    name: 'USD Coin',
    assetId: `${toEvmCaipChainId(CHAIN_IDS.SEI)}/erc20:${toChecksumHexAddress('0xe15fC38F6D8c56aF07bbCBe3BAf5708A2Bf42392')}`,
  },
  [toEvmCaipChainId(CHAIN_IDS.MONAD)]: {
    // MON -> USDC on Monad
    address: '0x754704Bc059F8C67012fEd69BC8A327a5aafb603',
    symbol: 'USDC',
    decimals: 6,
    name: 'USD Coin',
    assetId: `${toEvmCaipChainId(CHAIN_IDS.MONAD)}/erc20:${toChecksumHexAddress('0x754704Bc059F8C67012fEd69BC8A327a5aafb603')}`,
  },
  [MultichainNetworks.SOLANA]: {
    // SOL -> USDC on Solana
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: 'USDC',
    decimals: 6,
    name: 'USD Coin',
    assetId: `${MultichainNetworks.SOLANA}/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`,
  },
  ///: BEGIN:ONLY_INCLUDE_IF(tron)
  [MultichainNetworks.TRON]: {
    // TRX -> USDT on Tron
    address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    symbol: 'USDT',
    decimals: 6,
    name: 'Tether USD',
    assetId: `${MultichainNetworks.TRON}/trc20:TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t`,
  },
  ///: END:ONLY_INCLUDE_IF
} as const;
