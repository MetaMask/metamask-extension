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
describe('Edit Accounts Flow', function () {
  it('should be able to edit accounts', async function () {
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
        const editButtons = await driver.findElements('[data-testid="edit"]');

        // Ensure there are edit buttons
        assert.ok(editButtons.length > 0, 'Edit buttons are available');

        // Click the first (0th) edit button
        await editButtons[0].click();

        await driver.clickElement({
          text: '2nd custom name',
          tag: 'button',
        });
        await driver.clickElement({
          text: '3rd custom name',
          tag: 'button',
        });
        await driver.clickElement(
          '[data-testid="connect-more-accounts-button"]',
        );
        const updatedAccountInfo = await driver.isElementPresent({
          text: '3 accounts connected',
          tag: 'span',
        });
        assert.ok(updatedAccountInfo, 'Accounts List Updated');
      },
    );
  });
});
