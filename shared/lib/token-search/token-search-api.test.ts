import {
  browseTokens,
  buildTokenSearchQueryString,
  searchTokens,
} from './token-search-api';

describe('buildTokenSearchQueryString', () => {
  it('includes the trimmed query and the comma-joined CAIP-2 networks list', () => {
    expect(
      buildTokenSearchQueryString({
        query: 'usdc',
        networks: ['eip155:1', 'eip155:137'],
      }),
    ).toBe('query=usdc&networks=eip155%3A1%2Ceip155%3A137');
  });

  it('omits the networks param when none are provided', () => {
    expect(buildTokenSearchQueryString({ query: 'usdc' })).toBe('query=usdc');
  });

  it('omits the networks param when an empty array is provided', () => {
    expect(buildTokenSearchQueryString({ query: 'usdc', networks: [] })).toBe(
      'query=usdc',
    );
  });

  it('serialises first and after pagination params when supplied', () => {
    expect(
      buildTokenSearchQueryString({
        query: 'usdc',
        first: 25,
        after: 'MA==',
      }),
    ).toBe('query=usdc&first=25&after=MA%3D%3D');
  });

  it('opts into security data only when requested', () => {
    expect(
      buildTokenSearchQueryString({
        query: 'usdc',
        includeTokenSecurityData: true,
      }),
    ).toBe('query=usdc&includeTokenSecurityData=true');
    expect(
      buildTokenSearchQueryString({
        query: 'usdc',
        includeTokenSecurityData: false,
      }),
    ).toBe('query=usdc');
  });
});

describe('searchTokens', () => {
  const realFetch = global.fetch;

  afterEach(() => {
    global.fetch = realFetch;
    jest.restoreAllMocks();
  });

  it('returns the parsed JSON payload from the API', async () => {
    const payload = {
      data: [
        {
          assetId: 'eip155:1/erc20:0xaaa',
          symbol: 'USDC',
          decimals: 6,
          name: 'USD Coin',
        },
      ],
      count: 1,
      totalCount: 1,
      pageInfo: { hasNextPage: false, endCursor: '' },
    };
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => payload,
    });
    global.fetch = fetchMock as unknown as typeof global.fetch;

    const response = await searchTokens({
      query: 'usdc',
      networks: ['eip155:1'],
    });

    expect(response).toStrictEqual(payload);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe(
      'https://token.api.cx.metamask.io/tokens/search?query=usdc&networks=eip155%3A1',
    );
  });

  it('short-circuits with an empty page when the query is whitespace-only', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof global.fetch;

    const response = await searchTokens({ query: '   ' });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(response).toStrictEqual({
      data: [],
      count: 0,
      totalCount: 0,
      pageInfo: { hasNextPage: false, endCursor: '' },
    });
  });

  it('throws when the API responds with a non-2xx status', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({}),
    }) as unknown as typeof global.fetch;

    await expect(searchTokens({ query: 'usdc' })).rejects.toThrow(
      /Token search failed: 500/u,
    );
  });
});

describe('browseTokens', () => {
  const realFetch = global.fetch;

  afterEach(() => {
    global.fetch = realFetch;
    jest.restoreAllMocks();
  });

  it('uses token search with a blank query and preserves network pagination', async () => {
    const payload = {
      data: [
        {
          assetId:
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          symbol: 'USDC',
          decimals: 6,
          name: 'USD Coin',
        },
      ],
      count: 1,
      totalCount: 30_947,
      pageInfo: { hasNextPage: true, endCursor: 'MjQ=' },
    };
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => payload,
    });
    global.fetch = fetchMock as unknown as typeof global.fetch;

    const response = await browseTokens({
      networks: ['eip155:1', 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'],
      first: 25,
      after: 'MA==',
    });

    expect(response).toStrictEqual(payload);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe(
      'https://token.api.cx.metamask.io/tokens/search?query=+&networks=eip155%3A1%2Csolana%3A5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp&first=25&after=MA%3D%3D',
    );
  });

  it('throws when the API responds with a non-2xx status', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({}),
    }) as unknown as typeof global.fetch;

    await expect(browseTokens({ networks: ['eip155:1'] })).rejects.toThrow(
      /Token search failed: 500/u,
    );
  });
});
