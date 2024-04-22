const { strict: assert } = require('assert');
const {
  withFixtures,
  unlockWallet,
  WINDOW_TITLES,
  waitForAccountRendered,
  connectToDapp,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

const anotherAccountLabel = '2nd custom name';

describe('Connections Page', function () {
  it('should disconnect when click on Disconnect button in connections Page', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate();
        await unlockWallet(driver);
        if (!process.env.MULTICHAIN) {
          return;
        }
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
        await driver.clickElement(
          '[data-testid ="account-list-item-menu-button"]',
        );
        await driver.clickElement({ text: 'Disconnect', tag: 'button' });
        await driver.clickElement('[data-testid ="disconnect-all"]');
        await driver.clickElement('button[aria-label="Back"]');
        await driver.clickElement('button[aria-label="Back"]');
        // validate dapp is not connected
        await driver.clickElement(
          '[data-testid ="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'All Permissions', tag: 'div' });
        const noAccountConnected = await driver.isElementPresent({
          text: 'Nothing to see here',
          tag: 'p',
        });
        assert.ok(
          noAccountConnected,
          'Account disconected from connections page',
        );
      },
    );
  });

  it('should connect more accounts when already connected to a dapp', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate();
        await unlockWallet(driver);
        if (!process.env.MULTICHAIN) {
          return;
        }
        await waitForAccountRendered(driver);
        await connectToDapp(driver);

        // close test dapp window to avoid future confusion
        const windowHandles = await driver.getAllWindowHandles();
        await driver.closeWindowHandle(windowHandles[1]);
        // disconnect dapp in fullscreen view
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Add new account with custom label
        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement(
          '[data-testid="multichain-account-menu-popover-action-button"]',
        );
        await driver.clickElement(
          '[data-testid="multichain-account-menu-popover-add-account"]',
        );
        await driver.fill('[placeholder="Account 2"]', anotherAccountLabel);
        await driver.clickElement({ text: 'Create', tag: 'button' });
        await waitForAccountRendered(driver);
        await driver.clickElement(
          '[data-testid ="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'All Permissions', tag: 'div' });
        await driver.clickElement({ text: 'Got it', tag: 'button' });
        await driver.clickElement({
          text: '127.0.0.1:8080',
          tag: 'p',
        });

        await driver.clickElement({
          text: 'Connect more accounts',
          tag: 'button',
        });
        await driver.clickElement({
          text: '2nd custom name',
          tag: 'button',
        });
        await driver.clickElement(
          '[data-testid ="connect-more-accounts-button"]',
        );
        const newAccountConnected = await driver.isElementPresent({
          text: '2nd custom name',
          tag: 'button',
        });

        assert.ok(newAccountConnected, 'Connected More Account Successfully');
      },
    );
  });
});
