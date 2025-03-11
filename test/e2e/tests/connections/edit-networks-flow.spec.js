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

describe('Edit Networks Flow', function () {
  it('should be able to edit networks', async function () {
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
        await driver.clickElement('[data-testid="network-display"]');
        await driver.clickElement('.mm-modal-content__dialog .toggle-button');
        await driver.clickElement(
          '.mm-modal-content__dialog button[aria-label="Close"]',
        );
        await locateAccountBalanceDOM(driver);
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
        const editButtons = await driver.findElements('[data-testid="edit"]');

        // Ensure there are edit buttons
        assert.ok(editButtons.length > 0, 'Edit buttons are available');

        // Click the first (0th) edit button
        await editButtons[1].click();

        // Disconnect Mainnet
        await driver.clickElement({
          text: 'Ethereum Mainnet',
          tag: 'p',
        });

        await driver.clickElement('[data-testid="connect-more-chains-button"]');
        const updatedNetworkInfo = await driver.isElementPresent({
          text: '2 networks connected',
          tag: 'span',
        });
        assert.ok(updatedNetworkInfo, 'Networks List Updated');
      },
    );
  });
});
