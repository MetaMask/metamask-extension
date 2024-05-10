const { strict: assert } = require('assert');
const {
  withFixtures,
  unlockWallet,
  WINDOW_TITLES,
  waitForAccountRendered,
  connectToDapp,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('Permissions Page', function () {
  it('should show connected site permissions when a single dapp is connected', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await waitForAccountRendered(driver);
        await connectToDapp(driver);

        // close test dapp window to avoid future confusion
        const windowHandles = await driver.getAllWindowHandles();
        await driver.closeWindowHandle(windowHandles[1]);
        // disconnect dapp in fullscreen view
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await driver.clickElement(
          '[data-testid ="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'All Permissions', tag: 'div' });
        await driver.clickElement({ text: 'Got it', tag: 'button' });
        const connectedDapp = await driver.isElementPresent({
          text: '127.0.0.1:8080',
          tag: 'p',
        });
        assert.ok(connectedDapp, 'Account connected to Dapp1');
      },
    );
  });

  it('should redirect users to connections page when users click on connected permission', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await waitForAccountRendered(driver);
        await connectToDapp(driver);

        // close test dapp window to avoid future confusion
        const windowHandles = await driver.getAllWindowHandles();
        await driver.closeWindowHandle(windowHandles[1]);
        // disconnect dapp in fullscreen view
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await driver.clickElement(
          '[data-testid ="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'All Permissions', tag: 'div' });
        await driver.clickElement({ text: 'Got it', tag: 'button' });
        await driver.clickElement({
          text: '127.0.0.1:8080',
          tag: 'p',
        });
        await driver.clickElement('[data-testid ="connections-page"]');
        const connectionsPage = await driver.isElementPresent({
          text: '127.0.0.1:8080',
          tag: 'span',
        });
        assert.ok(connectionsPage, 'Connections Page is defined');
      },
    );
  });
});
