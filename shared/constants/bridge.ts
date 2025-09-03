import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import {
  BRIDGE_DEV_API_BASE_URL,
  BRIDGE_PROD_API_BASE_URL,
} from '@metamask/bridge-controller';
import { MultichainNetworks } from './multichain/networks';
import { CHAIN_IDS, NETWORK_TO_NAME_MAP } from './network';

const ALLOWED_MULTICHAIN_BRIDGE_CHAIN_IDS = [
  MultichainNetworks.SOLANA,
  ///: BEGIN:ONLY_INCLUDE_IF(bitcoin-swaps)
  MultichainNetworks.BITCOIN,
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
];

export const ALLOWED_BRIDGE_CHAIN_IDS = [
  ...ALLOWED_MULTICHAIN_BRIDGE_CHAIN_IDS,
  ...ALLOWED_EVM_BRIDGE_CHAIN_IDS,
  CHAIN_IDS.LINEA_MAINNET,
  CHAIN_IDS.BASE,
  MultichainNetworks.SOLANA,
];

export const ALLOWED_BRIDGE_CHAIN_IDS_IN_CAIP =
  ALLOWED_EVM_BRIDGE_CHAIN_IDS.map(toEvmCaipChainId).concat(
    ALLOWED_MULTICHAIN_BRIDGE_CHAIN_IDS,
  );

export type AllowedBridgeChainIds =
  | (typeof ALLOWED_BRIDGE_CHAIN_IDS)[number]
  | (typeof ALLOWED_BRIDGE_CHAIN_IDS_IN_CAIP)[number];

export const BRIDGE_API_BASE_URL = process.env.BRIDGE_USE_DEV_APIS
  ? BRIDGE_DEV_API_BASE_URL
  : BRIDGE_PROD_API_BASE_URL;

export const ETH_USDT_ADDRESS = '0xdac17f958d2ee523a2206206994597c13d831ec7';
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
  [MultichainNetworks.SOLANA]: 'Solana',
  [MultichainNetworks.SOLANA_TESTNET]: 'Solana Testnet',
  [MultichainNetworks.SOLANA_DEVNET]: 'Solana Devnet',
  ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
  [MultichainNetworks.BITCOIN]: 'Bitcoin',
  [MultichainNetworks.BITCOIN_TESTNET]: 'Bitcoin Testnet',
  [MultichainNetworks.BITCOIN_SIGNET]: 'Bitcoin Mutinynet',
  ///: END:ONLY_INCLUDE_IF
};

export const STATIC_METAMASK_BASE_URL = 'https://static.cx.metamask.io';

export const BRIDGE_CHAINID_COMMON_TOKEN_PAIR: Partial<
  Record<
    AllowedBridgeChainIds,
    {
      address: string;
      symbol: string;
      decimals: number;
      name: string;
    }
  >
> = {
  [CHAIN_IDS.MAINNET]: {
    // ETH -> USDC on mainnet
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    symbol: 'USDC',
    decimals: 6,
    name: 'USD Coin',
  },
  [CHAIN_IDS.OPTIMISM]: {
    // ETH -> USDC on Optimism
    address: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
    symbol: 'USDC',
    decimals: 6,
    name: 'USD Coin',
  },
  [CHAIN_IDS.ARBITRUM]: {
    // ETH -> USDC on Arbitrum
    address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
    symbol: 'USDC',
    decimals: 6,
    name: 'USD Coin',
  },
  [CHAIN_IDS.BASE]: {
    // ETH -> USDC on Base
    address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    symbol: 'USDC',
    decimals: 6,
    name: 'USD Coin',
  },
  [CHAIN_IDS.POLYGON]: {
    // POL -> USDT on Polygon
    address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
    symbol: 'USDT',
    decimals: 6,
    name: 'Tether USD',
  },
  [CHAIN_IDS.BSC]: {
    // BNB -> USDT on BSC
    address: '0x55d398326f99059ff775485246999027b3197955',
    symbol: 'USDT',
    decimals: 18,
    name: 'Tether USD',
  },
  [CHAIN_IDS.AVALANCHE]: {
    // AVAX -> USDC on Avalanche
    address: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e',
    symbol: 'USDC',
    decimals: 6,
    name: 'USD Coin',
  },
  [CHAIN_IDS.ZKSYNC_ERA]: {
    // ETH -> USDT on zkSync Era
    address: '0x493257fd37edb34451f62edf8d2a0c418852ba4c',
    symbol: 'USDT',
    decimals: 6,
    name: 'Tether USD',
  },
  [CHAIN_IDS.LINEA_MAINNET]: {
    // ETH -> USDC on Linea
    address: '0x176211869ca2b568f2a7d4ee941e073a821ee1ff',
    symbol: 'USDC',
    decimals: 6,
    name: 'USD Coin',
  },
  [CHAIN_IDS.SEI]: {
    // SEI -> USDC on Sei
    address: '0x3894085Ef7Ff0f0aeDf52E2A2704928d1Ec074F1',
    symbol: 'USDC',
    decimals: 6,
    name: 'USD Coin',
  },
  [MultichainNetworks.SOLANA]: {
    // SOL -> USDC on Solana
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: 'USDC',
    decimals: 6,
    name: 'USD Coin',
  },
} as const;
