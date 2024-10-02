const { strict: assert } = require('assert');
const {
  withFixtures,
  WINDOW_TITLES,
  connectToDapp,
  logInWithBalanceValidation,
  locateAccountBalanceDOM,
  defaultGanacheOptions,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

const accountLabel2 = '2nd custom name';
const accountLabel3 = '3rd custom name';
describe('Connections page', function () {
  it('should disconnect when click on Disconnect button in connections page', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        title: this.test.fullTitle(),
        ganacheOptions: defaultGanacheOptions,
      },
      async ({ driver, ganacheServer }) => {
        await logInWithBalanceValidation(driver, ganacheServer);
        await connectToDapp(driver);

        // It should render connected status for button if dapp is connected
        const getConnectedStatus = await driver.waitForSelector({
          css: '#connectButton',
          text: 'Connected',
        });
        assert.ok(getConnectedStatus, 'Account is connected to Dapp');

        // Switch to extension Tab
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement(
          '[data-testid="multichain-account-menu-popover-action-button"]',
        );
        await driver.clickElement(
          '[data-testid="multichain-account-menu-popover-add-account"]',
        );
        await driver.fill('[placeholder="Account 2"]', accountLabel2);
        await driver.clickElement({ text: 'Add account', tag: 'button' });
        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement(
          '[data-testid="multichain-account-menu-popover-action-button"]',
        );
        await driver.clickElement(
          '[data-testid="multichain-account-menu-popover-add-account"]',
        );
        await driver.fill('[placeholder="Account 3"]', accountLabel3);
        await driver.clickElement({ text: 'Add account', tag: 'button' });
        await locateAccountBalanceDOM(driver);
        await driver.clickElement(
          '[data-testid ="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'All Permissions', tag: 'div' });
        await driver.clickElement({
          text: '127.0.0.1:8080',
          tag: 'p',
        });
        const connectionsPageAccountInfo = await driver.isElementPresent({
          text: 'See your accounts and suggest transactions',
          tag: 'p',
        });
        assert.ok(connectionsPageAccountInfo, 'Connections Page is defined');
        const connectionsPageNetworkInfo = await driver.isElementPresent({
          text: 'Use your enabled networks',
          tag: 'p',
        });
        assert.ok(connectionsPageNetworkInfo, 'Connections Page is defined');
        await driver.clickElement('[data-testid="site-cell-edit-button"]');
        await driver.clickElement({
          text: 'Account 2',
          tag: 'button',
        });
        await driver.clickElement(
          '[data-testid="connect-more-accounts-button"]',
        );
        assert.ok(
          connectionsPageNetworkInfo,
          'Connections Page Accounts is updated',
        );
      },
    );
  });
});
