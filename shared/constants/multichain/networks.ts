import { CaipChainId } from '@metamask/utils';
import { isBtcMainnetAddress, isBtcTestnetAddress } from '../../lib/multichain';

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

export enum MultichainNetworks {
  BITCOIN = 'bip122:000000000019d6689c085ae165831e93',
  BITCOIN_TESTNET = 'bip122:000000000933ea01ad0ee984209779ba',
}

export const BITCOIN_TOKEN_IMAGE_URL = './images/bitcoin-logo.svg';

export const MULTICHAIN_NETWORK_BLOCK_EXPLORER_URL_MAP = {
  [MultichainNetworks.BITCOIN]: 'https://blockstream.info/address',
  [MultichainNetworks.BITCOIN_TESTNET]:
    'https://blockstream.info/testnet/address',
} as const;

export const MULTICHAIN_TOKEN_IMAGE_MAP = {
  [MultichainNetworks.BITCOIN]: BITCOIN_TOKEN_IMAGE_URL,
} as const;

export const MULTICHAIN_PROVIDER_CONFIGS: Record<
  CaipChainId,
  MultichainProviderConfig
> = {
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
};
