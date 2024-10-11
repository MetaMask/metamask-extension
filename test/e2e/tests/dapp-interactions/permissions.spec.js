const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  withFixtures,
  openDapp,
  unlockWallet,
  WINDOW_TITLES,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('Permissions', function () {
  it('sets permissions and connect to Dapp', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver, ganacheServer }) => {
        const addresses = await ganacheServer.getAccounts();
        const publicAddress = addresses[0];
        await unlockWallet(driver);

        await openDapp(driver);
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        await driver.waitUntilXWindowHandles(3);
        const windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog,
          windowHandles,
        );
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        await driver.switchToWindow(extension);

        // shows connected sites
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({
          text: 'All Permissions',
          tag: 'div',
        });
        await driver.clickElementAndWaitToDisappear({
          text: 'Got it',
          tag: 'button',
        });
        await driver.waitForSelector({
          text: '127.0.0.1:8080',
          tag: 'p',
        });
        const domains = await driver.findClickableElements(
          '[data-testid="connection-list-item"]',
        );
        assert.equal(domains.length, 1);

        // can get accounts within the dapp
        await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);

        await driver.clickElement({
          text: 'eth_accounts',
          tag: 'button',
        });

        const getAccountsResult = await driver.waitForSelector({
          css: '#getAccountsResult',
          text: publicAddress,
        });
        assert.equal(
          (await getAccountsResult.getText()).toLowerCase(),
          publicAddress.toLowerCase(),
        );
      },
    );
  });
});
