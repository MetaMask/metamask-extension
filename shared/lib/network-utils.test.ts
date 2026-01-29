import { BUILT_IN_CUSTOM_NETWORKS_RPC } from '@metamask/controller-utils';

import {
  FEATURED_RPCS,
  QUICKNODE_ENDPOINT_URLS_BY_INFURA_NETWORK_NAME,
} from '../constants/network';
import {
  getIsMetaMaskInfuraEndpointUrl,
  getIsQuicknodeEndpointUrl,
  isPublicEndpointUrl,
  initializeChainlistDomains,
  isChainlistDomain,
  isChainlistEndpointUrl,
  resetChainlistDomainsCache,
} from './network-utils';
import * as storageHelpers from './storage-helpers';

jest.mock('../constants/network', () => ({
  FEATURED_RPCS: [
    {
      chainId: '0x111',
      name: 'Featured Network 1',
      nativeCurrency: 'ETH',
      rpcEndpoints: [
        {
          name: 'Featured RPC 1',
          url: 'https://featured.example.com/1',
          type: 'custom',
        },
        {
          name: 'Featured RPC 2',
          url: 'https://featured.example.com/2',
          type: 'custom',
        },
      ],
    },
    {
      chainId: '0x222',
      name: 'Featured Network 2',
      nativeCurrency: 'ETH',
      rpcEndpoints: [
        {
          url: 'https://featured.example.com/3',
          type: 'custom',
        },
      ],
    },
  ],
  QUICKNODE_ENDPOINT_URLS_BY_INFURA_NETWORK_NAME: {
    'ethereum-mainnet': () => 'https://mainnet.quiknode.pro/test',
    'ethereum-sepolia': () => 'https://sepolia.quiknode.pro/test',
  },
}));

jest.mock('@metamask/controller-utils', () => ({
  BUILT_IN_CUSTOM_NETWORKS_RPC: {
    'Custom Network': 'https://custom.example.com/1',
    'Custom Network 2': 'https://custom.example.com/2',
  },
}));

const MOCK_METAMASK_INFURA_PROJECT_ID = 'metamask-infura-project-id';

describe('getIsMetaMaskInfuraEndpointUrl', () => {
  it('returns true given an Infura v3 URL with the MetaMask API key at the end', () => {
    expect(
      getIsMetaMaskInfuraEndpointUrl(
        'https://some-subdomain.infura.io/v3/the-infura-project-id',
        'the-infura-project-id',
      ),
    ).toBe(true);
  });

  it('returns true given an Infura v3 URL with {infuraProjectId} at the end', () => {
    expect(
      getIsMetaMaskInfuraEndpointUrl(
        'https://some-subdomain.infura.io/v3/{infuraProjectId}',
        'the-infura-project-id',
      ),
    ).toBe(true);
  });

  it('returns false given an Infura URL with a different API key at the end', () => {
    expect(
      getIsMetaMaskInfuraEndpointUrl(
        'https://some-subdomain.infura.io/v3/some-other-project-id',
        'the-infura-project-id',
      ),
    ).toBe(false);
  });

  it('returns false given an Infura URL but the version is not v3', () => {
    expect(
      getIsMetaMaskInfuraEndpointUrl(
        'https://some-subdomain.infura.io/v2/the-infura-project-id',
        'the-infura-project-id',
      ),
    ).toBe(false);
  });

  it('returns false if the URL does not have infura.io as the host', () => {
    expect(
      getIsMetaMaskInfuraEndpointUrl(
        'https://some-other-domain.com/v3/the-infura-project-id',
        'the-infura-project-id',
      ),
    ).toBe(false);
  });

  it('returns false if the URL does not use HTTPS', () => {
    expect(
      getIsMetaMaskInfuraEndpointUrl(
        'http://some-subdomain.infura.io/v3/the-infura-project-id',
        'the-infura-project-id',
      ),
    ).toBe(false);
  });

  it('returns false given an Infura URL with a MetaMask API key at the end, but there is a query string', () => {
    expect(
      getIsMetaMaskInfuraEndpointUrl(
        'https://some-subdomain.infura.io/v3/the-infura-project-id?foo=bar',
        'the-infura-project-id',
      ),
    ).toBe(false);
  });

  it('returns false given an Infura URL with a MetaMask API key at the end, but there is a fragment', () => {
    expect(
      getIsMetaMaskInfuraEndpointUrl(
        'https://some-subdomain.infura.io/v3/the-infura-project-id#fragment',
        'the-infura-project-id',
      ),
    ).toBe(false);
  });

  it('returns false for an empty URL', () => {
    expect(getIsMetaMaskInfuraEndpointUrl('', 'the-infura-project-id')).toBe(
      false,
    );
  });
});

describe('getIsQuicknodeEndpointUrl', () => {
  for (const getQuicknodeEndpointUrl of Object.values(
    QUICKNODE_ENDPOINT_URLS_BY_INFURA_NETWORK_NAME,
  )) {
    const quicknodeEndpointUrl = getQuicknodeEndpointUrl();
    it(`returns true for known Quicknode URL "${quicknodeEndpointUrl}"`, () => {
      // We can assume this is set.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(getIsQuicknodeEndpointUrl(quicknodeEndpointUrl!)).toBe(true);
    });
  }

  it('returns false for unknown URLs', () => {
    expect(getIsQuicknodeEndpointUrl('https://unknown.example.com')).toBe(
      false,
    );
  });

  it('returns false for an empty URL', () => {
    expect(getIsQuicknodeEndpointUrl('')).toBe(false);
  });
});

describe('isPublicEndpointUrl', () => {
  it('returns true for Infura URLs', () => {
    expect(
      isPublicEndpointUrl(
        `https://mainnet.infura.io/v3/${MOCK_METAMASK_INFURA_PROJECT_ID}`,
        MOCK_METAMASK_INFURA_PROJECT_ID,
      ),
    ).toBe(true);
  });

  it('returns true for Quicknode URLs', () => {
    const quicknodeUrl =
      QUICKNODE_ENDPOINT_URLS_BY_INFURA_NETWORK_NAME['ethereum-mainnet']();
    expect(
      // We can assume this is set.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      isPublicEndpointUrl(quicknodeUrl!, MOCK_METAMASK_INFURA_PROJECT_ID),
    ).toBe(true);
  });

  it('returns true for featured RPC endpoints', () => {
    const featuredUrl = FEATURED_RPCS[0].rpcEndpoints[0].url;
    expect(
      isPublicEndpointUrl(featuredUrl, MOCK_METAMASK_INFURA_PROJECT_ID),
    ).toBe(true);
  });

  it('returns true for built-in custom endpoints', () => {
    const builtInUrl = Object.values(BUILT_IN_CUSTOM_NETWORKS_RPC)[0];
    expect(
      isPublicEndpointUrl(builtInUrl, MOCK_METAMASK_INFURA_PROJECT_ID),
    ).toBe(true);
  });

  it('returns false for unknown URLs when chainlist is not initialized', () => {
    resetChainlistDomainsCache();
    expect(
      isPublicEndpointUrl(
        'https://unknown.example.com',
        MOCK_METAMASK_INFURA_PROJECT_ID,
      ),
    ).toBe(false);
  });

  it('returns true for chainlist domains after initialization', async () => {
    resetChainlistDomainsCache();
    jest.spyOn(storageHelpers, 'getStorageItem').mockResolvedValue({
      cachedResponse: [
        {
          name: 'Test Chain',
          chainId: 1,
          rpc: ['https://chainlist-rpc.example.com/rpc'],
        },
      ],
    });

    await initializeChainlistDomains();

    expect(
      isPublicEndpointUrl(
        'https://chainlist-rpc.example.com/v1/abc123',
        MOCK_METAMASK_INFURA_PROJECT_ID,
      ),
    ).toBe(true);
  });
});

describe('initializeChainlistDomains', () => {
  beforeEach(() => {
    resetChainlistDomainsCache();
    jest.clearAllMocks();
  });

  it('initializes domains from cached chains list', async () => {
    jest.spyOn(storageHelpers, 'getStorageItem').mockResolvedValue({
      cachedResponse: [
        {
          name: 'Ethereum Mainnet',
          chainId: 1,
          rpc: [
            'https://mainnet.infura.io/v3/key',
            'https://eth-mainnet.alchemyapi.io/v2/key',
          ],
        },
        {
          name: 'Polygon',
          chainId: 137,
          rpc: ['https://polygon-rpc.com'],
        },
      ],
    });

    await initializeChainlistDomains();

    expect(isChainlistDomain('mainnet.infura.io')).toBe(true);
    expect(isChainlistDomain('eth-mainnet.alchemyapi.io')).toBe(true);
    expect(isChainlistDomain('polygon-rpc.com')).toBe(true);
    expect(isChainlistDomain('unknown.com')).toBe(false);
  });

  it('handles empty chains list', async () => {
    jest.spyOn(storageHelpers, 'getStorageItem').mockResolvedValue({
      cachedResponse: [],
    });

    await initializeChainlistDomains();

    expect(isChainlistDomain('any-domain.com')).toBe(false);
  });

  it('handles missing cache', async () => {
    jest.spyOn(storageHelpers, 'getStorageItem').mockResolvedValue(undefined);

    await initializeChainlistDomains();

    expect(isChainlistDomain('any-domain.com')).toBe(false);
  });

  it('handles chains without rpc field', async () => {
    jest.spyOn(storageHelpers, 'getStorageItem').mockResolvedValue({
      cachedResponse: [
        {
          name: 'Chain Without RPC',
          chainId: 999,
        },
      ],
    });

    await initializeChainlistDomains();

    expect(isChainlistDomain('any-domain.com')).toBe(false);
  });

  it('skips invalid URLs in rpc list', async () => {
    jest.spyOn(storageHelpers, 'getStorageItem').mockResolvedValue({
      cachedResponse: [
        {
          name: 'Chain With Invalid RPC',
          chainId: 999,
          rpc: ['not-a-valid-url', 'https://valid-rpc.com'],
        },
      ],
    });

    await initializeChainlistDomains();

    expect(isChainlistDomain('valid-rpc.com')).toBe(true);
  });

  it('only fetches from storage once on subsequent calls', async () => {
    const getStorageItemSpy = jest
      .spyOn(storageHelpers, 'getStorageItem')
      .mockResolvedValue({
        cachedResponse: [],
      });

    await initializeChainlistDomains();
    await initializeChainlistDomains();
    await initializeChainlistDomains();

    // Storage should only be accessed once despite multiple calls
    expect(getStorageItemSpy).toHaveBeenCalledTimes(1);
  });
});

describe('isChainlistDomain', () => {
  beforeEach(() => {
    resetChainlistDomainsCache();
  });

  it('returns false when not initialized', () => {
    expect(isChainlistDomain('any-domain.com')).toBe(false);
  });

  it('returns false for empty domain', async () => {
    jest.spyOn(storageHelpers, 'getStorageItem').mockResolvedValue({
      cachedResponse: [
        { name: 'Test', chainId: 1, rpc: ['https://test.com'] },
      ],
    });
    await initializeChainlistDomains();

    expect(isChainlistDomain('')).toBe(false);
  });

  it('is case insensitive', async () => {
    jest.spyOn(storageHelpers, 'getStorageItem').mockResolvedValue({
      cachedResponse: [
        { name: 'Test', chainId: 1, rpc: ['https://Test-RPC.COM/path'] },
      ],
    });
    await initializeChainlistDomains();

    expect(isChainlistDomain('test-rpc.com')).toBe(true);
    expect(isChainlistDomain('TEST-RPC.COM')).toBe(true);
    expect(isChainlistDomain('Test-RPC.com')).toBe(true);
  });
});

describe('isChainlistEndpointUrl', () => {
  beforeEach(() => {
    resetChainlistDomainsCache();
  });

  it('returns false when not initialized', () => {
    expect(isChainlistEndpointUrl('https://any-domain.com/rpc')).toBe(false);
  });

  it('returns true for URLs with chainlist domains', async () => {
    jest.spyOn(storageHelpers, 'getStorageItem').mockResolvedValue({
      cachedResponse: [
        { name: 'Test', chainId: 1, rpc: ['https://chainlist-domain.com'] },
      ],
    });
    await initializeChainlistDomains();

    expect(
      isChainlistEndpointUrl('https://chainlist-domain.com/v1/abc123'),
    ).toBe(true);
    expect(isChainlistEndpointUrl('https://chainlist-domain.com')).toBe(true);
  });

  it('returns false for URLs with unknown domains', async () => {
    jest.spyOn(storageHelpers, 'getStorageItem').mockResolvedValue({
      cachedResponse: [
        { name: 'Test', chainId: 1, rpc: ['https://known-domain.com'] },
      ],
    });
    await initializeChainlistDomains();

    expect(isChainlistEndpointUrl('https://unknown-domain.com/rpc')).toBe(
      false,
    );
  });

  it('returns false for invalid URLs', () => {
    expect(isChainlistEndpointUrl('not-a-url')).toBe(false);
    expect(isChainlistEndpointUrl('')).toBe(false);
  });
});

describe('resetChainlistDomainsCache', () => {
  it('clears the cache and allows reinitialization', async () => {
    jest.spyOn(storageHelpers, 'getStorageItem').mockResolvedValue({
      cachedResponse: [
        { name: 'First', chainId: 1, rpc: ['https://first-domain.com'] },
      ],
    });
    await initializeChainlistDomains();
    expect(isChainlistDomain('first-domain.com')).toBe(true);

    resetChainlistDomainsCache();
    expect(isChainlistDomain('first-domain.com')).toBe(false);

    jest.spyOn(storageHelpers, 'getStorageItem').mockResolvedValue({
      cachedResponse: [
        { name: 'Second', chainId: 2, rpc: ['https://second-domain.com'] },
      ],
    });
    await initializeChainlistDomains();
    expect(isChainlistDomain('second-domain.com')).toBe(true);
    expect(isChainlistDomain('first-domain.com')).toBe(false);
  });
});
