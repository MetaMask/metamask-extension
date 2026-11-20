import { fetchPriceHistory, resolveTicker } from './data';

let fetchMock: jest.Spied<typeof globalThis.fetch>;

beforeEach(() => {
  fetchMock = jest.spyOn(globalThis, 'fetch');
});

afterEach(() => {
  fetchMock.mockRestore();
});

describe('resolveTicker', () => {
  it('keeps search order for the table and uses the first match for the card', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            assetId: 'eip155:1/erc20:0xlow',
            symbol: 'QQQ',
            name: 'Lower QQQ',
            liquidity: 20,
            aggregatedUsdVolume: 200,
            marketCap: 10,
          },
          {
            assetId: 'eip155:1/erc20:0xhigh',
            symbol: 'qqq',
            name: 'Higher QQQ',
            liquidity: 20,
            aggregatedUsdVolume: 300,
            marketCap: 20,
          },
          {
            assetId: 'eip155:1/erc20:0xother',
            symbol: 'QQQX',
            name: 'Other token',
            liquidity: 100,
            aggregatedUsdVolume: 1000,
            marketCap: 100,
          },
        ],
      }),
    } as Response);

    await expect(resolveTicker(' qqq ')).resolves.toMatchObject({
      primary: {
        ticker: 'QQQ',
        name: 'Lower QQQ',
        caipAssetId: 'eip155:1/erc20:0xlow',
      },
      similar: [
        expect.objectContaining({
          name: 'Higher QQQ',
          caipAssetId: 'eip155:1/erc20:0xhigh',
        }),
      ],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/query=QQQ.*includeRwaData=true/u),
      expect.objectContaining({
        method: 'GET',
        headers: { 'X-Client-Id': 'extension' },
      }),
    );
  });

  it('matches an exact symbol rather than a higher-market-cap prefix', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            assetId: 'eip155:1/erc20:0xdoge',
            symbol: 'DOGE',
            name: 'Dogecoin',
            marketCap: 100,
          },
          {
            assetId: 'eip155:1/erc20:0xdog',
            symbol: 'DOG',
            name: 'Dog',
            marketCap: 10,
          },
        ],
      }),
    } as Response);

    await expect(resolveTicker('dog')).resolves.toMatchObject({
      primary: { ticker: 'DOG' },
      similar: [],
    });
  });

  it('matches an RWA ticker exactly and excludes unmatched token symbols', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            assetId: 'eip155:1/erc20:0xrmsft',
            symbol: 'RMSFT',
            name: 'RMSFT without RWA data',
            marketCap: 100,
          },
          {
            assetId: 'eip155:1/erc20:0xmsftx',
            symbol: 'MSFTX',
            name: 'MSFTX without RWA data',
            marketCap: 90,
          },
          {
            assetId: 'eip155:1/erc20:0xstock',
            symbol: 'MSFTX',
            name: 'Microsoft stock token',
            rwaData: { ticker: ' msft ' },
            marketCap: 20,
          },
          {
            assetId: 'eip155:1/erc20:0xwrong',
            symbol: 'OTHER',
            name: 'Unrelated stock',
            rwaData: { ticker: 'MSFTX' },
            marketCap: 200,
          },
          {
            assetId: 'eip155:1/erc20:0xexact',
            symbol: 'msft',
            name: 'Exact symbol',
            rwaData: { ticker: 'MSFT' },
            marketCap: 10,
          },
        ],
      }),
    } as Response);

    await expect(resolveTicker(' MSFT ')).resolves.toMatchObject({
      primary: { ticker: 'msft', name: 'Exact symbol' },
      similar: [expect.objectContaining({ name: 'Microsoft stock token' })],
    });
  });

  it('returns null when every match has no market cap', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            assetId: 'eip155:1/erc20:0xnone',
            symbol: 'QQQ',
            name: 'No cap',
            marketCap: null,
          },
          {
            assetId: 'eip155:1/erc20:0xzero',
            symbol: 'QQQ',
            name: 'Zero cap',
            marketCap: 0,
          },
        ],
      }),
    } as Response);

    await expect(resolveTicker('QQQ')).resolves.toBeNull();
  });

  it('keeps a match when another resource has no market cap', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            assetId: 'eip155:1/erc20:0xzero',
            symbol: 'QQQ',
            name: 'Zero cap',
            marketCap: 0,
          },
          {
            assetId: 'eip155:1/erc20:0xpriced',
            symbol: 'QQQ',
            name: 'Priced',
            marketCap: 5,
          },
        ],
      }),
    } as Response);

    await expect(resolveTicker('QQQ')).resolves.toMatchObject({
      primary: { name: 'Zero cap', marketCap: 0 },
      similar: [expect.objectContaining({ name: 'Priced', marketCap: 5 })],
    });
  });

  it('returns null for an empty ticker or an unsuccessful search', async () => {
    await expect(resolveTicker('   ')).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();

    fetchMock.mockResolvedValue({ ok: false } as Response);
    await expect(resolveTicker('QQQ')).resolves.toBeNull();
  });
});

describe('fetchPriceHistory', () => {
  it('filters invalid points and maps valid points', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        prices: [
          [1000, 1],
          ['invalid', 2],
          [2000, Number.NaN],
          [3000, 3],
        ],
      }),
    } as Response);

    await expect(fetchPriceHistory('eip155:1/erc20:0xtoken')).resolves.toEqual([
      { time: 1000, value: 1 },
      { time: 3000, value: 3 },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        '/eip155:1/erc20:0xtoken?vsCurrency=usd&timePeriod=1D',
      ),
      expect.objectContaining({
        method: 'GET',
        headers: { 'X-Client-Id': 'extension' },
      }),
    );
  });

  it('returns null for invalid IDs, failed requests, or fewer than two points', async () => {
    await expect(fetchPriceHistory('invalid')).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();

    fetchMock.mockResolvedValueOnce({ ok: false } as Response);
    await expect(
      fetchPriceHistory('eip155:1/erc20:0xtoken'),
    ).resolves.toBeNull();

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ prices: [[1000, 1]] }),
    } as Response);
    await expect(
      fetchPriceHistory('eip155:1/erc20:0xtoken'),
    ).resolves.toBeNull();
  });
});
