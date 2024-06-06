import { Mockttp } from 'mockttp';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import { formatCurrency } from '../../../../ui/helpers/utils/confirm-tx.util';
import FixtureBuilder from '../../fixture-builder';
import {
  clickNestedButton,
  defaultGanacheOptions,
  unlockWallet,
  withFixtures,
} from '../../helpers';
import { Driver } from '../../webdriver/driver';

import { strict as assert } from 'assert';


describe('Token Details', function () {
  it('shows details for an ERC20 token', async function () {
    const chainId = CHAIN_IDS.MAINNET;
    const tokenAddress = '0x2efa2cb29c2341d8e5ba7d3262c9e9d6f1bf3711';
    const ethConversionInUsd = 10000;

    // Prices are in ETH
    const marketData = {
      price: 0.123,
      marketCap: 12,
    };

    await withFixtures(
      {
        fixtures: new FixtureBuilder({ inputChainId: chainId }).build(),
        ganacheOptions: {
          ...defaultGanacheOptions,
          chainId: parseInt(chainId, 16),
        },
        // @ts-ignore
        title: this.test?.fullTitle(),
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
              json: { [tokenAddress]: marketData },
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

        // Import the token
        await driver.clickElement({ text: 'Import tokens', tag: 'button' });
        await clickNestedButton(driver, 'Custom token');
        await driver.fill(
          '[data-testid="import-tokens-modal-custom-address"]',
          tokenAddress,
        );
        await driver.waitForSelector('p.mm-box--color-error-default');
        await driver.fill(
          '[data-testid="import-tokens-modal-custom-symbol"]',
          'foo',
        );
        await driver.clickElement({ text: 'Next', tag: 'button' });
        await driver.clickElement(
          '[data-testid="import-tokens-modal-import-button"]',
        );

        // Go to details page
        await driver.clickElement('[data-testid="home__asset-tab"]');
        const [, tkn] = await driver.findElements(
          '[data-testid="multichain-token-list-button"]',
        );
        await tkn.click();

        const price = await (
          await driver.findElement('[data-testid="asset-hovered-price"]')
        ).getText();

        assert.equal(
          price,
          formatCurrency(`${marketData.price * ethConversionInUsd}`, 'USD'),
        );

        const marketCap = await (
          await driver.findElement('[data-testid="asset-market-cap"]')
        ).getText();

        assert.equal(marketCap, `${marketData.marketCap * ethConversionInUsd}.00`)
      },
    );
  });
});
