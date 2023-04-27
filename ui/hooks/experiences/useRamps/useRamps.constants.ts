import { CHAIN_IDS } from '../../../../shared/constants/network';

export const portfolioUrl = process.env.PORTFOLIO_URL;
export const buyPath = '/buy';
export const entryParam = 'metamaskEntry';
export const entryParamValue = 'ext_buy_button';

export const MANUALLY_ACTIVE_CHAIN_IDS = [CHAIN_IDS.SEPOLIA];

export const mockedNetworks = [
  {
    active: true,
    chainId: 1,
    chainName: 'Ethereum Mainnet',
    nativeTokenSupported: true,
  },
  {
    active: true,
    chainId: 10,
    chainName: 'Optimism Mainnet',
    nativeTokenSupported: true,
  },
  {
    active: true,
    chainId: 25,
    chainName: 'Cronos Mainnet',
    nativeTokenSupported: true,
  },
  {
    active: true,
    chainId: 56,
    chainName: 'BNB Chain Mainnet',
    nativeTokenSupported: true,
  },
  {
    active: true,
    chainId: 137,
    chainName: 'Polygon Mainnet',
    nativeTokenSupported: true,
  },
  {
    active: true,
    chainId: 250,
    chainName: 'Fantom Mainnet',
    nativeTokenSupported: true,
  },
  {
    active: true,
    chainId: 1285,
    chainName: 'Moonriver Mainnet',
    nativeTokenSupported: true,
  },
  {
    active: true,
    chainId: 42161,
    chainName: 'Arbitrum Mainnet',
    nativeTokenSupported: true,
  },
  {
    active: true,
    chainId: 42220,
    chainName: 'Celo Mainnet',
    nativeTokenSupported: true,
  },
  {
    active: true,
    chainId: 43114,
    chainName: 'Avalanche C-Chain Mainnet',
    nativeTokenSupported: true,
  },
  {
    active: true,
    chainId: 1313161554,
    chainName: 'Aurora Mainnet',
    nativeTokenSupported: false,
  },
  {
    active: true,
    chainId: 1666600000,
    chainName: 'Harmony Mainnet (Shard 0)',
    nativeTokenSupported: true,
  },
  {
    active: true,
    chainId: 11297108109,
    chainName: 'Palm',
    nativeTokenSupported: false,
  },
];
