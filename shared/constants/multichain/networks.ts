import { CaipChainId } from '@metamask/utils';
import { BtcAccountType, SolAccountType } from '@metamask/keyring-api';
import {
  isBtcMainnetAddress,
  isBtcTestnetAddress,
  isSolanaAddress,
} from '../../lib/multichain';

export type ProviderConfigWithImageUrl = {
  rpcUrl?: string;
  type: string;
  ticker: string;
  nickname?: string;
  rpcPrefs?: { blockExplorerUrl?: string; imageUrl?: string };
  id?: string;
};

export type MultichainProviderConfig = ProviderConfigWithImageUrl & {
  nickname: string;
  chainId: CaipChainId;
  // NOTE: For now we use a callback to check if the address is compatible with
  // the given network or not
  isAddressCompatible: (address: string) => boolean;
};

export type MultichainNetworkIds = `${MultichainNetworks}`;

export enum MultichainNetworks {
  BITCOIN = 'bip122:000000000019d6689c085ae165831e93',
  BITCOIN_TESTNET = 'bip122:000000000933ea01ad0ee984209779ba',

  SOLANA = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  SOLANA_DEVNET = 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
  SOLANA_TESTNET = 'solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z',
}

export const MULTICHAIN_ACCOUNT_TYPE_TO_MAINNET = {
  [BtcAccountType.P2wpkh]: MultichainNetworks.BITCOIN,
  [SolAccountType.DataAccount]: MultichainNetworks.SOLANA,
} as const;

export const BITCOIN_TOKEN_IMAGE_URL = './images/bitcoin-logo.svg';
export const SOLANA_TOKEN_IMAGE_URL = './images/solana-logo.svg';

export const MULTICHAIN_NETWORK_BLOCK_EXPLORER_URL_MAP = {
  [MultichainNetworks.BITCOIN]: 'https://blockstream.info/address',
  [MultichainNetworks.BITCOIN_TESTNET]:
    'https://blockstream.info/testnet/address',

  [MultichainNetworks.SOLANA]: 'https://explorer.solana.com/',
  [MultichainNetworks.SOLANA_DEVNET]:
    'https://explorer.solana.com/?cluster=devnet',
  [MultichainNetworks.SOLANA_TESTNET]:
    'https://explorer.solana.com/?cluster=testnet',
} as const;

export const MULTICHAIN_TOKEN_IMAGE_MAP = {
  [MultichainNetworks.BITCOIN]: BITCOIN_TOKEN_IMAGE_URL,
  [MultichainNetworks.SOLANA]: SOLANA_TOKEN_IMAGE_URL,
} as const;

export const MULTICHAIN_PROVIDER_CONFIGS: Record<
  CaipChainId,
  MultichainProviderConfig
> = {
  /**
   * Bitcoin
   */
  [MultichainNetworks.BITCOIN]: {
    chainId: MultichainNetworks.BITCOIN,
    rpcUrl: '', // not used
    ticker: 'BTC',
    nickname: 'Bitcoin',
    id: 'btc-mainnet',
    type: 'rpc',
    rpcPrefs: {
      imageUrl: MULTICHAIN_TOKEN_IMAGE_MAP[MultichainNetworks.BITCOIN],
      blockExplorerUrl:
        MULTICHAIN_NETWORK_BLOCK_EXPLORER_URL_MAP[MultichainNetworks.BITCOIN],
    },
    isAddressCompatible: isBtcMainnetAddress,
  },
  [MultichainNetworks.BITCOIN_TESTNET]: {
    chainId: MultichainNetworks.BITCOIN_TESTNET,
    rpcUrl: '', // not used
    ticker: 'BTC',
    nickname: 'Bitcoin (testnet)',
    id: 'btc-testnet',
    type: 'rpc',
    rpcPrefs: {
      imageUrl: MULTICHAIN_TOKEN_IMAGE_MAP[MultichainNetworks.BITCOIN],
      blockExplorerUrl:
        MULTICHAIN_NETWORK_BLOCK_EXPLORER_URL_MAP[
          MultichainNetworks.BITCOIN_TESTNET
        ],
    },
    isAddressCompatible: isBtcTestnetAddress,
  },
  /**
   * Solana
   */
  [MultichainNetworks.SOLANA]: {
    chainId: MultichainNetworks.SOLANA,
    rpcUrl: '', // not used
    ticker: 'SOL',
    nickname: 'Solana',
    id: 'solana-mainnet',
    type: 'rpc',
    rpcPrefs: {
      imageUrl: MULTICHAIN_TOKEN_IMAGE_MAP[MultichainNetworks.SOLANA],
      blockExplorerUrl:
        MULTICHAIN_NETWORK_BLOCK_EXPLORER_URL_MAP[MultichainNetworks.SOLANA],
    },
    isAddressCompatible: isSolanaAddress,
  },
  [MultichainNetworks.SOLANA_DEVNET]: {
    chainId: MultichainNetworks.SOLANA_DEVNET,
    rpcUrl: '', // not used
    ticker: 'SOL',
    nickname: 'Solana (devnet)',
    id: 'solana-devnet',
    type: 'rpc',
    rpcPrefs: {
      imageUrl: MULTICHAIN_TOKEN_IMAGE_MAP[MultichainNetworks.SOLANA],
      blockExplorerUrl:
        MULTICHAIN_NETWORK_BLOCK_EXPLORER_URL_MAP[
          MultichainNetworks.SOLANA_DEVNET
        ],
    },
    isAddressCompatible: isSolanaAddress,
  },
  [MultichainNetworks.SOLANA_TESTNET]: {
    chainId: MultichainNetworks.SOLANA_TESTNET,
    rpcUrl: '', // not used
    ticker: 'SOL',
    nickname: 'Solana (testnet)',
    id: 'solana-testnet',
    type: 'rpc',
    rpcPrefs: {
      imageUrl: MULTICHAIN_TOKEN_IMAGE_MAP[MultichainNetworks.SOLANA],
      blockExplorerUrl:
        MULTICHAIN_NETWORK_BLOCK_EXPLORER_URL_MAP[
          MultichainNetworks.SOLANA_TESTNET
        ],
    },
    isAddressCompatible: isSolanaAddress,
  },
};
