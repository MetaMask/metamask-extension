import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import { Context } from 'mocha';
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

describe('Token Details', function () {
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
    await driver.clickElement(`[data-testid="import-token-button"]`);
    await driver.clickElement(`[data-testid="importTokens"]`);
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

  const openTokenDetails = async (driver: Driver) => {
    await driver.clickElement('[data-testid="account-overview__asset-tab"]');
    const [, , tkn] = await driver.findElements(
      '[data-testid="multichain-token-list-button"]',
    );
    await tkn.click();
  };

  const verifyToken = async (driver: Driver) => {
    // Verify token name
    const name = await (
      await driver.findElement('[data-testid="asset-name"]')
    ).getText();
    assert.equal(name, symbol);

    // Verify token address
    const address = await (
      await driver.findElement('[data-testid="address-copy-button-text"]')
    ).getText();
    assert.equal(
      address,
      `${tokenAddress.slice(0, 7)}...${tokenAddress.slice(37)}`,
    );
  };

  it('shows details for an ERC20 token without prices available', async function () {
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
        await openTokenDetails(driver);
        await verifyToken(driver);
      },
    );
  });

  it('shows details for an ERC20 token with prices available', async function () {
    const ethConversionInUsd = 10000;

    // Prices are in ETH
    const marketData = {
      price: 0.123,
      marketCap: 12,
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
              json: { [tokenAddress.toLowerCase()]: marketData },
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
        await openTokenDetails(driver);
        await verifyToken(driver);

        // Verify token price
        const price = await (
          await driver.findElement('[data-testid="asset-hovered-price"]')
        ).getText();
        assert.equal(
          price,
          formatCurrency(`${marketData.price * ethConversionInUsd}`, 'USD'),
        );

        // Verify token market data
        const marketCap = await (
          await driver.findElement('[data-testid="asset-market-cap"]')
        ).getText();
        assert.equal(
          marketCap,
          `${marketData.marketCap * ethConversionInUsd}.00`,
        );

        // Verify a chart was rendered
        await driver.waitForSelector('[data-testid="asset-price-chart"]');
      },
    );
  });
});
