import { toSpotPriceResponse } from './mocks';

describe('toSpotPriceResponse', () => {
  it('keeps the caller slug and does not copy the CAIP key into id', () => {
    const ethAssetId = 'eip155:1/slip44:60';
    const usdcAssetId =
      'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

    const response = toSpotPriceResponse({
      [ethAssetId]: {
        id: 'ethereum',
        price: 1700,
        marketCap: 382623505141,
        pricePercentChange1d: 0,
      },
      [usdcAssetId]: {
        id: 'usd-coin',
        price: 1,
        marketCap: 0,
      },
    });

    expect(response[ethAssetId]?.id).toBe('ethereum');
    expect(response[usdcAssetId]?.id).toBe('usd-coin');
    expect(response[ethAssetId]?.id).not.toBe(ethAssetId);
    expect(response[usdcAssetId]?.price).toBe(1);
    expect(response[ethAssetId]?.totalVolume).toBe(0);
  });

  it('requires a slug on every entry', () => {
    toSpotPriceResponse({
      // @ts-expect-error id is the Price API slug and must be passed explicitly
      'eip155:1/slip44:60': {
        price: 1700,
        marketCap: 1,
      },
    });
  });
});
