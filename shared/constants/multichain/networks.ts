import { CaipChainId } from '@metamask/utils';
import { BtcAccountType, SolAccountType } from '@metamask/keyring-api';
import {
  isBtcMainnetAddress,
  isBtcTestnetAddress,
  isSolanaAddress,
} from '../../lib/multichain/accounts';
import { MultichainBlockExplorerFormatUrls } from '../../lib/multichain/networks';

export type ProviderConfigWithImageUrl = {
  rpcUrl?: string;
  type: string;
  ticker: string;
  nickname?: string;
  rpcPrefs?: {
    imageUrl?: string;
    // Mainly for EVM.
    blockExplorerUrl?: string;
  };
  id?: string;
};

export type MultichainProviderConfig = ProviderConfigWithImageUrl & {
  nickname: string;
  chainId: CaipChainId;
  // Variant of block explorer URLs for non-EVM.
  blockExplorerFormatUrls?: MultichainBlockExplorerFormatUrls;
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

export const MULTICHAIN_NETWORK_TO_NICKNAME: Record<CaipChainId, string> = {
  [MultichainNetworks.BITCOIN]: 'Bitcoin',
  [MultichainNetworks.BITCOIN_TESTNET]: 'Bitcoin (testnet)',
  [MultichainNetworks.SOLANA]: 'Solana',
  [MultichainNetworks.SOLANA_DEVNET]: 'Solana (devnet)',
  [MultichainNetworks.SOLANA_TESTNET]: 'Solana (testnet)',
};

export const BITCOIN_TOKEN_IMAGE_URL = './images/bitcoin-logo.svg';
export const SOLANA_TOKEN_IMAGE_URL = './images/solana-logo.svg';

export const MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP: Record<
  CaipChainId,
  MultichainBlockExplorerFormatUrls
> = {
  [MultichainNetworks.BITCOIN]: {
    url: 'https://mempool.space',
    address: 'https://mempool.space/address/{address}',
    transaction: 'https://mempool.space/tx/{txId}',
  },
  [MultichainNetworks.BITCOIN_TESTNET]: {
    url: 'https://mempool.space',
    address: 'https://mempool.space/testnet/address/{address}',
    transaction: 'https://mempool.space/testnet/tx/{txId}',
  },

  [MultichainNetworks.SOLANA]: {
    url: 'https://explorer.solana.com',
    address: 'https://explorer.solana.com/address/{address}',
    transaction: 'https://explorer.solana.com/tx/{txId}',
  },
  [MultichainNetworks.SOLANA_DEVNET]: {
    url: 'https://explorer.solana.com',
    address: 'https://explorer.solana.com/address/{address}?cluster=devnet',
    transaction: 'https://explorer.solana.com/tx/{txId}?cluster=devnet',
  },
  [MultichainNetworks.SOLANA_TESTNET]: {
    url: 'https://explorer.solana.com',
    address: 'https://explorer.solana.com/address/{address}?cluster=testnet',
    transaction: 'https://explorer.solana.com/tx/{txId}?cluster=testnet',
  },
} as const;

export const MULTICHAIN_TOKEN_IMAGE_MAP: Record<CaipChainId, string> = {
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
        MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP[
          MultichainNetworks.BITCOIN
        ].url,
    },
    blockExplorerFormatUrls:
      MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP[
        MultichainNetworks.BITCOIN
      ],
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
        MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP[
          MultichainNetworks.BITCOIN_TESTNET
        ].url,
    },
    blockExplorerFormatUrls:
      MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP[
        MultichainNetworks.BITCOIN_TESTNET
      ],
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
        MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP[
          MultichainNetworks.SOLANA
        ].url,
    },
    blockExplorerFormatUrls:
      MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP[
        MultichainNetworks.SOLANA
      ],
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
        MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP[
          MultichainNetworks.SOLANA_DEVNET
        ].url,
    },
    blockExplorerFormatUrls:
      MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP[
        MultichainNetworks.SOLANA_DEVNET
      ],
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
        MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP[
          MultichainNetworks.SOLANA_TESTNET
        ].url,
    },
    blockExplorerFormatUrls:
      MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP[
        MultichainNetworks.SOLANA_TESTNET
      ],
    isAddressCompatible: isSolanaAddress,
  },
};
