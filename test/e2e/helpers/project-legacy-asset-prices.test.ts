import FixtureBuilderV2 from '../fixtures/fixture-builder-v2';

const MAINNET_ETH_ASSET_ID = 'eip155:1/slip44:60';
const LOCALHOST_ETH_ASSET_ID = 'eip155:1337/slip44:1';
const OPTIMISM_ETH_ASSET_ID = 'eip155:10/slip44:60';
const BTC_ASSET_ID = 'bip122:000000000019d6689c085ae165831e93/slip44:0';

type AssetsPrice = Record<
  string,
  { price?: number; usdPrice?: number; assetPriceType?: string }
>;

function assetsPriceOf(fixture: ReturnType<FixtureBuilderV2['build']>) {
  const data = fixture.data as Record<string, { assetsPrice?: AssetsPrice }>;
  return data.AssetsController?.assetsPrice;
}

describe('projectLegacyRatesIntoAssetsPrice', () => {
  it('copies the CurrencyController ETH rate onto native prices the fixture already has', () => {
    const prices = assetsPriceOf(new FixtureBuilderV2().build());

    expect(prices?.[MAINNET_ETH_ASSET_ID]).toMatchObject({
      assetPriceType: 'fungible',
      price: 1700,
      usdPrice: 1700,
    });
    expect(prices?.[LOCALHOST_ETH_ASSET_ID]?.price).toBe(1700);
    expect(prices?.[OPTIMISM_ETH_ASSET_ID]).toBeUndefined();
  });

  it('copies MultichainAssetsRatesController rates that have no assetsPrice entry', () => {
    const prices = assetsPriceOf(new FixtureBuilderV2().build());

    expect(prices?.[BTC_ASSET_ID]).toMatchObject({
      assetPriceType: 'fungible',
      price: 106763,
      usdPrice: 106763,
    });
  });

  it('keeps an assetsPrice entry the test set explicitly', () => {
    const prices = assetsPriceOf(
      new FixtureBuilderV2()
        .withAssetsController({
          assetsPrice: {
            [MAINNET_ETH_ASSET_ID]: {
              assetPriceType: 'fungible',
              id: 'ethereum',
              lastUpdated: 0,
              price: 3401,
              usdPrice: 3401,
            },
          },
        })
        .build(),
    );

    expect(prices?.[MAINNET_ETH_ASSET_ID]?.price).toBe(3401);
    expect(prices?.[LOCALHOST_ETH_ASSET_ID]?.price).toBe(1700);
  });

  it('follows a CurrencyController rate the test set', () => {
    const prices = assetsPriceOf(
      new FixtureBuilderV2()
        .withCurrencyController({
          currencyRates: {
            ETH: {
              conversionDate: null,
              conversionRate: 3010,
              usdConversionRate: 3010,
            },
          },
        })
        .build(),
    );

    expect(prices?.[MAINNET_ETH_ASSET_ID]?.price).toBe(3010);
    expect(prices?.[MAINNET_ETH_ASSET_ID]?.usdPrice).toBe(3010);
  });
});
