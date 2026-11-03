import { CHAIN_IDS } from './network';
import {
  getFailoverUrlsByChainId,
  getFailoverUrlsForChainId,
  getIsQuicknodeEndpointUrl,
} from './network-failover';

describe('getFailoverUrlsForChainId', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    process.env = { ...OLD_ENV };
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('returns the QuickNode failover url for a mapped chain when the env is set', () => {
    process.env.QUICKNODE_BSC_URL = 'https://failover.example/bsc';
    expect(getFailoverUrlsForChainId(CHAIN_IDS.BSC)).toStrictEqual([
      'https://failover.example/bsc',
    ]);
  });

  it('returns an empty array for a mapped chain when the env is unset', () => {
    delete process.env.QUICKNODE_MEGAETH_URL;
    expect(getFailoverUrlsForChainId(CHAIN_IDS.MEGAETH_MAINNET)).toStrictEqual(
      [],
    );
  });

  it('returns an empty array for a chain that has no mapped failover', () => {
    // Sepolia is not in the failover map
    expect(getFailoverUrlsForChainId(CHAIN_IDS.SEPOLIA)).toStrictEqual([]);
  });
});

describe('getFailoverUrlsByChainId', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    process.env = { ...OLD_ENV };
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('includes every chain that has a mapped QuickNode failover', () => {
    const failoverUrlsByChainId = getFailoverUrlsByChainId();
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
    expect(Object.keys(failoverUrlsByChainId).sort()).toStrictEqual(
      [...mappedChainIds].sort(),
    );
  });

  it('resolves a mapped chain to its QuickNode failover url from env', () => {
    process.env.QUICKNODE_BSC_URL = 'https://failover.example/bsc';
    expect(getFailoverUrlsByChainId()[CHAIN_IDS.BSC]).toStrictEqual([
      'https://failover.example/bsc',
    ]);
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
