const { strict: assert } = require('assert');
const {
  convertToHexValue,
  withFixtures,
  connectToDApp,
  DAPP_URL,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Permissions', function () {
  it('sets permissions and connect to Dapp', async function () {
    const ganacheOptions = {
      accounts: [
        {
          secretKey:
            '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
          balance: convertToHexValue(25000000000000000000),
        },
      ],
    };
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver, ganacheServer }) => {
        const addresses = await ganacheServer.getAccounts();
        const publicAddress = addresses[0];
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await connectToDApp(driver);
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        await driver.waitUntilXWindowHandles(3);
        const windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
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
        await driver.clickElement(
          '[data-testid="account-options-menu__connected-sites"]',
        );

        await driver.findElement({
          text: 'Connected sites',
          tag: 'h2',
        });
        await driver.waitForSelector({
          css: '.connected-sites-list__subject-name',
          text: DAPP_URL,
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
