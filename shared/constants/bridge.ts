import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import {
  BRIDGE_DEV_API_BASE_URL,
  BRIDGE_PROD_API_BASE_URL,
} from '@metamask/bridge-controller';
import { MultichainNetworks } from './multichain/networks';
import { CHAIN_IDS, NETWORK_TO_NAME_MAP } from './network';

const ALLOWED_MULTICHAIN_BRIDGE_CHAIN_IDS = [
  ///: BEGIN:ONLY_INCLUDE_IF(solana-swaps)
  MultichainNetworks.SOLANA,
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
  ///: BEGIN:ONLY_INCLUDE_IF(solana-swaps)
  MultichainNetworks.SOLANA,
  ///: END:ONLY_INCLUDE_IF
];

const ALLOWED_BRIDGE_CHAIN_IDS_IN_CAIP = ALLOWED_EVM_BRIDGE_CHAIN_IDS.map(
  toEvmCaipChainId,
).concat(ALLOWED_MULTICHAIN_BRIDGE_CHAIN_IDS);

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
  ///: BEGIN:ONLY_INCLUDE_IF(solana-swaps)
  [MultichainNetworks.SOLANA]: 'Solana',
  [MultichainNetworks.SOLANA_TESTNET]: 'Solana Testnet',
  [MultichainNetworks.SOLANA_DEVNET]: 'Solana Devnet',
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
  [MultichainNetworks.BITCOIN]: 'Bitcoin',
  [MultichainNetworks.BITCOIN_TESTNET]: 'Bitcoin Testnet',
  [MultichainNetworks.BITCOIN_SIGNET]: 'Bitcoin Mutinynet',
  ///: END:ONLY_INCLUDE_IF
};

export const STATIC_METAMASK_BASE_URL = 'https://static.cx.metamask.io';

export const SOLANA_USDC_ASSET = {
  address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  assetId:
    'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  symbol: 'USDC',
  decimals: 6,
  image:
    'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v.png',
  chainId: MultichainNetworks.SOLANA,
};
