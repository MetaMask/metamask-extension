import nock from 'nock';
import OnRampAPI from './OnRampAPI';

const mockedResponse = {
  networks: [
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
  ],
};

describe('OnRampAPI', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('should fetch networks', async () => {
    nock('https://on-ramp.dev.mmcx.codefi.network')
      .get('/regions/networks')
      .query(true)
      .reply(200, mockedResponse);
    const result = await OnRampAPI.getNetworks();
    expect(result).toEqual(mockedResponse.networks);
  });
});
