import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import { Context } from 'mocha';
import { zeroAddress } from 'ethereumjs-util';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import FixtureBuilder from '../../fixture-builder';
import {
  clickNestedButton,
  defaultGanacheOptions,
  unlockWallet,
  withFixtures,
} from '../../helpers';
import { Driver } from '../../webdriver/driver';

describe('Token List', function () {
  const chainId = CHAIN_IDS.MAINNET;
  const tokenAddress = '0x2EFA2Cb29C2341d8E5Ba7D3262C9e9d6f1Bf3711';
  const symbol = 'foo';

  const fixtures = {
    fixtures: new FixtureBuilder({ inputChainId: chainId }).build(),
    ganacheOptions: {
      ...defaultGanacheOptions,
      chainId: parseInt(chainId, 16),
    },
  };

  const importToken = async (driver: Driver) => {
    await driver.clickElement({ text: 'Import tokens', tag: 'button' });
    await clickNestedButton(driver, 'Custom token');
    await driver.fill(
      '[data-testid="import-tokens-modal-custom-address"]',
      tokenAddress,
    );
    await driver.waitForSelector('p.mm-box--color-error-default');
    await driver.fill(
      '[data-testid="import-tokens-modal-custom-symbol"]',
      symbol,
    );
    await driver.clickElement({ text: 'Next', tag: 'button' });
    await driver.clickElement(
      '[data-testid="import-tokens-modal-import-button"]',
    );
  };

  it('should not shows percentage increase for an ERC20 token without prices available', async function () {
    await withFixtures(
      {
        ...fixtures,
        title: (this as Context).test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => [
          // Mock no current price
          await mockServer
            .forGet(
              `https://price.api.cx.metamask.io/v2/chains/${parseInt(
                chainId,
                16,
              )}/spot-prices`,
            )
            .thenCallback(() => ({
              statusCode: 200,
              json: {},
            })),
          // Mock no historical prices
          await mockServer
            .forGet(
              `https://price.api.cx.metamask.io/v1/chains/${chainId}/historical-prices/${tokenAddress}`,
            )
            .thenCallback(() => ({
              statusCode: 200,
              json: {},
            })),
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        await importToken(driver);

        // Verify native token increase
        const testIdNative = `token-increase-decrease-percentage-${zeroAddress()}`;

        // Verify native token increase
        const testId = `token-increase-decrease-percentage-${tokenAddress}`;

        const percentageNative = await (
          await driver.findElement(`[data-testid="${testIdNative}"]`)
        ).getText();
        assert.equal(percentageNative, '');

        const percentage = await (
          await driver.findElement(`[data-testid="${testId}"]`)
        ).getText();
        assert.equal(percentage, '');
      },
    );
  });

  it('shows percentage increase for an ERC20 token with prices available', async function () {
    const ethConversionInUsd = 10000;

    // Prices are in ETH
    const marketData = {
      price: 0.123,
      marketCap: 12,
      pricePercentChange1d: 0.05,
    };

    const marketDataNative = {
      price: 0.123,
      marketCap: 12,
      pricePercentChange1d: 0.02,
    };

    await withFixtures(
      {
        ...fixtures,
        title: (this as Context).test?.fullTitle(),
        ethConversionInUsd,
        testSpecificMock: async (mockServer: Mockttp) => [
          // Mock current price
          await mockServer
            .forGet(
              `https://price.api.cx.metamask.io/v2/chains/${parseInt(
                chainId,
                16,
              )}/spot-prices`,
            )
            .thenCallback(() => ({
              statusCode: 200,
              json: {
                [zeroAddress()]: marketDataNative,
                [tokenAddress.toLowerCase()]: marketData,
              },
            })),
          // Mock historical prices
          await mockServer
            .forGet(
              `https://price.api.cx.metamask.io/v1/chains/${chainId}/historical-prices/${toChecksumHexAddress(
                tokenAddress,
              )}`,
            )
            .thenCallback(() => ({
              statusCode: 200,
              json: {
                prices: [
                  [1717566000000, marketData.price * 0.9],
                  [1717566322300, marketData.price],
                  [1717566611338, marketData.price * 1.1],
                ],
              },
            })),
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        await importToken(driver);
        await driver.delay(500);

        // Verify native token increase
        const testIdNative = `token-increase-decrease-percentage-${zeroAddress()}`;

        // Verify native token increase
        const testId = `token-increase-decrease-percentage-${tokenAddress}`;

        const percentageNative = await (
          await driver.findElement(`[data-testid="${testIdNative}"]`)
        ).getText();
        assert.equal(percentageNative, '+0.02%');

        const percentage = await (
          await driver.findElement(`[data-testid="${testId}"]`)
        ).getText();
        assert.equal(percentage, '+0.05%');

        // check increase balance for native token
        const increaseValue = await (
          await driver.findElement(
            `[data-testid="token-increase-decrease-value"]`,
          )
        ).getText();
        assert.equal(increaseValue, '+$50.00 ');

        // check percentage increase balance for native token
        const percentageIncreaseDecrease = await (
          await driver.findElement(
            `[data-testid="token-increase-decrease-percentage"]`,
          )
        ).getText();

        assert.equal(percentageIncreaseDecrease, '(+0.02%)');
      },
    );
  });
});
