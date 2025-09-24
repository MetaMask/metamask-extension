import { Mockttp } from 'mockttp';
import { Suite } from 'mocha';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import { withSolanaAccountSnap } from './common-solana';

async function mockPrices(mockServer: Mockttp) {
  return [
    await mockServer
      .forGet('https://price.api.cx.metamask.io/v1/exchange-rates/fiat')
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            usd: {
              name: 'US Dollar',
              ticker: 'usd',
              value: 1,
              currencyType: 'fiat',
            },
          },
        };
      }),
    await mockServer
      .forGet('https://price.api.cx.metamask.io/v3/spot-prices')
      .withQuery({ vsCurrency: 'usd' })
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
              id: 'solana',
              price: 163.74,
              marketCap: 85240788097,
              allTimeHigh: 293.31,
              allTimeLow: 0.500801,
              totalVolume: 4306381631,
              high1d: 173.18,
              low1d: 162.57,
              circulatingSupply: 520522161.3627983,
              dilutedMarketCap: 98555143736,
              marketCapPercentChange1d: -5.2731,
              priceChange1d: -9.122376720800048,
              pricePercentChange1h: 0.5171225698118852,
              pricePercentChange1d: -5.277226892974154,
              pricePercentChange7d: -12.003587000905496,
              pricePercentChange14d: -3.9104548446262988,
              pricePercentChange30d: 11.535941297762168,
              pricePercentChange200d: -22.05161310809915,
              pricePercentChange1y: -1.0572936468057204,
            },
          },
        };
      }),
  ];
}

describe('Check balance', function (this: Suite) {
  this.timeout(300000);
  it('Just created Solana account shows 0 SOL when native token is enabled', async function () {
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: true,
        mockZeroBalance: true,
      },
      async (driver) => {
        const homePage = new NonEvmHomepage(driver);
        await homePage.checkGetBalance('0', 'SOL');
      },
    );
  });
  it('Just created Solana account shows 0 USD when native token is not enabled', async function () {
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: false,
        mockZeroBalance: true,
        withCustomMocks: mockPrices,
      },
      async (driver) => {
        const homePage = new NonEvmHomepage(driver);
        await homePage.checkGetBalance('$0.00', 'USD');
      },
    );
  });
  it('For a non 0 balance account - USD balance', async function () {
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: false,
        mockZeroBalance: false,
        withCustomMocks: mockPrices,
      },
      async (driver) => {
        const homePage = new NonEvmHomepage(driver);
        await homePage.checkGetBalance('$5,643.50', 'USD');
      },
    );
  });
  it('For a non 0 balance account - SOL balance', async function () {
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: true,
      },
      async (driver) => {
        const homePage = new NonEvmHomepage(driver);
        await homePage.checkGetBalance('50', 'SOL');
      },
    );
  });
});
