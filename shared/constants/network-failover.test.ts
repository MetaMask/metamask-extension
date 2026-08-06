import { CHAIN_IDS } from './network';
import {
  FAILOVER_URLS_BY_CHAIN_ID,
  getFailoverUrlsForChainId,
  getIsQuicknodeEndpointUrl,
} from './network-failover';

describe('FAILOVER_URLS_BY_CHAIN_ID', () => {
  it('includes every chain that has a mapped QuickNode failover', () => {
    const mappedChainIds = [
      CHAIN_IDS.MAINNET,
      CHAIN_IDS.LINEA_MAINNET,
      CHAIN_IDS.ARBITRUM,
      CHAIN_IDS.AVALANCHE,
      CHAIN_IDS.OPTIMISM,
      CHAIN_IDS.POLYGON,
      CHAIN_IDS.BASE,
      CHAIN_IDS.BSC,
      CHAIN_IDS.ZKSYNC_ERA,
      CHAIN_IDS.MEGAETH_MAINNET,
      CHAIN_IDS.SEI,
      CHAIN_IDS.MONAD,
      CHAIN_IDS.HYPE,
      CHAIN_IDS.ARC,
      CHAIN_IDS.ROBINHOOD_CHAIN,
    ];
    expect(Object.keys(FAILOVER_URLS_BY_CHAIN_ID).sort()).toStrictEqual(
      [...mappedChainIds].sort(),
    );
  });

  it('resolves a mapped chain to its QuickNode failover url from env at load', () => {
    // The map is built once at module load, so set the env before re-importing.
    jest.isolateModules(() => {
      process.env.QUICKNODE_BSC_URL = 'https://failover.example/bsc';
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const freshModule = require('./network-failover');
      expect(
        freshModule.FAILOVER_URLS_BY_CHAIN_ID[CHAIN_IDS.BSC],
      ).toStrictEqual(['https://failover.example/bsc']);
      delete process.env.QUICKNODE_BSC_URL;
    });
  });
});

describe('getFailoverUrlsForChainId', () => {
  it('returns an array for a mapped chain (empty when its env is unset)', () => {
    // QuickNode env is unset in tests, so a mapped chain resolves to an empty
    // array. The point is that a mapped chain returns an array, not undefined.
    expect(getFailoverUrlsForChainId(CHAIN_IDS.BSC)).toStrictEqual([]);
  });

  it('returns undefined for a chain that has no mapped failover', () => {
    // Sepolia is not in the failover map.
    expect(getFailoverUrlsForChainId(CHAIN_IDS.SEPOLIA)).toBeUndefined();
  });
});

describe('getIsQuicknodeEndpointUrl', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    process.env = { ...OLD_ENV };
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('returns true for a known Quicknode URL', () => {
    process.env.QUICKNODE_MAINNET_URL = 'https://mainnet.quiknode.pro/test';
    expect(getIsQuicknodeEndpointUrl('https://mainnet.quiknode.pro/test')).toBe(
      true,
    );
  });

  it('returns false for unknown URLs', () => {
    expect(getIsQuicknodeEndpointUrl('https://unknown.example.com')).toBe(
      false,
    );
  });

  it('returns false for an empty URL', () => {
    expect(getIsQuicknodeEndpointUrl('')).toBe(false);
  });
});
