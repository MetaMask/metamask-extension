import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import { CHAIN_IDS } from './network';

/**
 * V1 of batch sell functionality relies on a hardcoded list
 * of supported networks.
 */
export const BATCH_SELL_SUPPORTED_CHAIN_IDS = new Set([
  toEvmCaipChainId(CHAIN_IDS.MAINNET),
  toEvmCaipChainId(CHAIN_IDS.BSC),
  toEvmCaipChainId(CHAIN_IDS.BASE),
  toEvmCaipChainId(CHAIN_IDS.LINEA_MAINNET),
  toEvmCaipChainId(CHAIN_IDS.ARBITRUM),
  toEvmCaipChainId(CHAIN_IDS.POLYGON),
]);

export const ONDO_TOKENIZED_TOKEN_NAME = 'Ondo Tokenized';

export const BATCH_SELL_DEST_STABLECOIN_METADATA: Record<
  string,
  { symbol: string; name: string; decimals: number; iconUrl: string }
> = {
  'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    iconUrl:
      'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
  },
  'eip155:1/erc20:0xdac17f958d2ee523a2206206994597c13d831ec7': {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    iconUrl:
      'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0xdac17f958d2ee523a2206206994597c13d831ec7.png',
  },
  'eip155:8453/erc20:0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    iconUrl:
      'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/8453/erc20/0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.png',
  },
  'eip155:42161/erc20:0xaf88d065e77c8cc2239327c5edb3a432268e5831': {
    symbol: 'USDC',
    name: 'USD Coin (Native)',
    decimals: 6,
    iconUrl:
      'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/42161/erc20/0xaf88d065e77c8cc2239327c5edb3a432268e5831.png',
  },
  'eip155:137/erc20:0x3c499c542cef5e3811e1192ce70d8cc03d5c3359': {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    iconUrl:
      'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/137/erc20/0x3c499c542cef5e3811e1192ce70d8cc03d5c3359.png',
  },
  'eip155:56/erc20:0x55d398326f99059ff775485246999027b3197955': {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 18,
    iconUrl:
      'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/56/erc20/0x55d398326f99059ff775485246999027b3197955.png',
  },
  'eip155:59144/erc20:0xaca92e438df0b2401ff60da7e4337b687a2435da': {
    symbol: 'MUSD',
    name: 'MetaMask USD',
    decimals: 6,
    iconUrl:
      'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/59144/erc20/0xaca92e438df0b2401ff60da7e4337b687a2435da.png',
  },
};
