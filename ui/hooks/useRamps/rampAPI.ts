import getFetchWithTimeout from '../../../shared/modules/fetch-with-timeout';
import { AggregatorNetwork } from './useRamps.types';

const fetchWithTimeout = getFetchWithTimeout();

const rampApiBaseUrl =
  process.env.METAMASK_RAMP_API_URL ||
  'https://on-ramp-content.metaswap.codefi.network';

const buyableChainsFallback: AggregatorNetwork[] = [
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
    chainId: 100,
    chainName: 'Gnosis Mainnet',
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
    chainId: 324,
    chainName: 'zkSync Era Mainnet',
    nativeTokenSupported: true,
  },
  {
    active: true,
    chainId: 1101,
    chainName: 'Polygon zkEVM',
    nativeTokenSupported: true,
  },
  {
    active: true,
    chainId: 1284,
    chainName: 'Moonbeam Mainnet',
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
    chainId: 8453,
    chainName: 'Base Mainnet',
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
    nativeTokenSupported: false,
  },
  {
    active: true,
    chainId: 43114,
    chainName: 'Avalanche C-Chain Mainnet',
    nativeTokenSupported: true,
  },
  {
    active: true,
    chainId: 59144,
    chainName: 'Linea',
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
    chainName: 'Palm Mainnet',
    nativeTokenSupported: false,
  },
];

const OnRampAPI = {
  async getNetworks(): Promise<AggregatorNetwork[]> {
    try {
      const url = `${rampApiBaseUrl}/regions/networks?context=extension`;
      const response = await fetchWithTimeout(url);
      const { networks } = await response.json();
      return networks;
    } catch (error) {
      return buyableChainsFallback;
    }
  },
};

export default OnRampAPI;
