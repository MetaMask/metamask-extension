import { CHAIN_IDS } from './network';
import {
  getFailoverUrlsByChainId,
  getFailoverUrlsForChainId,
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

  it('returns undefined for a chain that has no mapped failover', () => {
    // Sepolia is not in the failover map
    expect(getFailoverUrlsForChainId(CHAIN_IDS.SEPOLIA)).toBeUndefined();
  });
});

describe('getFailoverUrlsByChainId', () => {
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
    delete process.env.QUICKNODE_BSC_URL;
  });
});
