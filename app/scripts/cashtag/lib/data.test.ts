import { fetchPriceHistory, resolveTicker } from './data';

let fetchMock: jest.Spied<typeof globalThis.fetch>;

beforeEach(() => {
  fetchMock = jest.spyOn(globalThis, 'fetch');
});

afterEach(() => {
  fetchMock.mockRestore();
});

describe('resolveTicker', () => {
  it('preserves the API order for the primary and similar assets', async () => {
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
          ticker: 'qqq',
          name: 'Higher QQQ',
          caipAssetId: 'eip155:1/erc20:0xhigh',
        }),
        expect.objectContaining({
          ticker: 'QQQX',
          name: 'Other token',
          caipAssetId: 'eip155:1/erc20:0xother',
        }),
      ],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('query=QQQ'),
      expect.objectContaining({
        method: 'GET',
        headers: { 'X-Client-Id': 'extension' },
      }),
    );
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
