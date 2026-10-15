import { getChainlistRpcSuggestions, getRpcNickname } from './chainlist-rpc';

describe('getRpcNickname', () => {
  it('returns the host without the scheme or path', () => {
    expect(getRpcNickname('https://ethereum-rpc.publicnode.com/foo')).toBe(
      'ethereum-rpc.publicnode.com',
    );
  });

  it('returns undefined for a URL that cannot be parsed', () => {
    expect(getRpcNickname('not a url')).toBeUndefined();
  });
});

describe('getChainlistRpcSuggestions', () => {
  const chains = [
    {
      chainId: 100,
      rpc: [
        'https://rpc.gnosischain.com',
        'https://gnosis-rpc.publicnode.com/foo',
        'http://insecure.example.com',
        `https://rpc.example.com/${'$'}{API_KEY}`,
        { url: 'https://object-rpc.example.com' },
      ],
    },
    {
      chainId: 1,
      rpc: ['https://cloudflare-eth.com'],
    },
  ];

  it('returns usable RPCs for the requested chain only', () => {
    expect(
      getChainlistRpcSuggestions({ chains, chainId: '0x64' }).map(
        ({ url }) => url,
      ),
    ).toStrictEqual([
      'https://rpc.gnosischain.com',
      'https://gnosis-rpc.publicnode.com/foo',
      'https://object-rpc.example.com',
    ]);
  });

  it('hides RPCs that are already added', () => {
    expect(
      getChainlistRpcSuggestions({
        chains,
        chainId: '100',
        existingRpcUrls: ['https://rpc.gnosischain.com/'],
      }).map(({ nickname }) => nickname),
    ).toStrictEqual(['gnosis-rpc.publicnode.com', 'object-rpc.example.com']);
  });

  it('filters suggestions by the typed URL or host', () => {
    expect(
      getChainlistRpcSuggestions({
        chains,
        chainId: '100',
        query: 'publicnode',
      }),
    ).toStrictEqual([
      {
        url: 'https://gnosis-rpc.publicnode.com/foo',
        nickname: 'gnosis-rpc.publicnode.com',
      },
    ]);
  });

  it('returns no suggestions when the chain ID does not match', () => {
    expect(
      getChainlistRpcSuggestions({ chains, chainId: '999' }),
    ).toStrictEqual([]);
  });
});
