import { strict as assert } from 'assert';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { login } from '../../page-objects/flows/login.flow';

async function clickAccountMenuHelper(driver: Driver): Promise<void> {
  await driver.clickElement('[data-testid="account-menu-icon"]');
}

async function fillSearchFieldHelper(
  driver: Driver,
  searchTerm: string,
): Promise<void> {
  await driver.fill('[data-testid="asset-list-search"]', searchTerm);
  await driver.delay(1000);
}

describe('Account overview', function () {
  it('opens the account menu from the global menu', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );

        await clickAccountMenuHelper(driver);

        await driver.delay(1500);

        await new Promise((resolve) => setTimeout(resolve, 500));
      },
    );
  });

  it('shows the token list on the overview', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        await driver.waitForSelector(
          '[data-testid="account-overview__asset-tab"]',
        );
        await driver.clickElement({ text: 'Tokens', tag: 'button' });
        await driver.delay(3000);

        const tokenRow = await driver.findElement(
          '.multichain-token-list-item',
        );
        assert.equal(await tokenRow.isDisplayed(), true);

        await fillSearchFieldHelper(driver, 'ETH');
      },
    );
  });

  it('opens the network picker from the overview', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        await driver.clickElement('[data-testid="network-display"]');
        await driver.waitForSelector('.multichain-network-list-menu');
        await driver.delay(2000);

        const networkItems = await driver.findElements(
          '.multichain-network-list-item',
        );
        assert.equal(networkItems.length > 0, true);

        await driver.fill(
          '[data-testid="network-redesign-modal-search-input"]',
          'Linea',
        );
        await driver.press(
          '[data-testid="network-redesign-modal-search-input"]',
          driver.Key.ENTER,
        );
      },
    );
  });
});
