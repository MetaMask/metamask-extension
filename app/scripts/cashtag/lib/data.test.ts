import { fetchPriceHistory, resolveTicker } from './data';

let fetchMock: jest.Spied<typeof globalThis.fetch>;

beforeEach(() => {
  fetchMock = jest.spyOn(globalThis, 'fetch');
});

afterEach(() => {
  fetchMock.mockRestore();
});

describe('resolveTicker', () => {
  it('normalizes the ticker, filters non-exact matches, and orders assets by market cap', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            assetId: 'eip155:1/erc20:0xlow',
            symbol: 'QQQ',
            name: 'Lower QQQ',
            marketCap: 10,
          },
          {
            assetId: 'eip155:1/erc20:0xhigh',
            symbol: 'qqq',
            name: 'Higher QQQ',
            marketCap: 20,
          },
          {
            assetId: 'eip155:1/erc20:0xother',
            symbol: 'QQQX',
            name: 'Other token',
            marketCap: 100,
          },
        ],
      }),
    } as Response);

    await expect(resolveTicker(' qqq ')).resolves.toMatchObject({
      primary: {
        ticker: 'QQQ',
        name: 'Higher QQQ',
        caipAssetId: 'eip155:1/erc20:0xhigh',
      },
      similar: [
        expect.objectContaining({
          name: 'Lower QQQ',
          caipAssetId: 'eip155:1/erc20:0xlow',
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
