import { ProviderConfig } from '@metamask/network-controller';
import { Caip2ChainId } from '@metamask/snaps-utils';

export type MultichainState = {
  metamask: {
    // rates controller
    rates: Record<
      string,
      {
        conversionDate: number;
        conversionRate: number;
        usdConversionRate: number;
      }
    >;
    cryptocurrencies: string[];
  };
};

export type ProviderConfigWithImageUrl = Pick<
  ProviderConfig,
  Exclude<keyof ProviderConfig, 'chainId'>
> & {
  rpcPrefs?: { imageUrl?: string };
};

export type MultiChainNetwork = ProviderConfigWithImageUrl & {
  chainId: string;
  caip2: Caip2ChainId;
  snapId: string;
};

export const NON_EVM_CHAIN_IDS = {
  BITCOIN: 'bip122:000000000019d6689c085ae165831e93',
} as const;

export const BITCOIN_TOKEN_IMAGE_URL = './images/bitcoin-logo.svg';

export const NON_EVM_CHAIN_ID_TOKEN_IMAGE_MAP = {
  [NON_EVM_CHAIN_IDS.BITCOIN]: BITCOIN_TOKEN_IMAGE_URL,
} as const;

export const NON_EVM_PROVIDER_CONFIGS: Record<string, MultiChainNetwork> = {
  [NON_EVM_CHAIN_IDS.BITCOIN]: {
    chainId: NON_EVM_CHAIN_IDS.BITCOIN.split(':')[1],
    caip2: NON_EVM_CHAIN_IDS.BITCOIN,
    rpcUrl: '', // not used
    ticker: 'BTC',
    nickname: 'Bitcoin',
    id: 'btc-mainnet',
    snapId: 'npm:mock-btc-snap',
    type: 'rpc',
    rpcPrefs: {
      imageUrl: NON_EVM_CHAIN_ID_TOKEN_IMAGE_MAP[NON_EVM_CHAIN_IDS.BITCOIN],
    },
  },
};
