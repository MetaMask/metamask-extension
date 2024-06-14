import { ProviderConfig } from '@metamask/network-controller';
import { CaipChainId } from '@metamask/utils';

export type ProviderConfigWithImageUrl = Omit<ProviderConfig, 'chainId'> & {
  rpcPrefs?: { imageUrl?: string };
};

export type MultichainProviderConfig = ProviderConfigWithImageUrl & {
  chainId: CaipChainId;
};

export enum MultichainNetworks {
  BITCOIN = 'bip122:000000000019d6689c085ae165831e93',
  BITCOIN_TESTNET = 'bip122:000000000933ea01ad0ee984209779ba',
}

export const BITCOIN_TOKEN_IMAGE_URL = './images/bitcoin-logo.svg';

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
    },
  },
};

export const MULTICHAIN_NATIVE_CURRENCY_TO_CAIP19 = {
  BTC: 'bip122:000000000019d6689c085ae165831e93/slip44:0',
} as const;
