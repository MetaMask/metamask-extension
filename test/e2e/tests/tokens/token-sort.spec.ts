import { strict as assert } from 'assert';
import { Context } from 'mocha';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import FixtureBuilder from '../../fixture-builder';
import {
  clickNestedButton,
  defaultGanacheOptions,
  regularDelayMs,
  unlockWallet,
  withFixtures,
} from '../../helpers';
import { Driver } from '../../webdriver/driver';

describe('Token List', function () {
  const chainId = CHAIN_IDS.MAINNET;
  const tokenAddress = '0x2EFA2Cb29C2341d8E5Ba7D3262C9e9d6f1Bf3711';
  const symbol = 'ABC';

  const fixtures = {
    fixtures: new FixtureBuilder({ inputChainId: chainId }).build(),
    ganacheOptions: {
      ...defaultGanacheOptions,
      chainId: parseInt(chainId, 16),
    },
  };

  const importToken = async (driver: Driver) => {
    await driver.clickElement({ text: 'Import', tag: 'button' });
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
    await driver.delay(2000);
    await driver.clickElement({ text: 'Next', tag: 'button' });
    await driver.clickElement(
      '[data-testid="import-tokens-modal-import-button"]',
    );
    await driver.findElement({ text: 'Token imported', tag: 'h6' });
  };

  it.only('should sort alphabetically and by decreasing balance', async function () {
    await withFixtures(
      {
        ...fixtures,
        title: (this as Context).test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        await importToken(driver);

        const tokenListBeforeSorting = await driver.findElements(
          '[data-testid="multichain-token-list-button"]',
        );
        const tokenSymbolsBeforeSorting = await Promise.all(
          tokenListBeforeSorting.map(async (tokenElement) => {
            return tokenElement.getText();
          }),
        );

        assert.ok(tokenSymbolsBeforeSorting[0].includes('Ethereum'));

        await await driver.clickElement(
          '[data-testid="sort-by-popover-toggle"]',
        );
        await await driver.clickElement('[data-testid="sortByAlphabetically"]');
        await await driver.clickElement(
          '[data-testid="sort-by-popover-toggle"]',
        );

        await driver.delay(regularDelayMs);
        const tokenListAfterSortingAlphabetically = await driver.findElements(
          '[data-testid="multichain-token-list-button"]',
        );
        const tokenListSymbolsAfterSortingAlphabetically = await Promise.all(
          tokenListAfterSortingAlphabetically.map(async (tokenElement) => {
            return tokenElement.getText();
          }),
        );

        assert.ok(
          tokenListSymbolsAfterSortingAlphabetically[0].includes('ABC'),
        );

        await await driver.clickElement(
          '[data-testid="sort-by-popover-toggle"]',
        );
        await await driver.clickElement(
          '[data-testid="sortByDecliningBalance"]',
        );
        await await driver.clickElement(
          '[data-testid="sort-by-popover-toggle"]',
        );

        await driver.delay(regularDelayMs);
        const tokenListBeforeSortingByDecliningBalance =
          await driver.findElements(
            '[data-testid="multichain-token-list-button"]',
          );

        const tokenListAfterSortingByDecliningBalance = await Promise.all(
          tokenListBeforeSortingByDecliningBalance.map(async (tokenElement) => {
            return tokenElement.getText();
          }),
        );
        assert.ok(
          tokenListAfterSortingByDecliningBalance[0].includes('Ethereum'),
        );
      },
    );
  });
});
