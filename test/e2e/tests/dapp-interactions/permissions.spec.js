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
          text: 'Next',
          tag: 'button',
        });
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        await driver.switchToWindow(extension);

        // shows connected sites
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement('.menu-item:nth-of-type(3)');

        await driver.findElement({
          text: 'Connected sites',
          tag: 'h2',
        });
        await driver.waitForSelector({
          css: '.connected-sites-list__subject-name',
          text: '127.0.0.1:8080',
        });
        const domains = await driver.findClickableElements(
          '.connected-sites-list__subject-name',
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
