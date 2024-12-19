const { strict: assert } = require('assert');
const {
  withFixtures,
  WINDOW_TITLES,
  logInWithBalanceValidation,
  defaultGanacheOptions,
  openDapp,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('Connections page', function () {
  it('should render new connections flow', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        title: this.test.fullTitle(),
        ganacheOptions: defaultGanacheOptions,
      },
      async ({ driver, ganacheServer }) => {
        await logInWithBalanceValidation(driver, ganacheServer);
        await openDapp(driver);
        // Connect to dapp
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // should render new connections page
        const newConnectionPage = await driver.waitForSelector({
          tag: 'h2',
          text: 'Connect with MetaMask',
        });
        assert.ok(newConnectionPage, 'Connection Page is defined');
        await driver.clickElementAndWaitForWindowToClose({
          text: 'Connect',
          tag: 'button',
        });
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

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
        await driver.clickElement(
          '[data-testid ="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'All Permissions', tag: 'div' });
        await driver.clickElementAndWaitToDisappear({
          text: 'Got it',
          tag: 'button',
        });
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
      },
    );
  });
});
