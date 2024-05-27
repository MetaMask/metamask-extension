import { ProviderConfig } from '@metamask/network-controller';
import { Caip2ChainId } from '@metamask/snaps-utils';

export type MultichainState = {
  metamask: {
    getMultichainNetworkConfirgurations: any;
  };
};

type ProviderConfigWithImageUrl = Omit<ProviderConfig, 'chainId'> & {
  rpcPrefs?: { imageUrl?: string };
};

export type MultiChainNetwork = ProviderConfigWithImageUrl & {
  chainId: string;
  caip2: Caip2ChainId;
  snapId: string;
};

export const NON_EVM_CHAIN_IDS = {
  BITCOIN: 'bip122:000000000019d6689c085ae165831e93',
  SOLANA: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  COSMOS: 'cosmos:cosmoshub-4',
  OSMOSIS: 'cosmos:osmosis-1',
  CELESTIA: 'cosmos:celestia',
} as const;

const NON_EVM_TESTNET_CHAIN_IDS_ = {
  SOLANA_DEVNET: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
  SOLANA_TEST_NET: 'solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z',
} as const;

export const BITCOIN_TOKEN_IMAGE_URL = './images/bitcoin-logo.svg';
export const SOLANA_TOKEN_IMAGE_URL = './images/solana-logo.svg';
export const COSMOS_TOKEN_IMAGE_URL = './images/cosmos-logo.svg';
export const OSMOSIS_TOKEN_IMAGE_URL = './images/osmosis-logo.svg';
export const CELESTIA_TOKEN_IMAGE_URL = './images/celestia-logo.svg';

export const NON_EVM_CHAIN_ID_TOKEN_IMAGE_MAP = {
  [NON_EVM_CHAIN_IDS.SOLANA]: SOLANA_TOKEN_IMAGE_URL,
  [NON_EVM_CHAIN_IDS.BITCOIN]: BITCOIN_TOKEN_IMAGE_URL,
  [NON_EVM_CHAIN_IDS.COSMOS]: SOLANA_TOKEN_IMAGE_URL,
  [NON_EVM_CHAIN_IDS.OSMOSIS]: SOLANA_TOKEN_IMAGE_URL,
  [NON_EVM_CHAIN_IDS.CELESTIA]: SOLANA_TOKEN_IMAGE_URL,
} as const;

export const NON_EVM_PROVIDER_CONFIGS: Record<string, MultiChainNetwork> = {
  [NON_EVM_CHAIN_IDS.BITCOIN]: {
    chainId: NON_EVM_CHAIN_IDS.BITCOIN.split(':')[1],
    caip2: NON_EVM_CHAIN_IDS.BITCOIN,
    rpcUrl: '', // not used
    ticker: 'BTC',
    id: 'btc-mainnet',
    snapId: 'npm:mock-btc-snap',
    type: 'rpc',
    rpcPrefs: {
      imageUrl: NON_EVM_CHAIN_ID_TOKEN_IMAGE_MAP[NON_EVM_CHAIN_IDS.BITCOIN],
    },
  },
  [NON_EVM_CHAIN_IDS.SOLANA]: {
    chainId: NON_EVM_CHAIN_IDS.SOLANA.split(':')[1],
    caip2: NON_EVM_CHAIN_IDS.SOLANA,
    rpcUrl: '', // not used
    ticker: 'SOL',
    id: 'solana-mainnet',
    snapId: 'npm:mock-solana-snap',
    type: 'rpc',
    rpcPrefs: {
      imageUrl: NON_EVM_CHAIN_ID_TOKEN_IMAGE_MAP[NON_EVM_CHAIN_IDS.SOLANA],
    },
  },
  [NON_EVM_CHAIN_IDS.COSMOS]: {
    chainId: NON_EVM_CHAIN_IDS.COSMOS.split(':')[1],
    caip2: NON_EVM_CHAIN_IDS.COSMOS,
    rpcUrl: '', // not used
    ticker: 'ATOM',
    id: 'cosmos',
    snapId: 'npm:mock-cosmos-snap',
    type: 'rpc',
    rpcPrefs: {
      imageUrl: NON_EVM_CHAIN_ID_TOKEN_IMAGE_MAP[NON_EVM_CHAIN_IDS.COSMOS],
    },
  },
};
