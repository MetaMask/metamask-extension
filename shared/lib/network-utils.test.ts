import { getIsMetaMaskInfuraEndpointUrl } from './network-utils';

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
}));

jest.mock('@metamask/controller-utils', () => ({
  BUILT_IN_CUSTOM_NETWORKS_RPC: {
    'Custom Network': 'https://custom.example.com/1',
    'Custom Network 2': 'https://custom.example.com/2',
  },
}));

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
