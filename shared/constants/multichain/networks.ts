import {
  BtcAccountType,
  BtcScope,
  SolAccountType,
  SolScope,
  TrxAccountType,
  TrxScope,
} from '@metamask/keyring-api';
import { CaipChainId } from '@metamask/utils';
import {
  isBtcMainnetAddress,
  isBtcTestnetAddress,
  isSolanaAddress,
  isTronAddress,
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
  decimals: number;
};

export type MultichainNetworkIds = `${MultichainNetworks}`;

export enum MultichainNetworks {
  BITCOIN = BtcScope.Mainnet,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  BITCOIN_TESTNET = BtcScope.Testnet,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  BITCOIN_SIGNET = BtcScope.Signet,

  SOLANA = SolScope.Mainnet,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  SOLANA_DEVNET = SolScope.Devnet,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  SOLANA_TESTNET = SolScope.Testnet,

  TRON = TrxScope.Mainnet,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  TRON_NILE = TrxScope.Nile,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  TRON_SHASTA = TrxScope.Shasta,
}

// TODO: This data should be provided by the snap
export const MULTICHAIN_NETWORK_TO_ACCOUNT_TYPE_NAME: Record<
  CaipChainId,
  string
> = {
  [BtcScope.Mainnet]: 'Bitcoin',
  [BtcScope.Testnet]: 'Bitcoin Testnet',
  [BtcScope.Testnet4]: 'Bitcoin Testnet4',
  [BtcScope.Signet]: 'Bitcoin Signet',
  [BtcScope.Regtest]: 'Bitcoin Regtest',
  [SolScope.Mainnet]: 'Solana',
  [SolScope.Testnet]: 'Solana',
  [SolScope.Devnet]: 'Solana',
  [TrxScope.Mainnet]: 'Tron',
  [TrxScope.Nile]: 'Tron',
  [TrxScope.Shasta]: 'Tron',
} as const;

export const MULTICHAIN_ACCOUNT_TYPE_TO_MAINNET = {
  [BtcAccountType.P2pkh]: MultichainNetworks.BITCOIN,
  [BtcAccountType.P2wpkh]: MultichainNetworks.BITCOIN,
  [BtcAccountType.P2sh]: MultichainNetworks.BITCOIN,
  [BtcAccountType.P2tr]: MultichainNetworks.BITCOIN,
  [SolAccountType.DataAccount]: MultichainNetworks.SOLANA,
  [TrxAccountType.Eoa]: MultichainNetworks.TRON,
} as const;

export const MULTICHAIN_NETWORK_TO_NICKNAME: Record<CaipChainId, string> = {
  [MultichainNetworks.BITCOIN]: 'Bitcoin',
  [MultichainNetworks.BITCOIN_TESTNET]: 'Bitcoin Testnet',
  [MultichainNetworks.BITCOIN_SIGNET]: 'Bitcoin Mutinynet',
  [MultichainNetworks.SOLANA]: 'Solana',
  [MultichainNetworks.SOLANA_DEVNET]: 'Solana Devnet',
  [MultichainNetworks.SOLANA_TESTNET]: 'Solana Testnet',
  [MultichainNetworks.TRON]: 'Tron',
  [MultichainNetworks.TRON_NILE]: 'Tron Nile Testnet',
  [MultichainNetworks.TRON_SHASTA]: 'Tron Shasta Testnet',
} as const;

// TODO: This data should be provided by the snap
export const BITCOIN_TOKEN_IMAGE_URL = './images/bitcoin-logo.svg';
export const BITCOIN_TESTNET_TOKEN_IMAGE_URL =
  './images/bitcoin-testnet-logo.svg';
export const BITCOIN_SIGNET_TOKEN_IMAGE_URL =
  './images/bitcoin-signet-logo.png';

export const SOLANA_TOKEN_IMAGE_URL = './images/solana-logo.svg';
export const SOLANA_TESTNET_IMAGE_URL = './images/solana-testnet-logo.svg';
export const SOLANA_DEVNET_IMAGE_URL = './images/solana-devnet-logo.svg';

export const TRON_TOKEN_IMAGE_URL = './images/tron-logo.svg';
export const TRON_NILE_TOKEN_IMAGE_URL = './images/tron-nile-logo.svg';
export const TRON_SHASTA_TOKEN_IMAGE_URL = './images/tron-shasta-logo.svg';

export const BITCOIN_BLOCK_EXPLORER_URL = 'https://mempool.space';
export const BITCOIN_SIGNET_BLOCK_EXPLORER_URL = 'https://mutinynet.com';

export const SOLANA_BLOCK_EXPLORER_URL = 'https://solscan.io';

export const TRON_BLOCK_EXPLORER_URL = 'https://tronscan.org';
export const TRON_NILE_BLOCK_EXPLORER_URL = 'https://nile.tronscan.org';
export const TRON_SHASTA_BLOCK_EXPLORER_URL = 'https://shasta.tronscan.org';

export const MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP: Record<
  CaipChainId,
  MultichainBlockExplorerFormatUrls
> = {
  [MultichainNetworks.BITCOIN]: {
    url: BITCOIN_BLOCK_EXPLORER_URL,
    address: `${BITCOIN_BLOCK_EXPLORER_URL}/address/{address}`,
    transaction: `${BITCOIN_BLOCK_EXPLORER_URL}/tx/{txId}`,
  },
  [MultichainNetworks.BITCOIN_TESTNET]: {
    url: BITCOIN_BLOCK_EXPLORER_URL,
    address: `${BITCOIN_BLOCK_EXPLORER_URL}/testnet/address/{address}`,
    transaction: `${BITCOIN_BLOCK_EXPLORER_URL}/testnet/tx/{txId}`,
  },
  [MultichainNetworks.BITCOIN_SIGNET]: {
    url: BITCOIN_SIGNET_BLOCK_EXPLORER_URL,
    address: `${BITCOIN_SIGNET_BLOCK_EXPLORER_URL}/address/{address}`,
    transaction: `${BITCOIN_SIGNET_BLOCK_EXPLORER_URL}/tx/{txId}`,
  },

  [MultichainNetworks.SOLANA]: {
    url: SOLANA_BLOCK_EXPLORER_URL,
    address: `${SOLANA_BLOCK_EXPLORER_URL}/account/{address}`,
    transaction: `${SOLANA_BLOCK_EXPLORER_URL}/tx/{txId}`,
  },
  [MultichainNetworks.SOLANA_DEVNET]: {
    url: SOLANA_BLOCK_EXPLORER_URL,
    address: `${SOLANA_BLOCK_EXPLORER_URL}/account/{address}?cluster=devnet`,
    transaction: `${SOLANA_BLOCK_EXPLORER_URL}/tx/{txId}?cluster=devnet`,
  },
  [MultichainNetworks.SOLANA_TESTNET]: {
    url: SOLANA_BLOCK_EXPLORER_URL,
    address: `${SOLANA_BLOCK_EXPLORER_URL}/account/{address}?cluster=testnet`,
    transaction: `${SOLANA_BLOCK_EXPLORER_URL}/tx/{txId}?cluster=testnet`,
  },
  [MultichainNetworks.TRON]: {
    url: TRON_BLOCK_EXPLORER_URL,
    address: `${TRON_BLOCK_EXPLORER_URL}/#/address/{address}`,
    transaction: `${TRON_BLOCK_EXPLORER_URL}/#/transaction/{txId}`,
  },
  [MultichainNetworks.TRON_NILE]: {
    url: TRON_NILE_BLOCK_EXPLORER_URL,
    address: `${TRON_NILE_BLOCK_EXPLORER_URL}/#/address/{address}`,
    transaction: `${TRON_NILE_BLOCK_EXPLORER_URL}/#/transaction/{txId}`,
  },
  [MultichainNetworks.TRON_SHASTA]: {
    url: TRON_SHASTA_BLOCK_EXPLORER_URL,
    address: `${TRON_SHASTA_BLOCK_EXPLORER_URL}/#/address/{address}`,
    transaction: `${TRON_SHASTA_BLOCK_EXPLORER_URL}/#/transaction/{txId}`,
  },
} as const;

export const MULTICHAIN_TOKEN_IMAGE_MAP: Record<CaipChainId, string> = {
  [MultichainNetworks.BITCOIN]: BITCOIN_TOKEN_IMAGE_URL,
  [MultichainNetworks.BITCOIN_TESTNET]: BITCOIN_TESTNET_TOKEN_IMAGE_URL,
  [MultichainNetworks.BITCOIN_SIGNET]: BITCOIN_SIGNET_TOKEN_IMAGE_URL,
  [MultichainNetworks.SOLANA]: SOLANA_TOKEN_IMAGE_URL,
  [MultichainNetworks.SOLANA_DEVNET]: SOLANA_DEVNET_IMAGE_URL,
  [MultichainNetworks.SOLANA_TESTNET]: SOLANA_TESTNET_IMAGE_URL,
  [MultichainNetworks.TRON]: TRON_TOKEN_IMAGE_URL,
  [MultichainNetworks.TRON_NILE]: TRON_TOKEN_IMAGE_URL,
  [MultichainNetworks.TRON_SHASTA]: TRON_TOKEN_IMAGE_URL,
} as const;

/**
 * @deprecated MULTICHAIN_PROVIDER_CONFIGS is deprecated and will be removed in the future.
 * Use the data from @metamask/multichain-network-controller.
 * Useful selectors in selectors/multichain/networks.ts.
 */
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
    decimals: 8,
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
    ticker: 'tBTC',
    nickname: 'Bitcoin Testnet',
    id: 'btc-testnet',
    type: 'rpc',
    decimals: 8,
    rpcPrefs: {
      imageUrl: MULTICHAIN_TOKEN_IMAGE_MAP[MultichainNetworks.BITCOIN_TESTNET],
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
  [MultichainNetworks.BITCOIN_SIGNET]: {
    chainId: MultichainNetworks.BITCOIN_SIGNET,
    rpcUrl: '', // not used
    ticker: 'sBTC',
    nickname: 'Bitcoin Mutinynet',
    id: 'btc-signet',
    type: 'rpc',
    decimals: 8,
    rpcPrefs: {
      imageUrl: MULTICHAIN_TOKEN_IMAGE_MAP[MultichainNetworks.BITCOIN_SIGNET],
      blockExplorerUrl:
        MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP[
          MultichainNetworks.BITCOIN_SIGNET
        ].url,
    },
    blockExplorerFormatUrls:
      MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP[
        MultichainNetworks.BITCOIN_SIGNET
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
    decimals: 5,
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
    decimals: 5,
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
    decimals: 5,
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
  [MultichainNetworks.TRON]: {
    chainId: MultichainNetworks.TRON,
    rpcUrl: '', // not used
    ticker: 'TRX',
    nickname: 'Tron',
    id: 'tron-mainnet',
    type: 'rpc',
    decimals: 5,
    rpcPrefs: {
      imageUrl: MULTICHAIN_TOKEN_IMAGE_MAP[MultichainNetworks.TRON],
      blockExplorerUrl:
        MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP[
          MultichainNetworks.TRON
        ].url,
    },
    blockExplorerFormatUrls:
      MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP[
        MultichainNetworks.TRON
      ],
    isAddressCompatible: isTronAddress,
  },
  [MultichainNetworks.TRON_NILE]: {
    chainId: MultichainNetworks.TRON_NILE,
    rpcUrl: '', // not used
    ticker: 'TRX',
    nickname: 'Tron (nile)',
    id: 'tron-nile',
    type: 'rpc',
    decimals: 5,
    rpcPrefs: {
      imageUrl: MULTICHAIN_TOKEN_IMAGE_MAP[MultichainNetworks.TRON_NILE],
      blockExplorerUrl:
        MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP[
          MultichainNetworks.TRON_NILE
        ].url,
    },
    blockExplorerFormatUrls:
      MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP[
        MultichainNetworks.TRON_NILE
      ],
    isAddressCompatible: isTronAddress,
  },
  [MultichainNetworks.TRON_SHASTA]: {
    chainId: MultichainNetworks.TRON_SHASTA,
    rpcUrl: '', // not used
    ticker: 'TRX',
    nickname: 'Tron (shasta)',
    id: 'tron-shasta',
    type: 'rpc',
    decimals: 5,
    rpcPrefs: {
      imageUrl: MULTICHAIN_TOKEN_IMAGE_MAP[MultichainNetworks.TRON_SHASTA],
      blockExplorerUrl:
        MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP[
          MultichainNetworks.TRON_SHASTA
        ].url,
    },
    blockExplorerFormatUrls:
      MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP[
        MultichainNetworks.TRON_SHASTA
      ],
    isAddressCompatible: isTronAddress,
  },
};

export const SOLANA_TEST_CHAINS: CaipChainId[] = [
  SolScope.Testnet,
  SolScope.Devnet,
];
