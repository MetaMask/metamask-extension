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

        // Switch back to Dapp
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // Button should show Connect text if dapp is not connected

        const getConnectStatus = await driver.waitForSelector({
          css: '#connectButton',
          text: 'Connect',
        });

        assert.ok(
          getConnectStatus,
          'Account is not connected to Dapp and button has text connect',
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
        ganacheOptions: defaultGanacheOptions,
      },
      async ({ driver, ganacheServer }) => {
        await logInWithBalanceValidation(driver, ganacheServer);
        await connectToDapp(driver);

        const account = await driver.findElement('#accounts');
        const accountAddress = await account.getText();

        // Dapp should contain single connected account address
        assert.strictEqual(
          accountAddress,
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
        );
        // disconnect dapp in fullscreen view
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Add two new accounts with custom label
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

        // Connect only second account and keep third account unconnected
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
        // Switch back to Dapp
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        // Find the span element that contains the account addresses
        const accounts = await driver.findElement('#accounts');
        const accountAddresses = await accounts.getText();

        // Dapp should contain both the connected account addresses
        assert.strictEqual(
          accountAddresses,
          '0x09781764c08de8ca82e156bbf156a3ca217c7950,0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
        );
      },
    );
  });

  // Skipped until issue where firefox connecting to dapp is resolved.
  // it('shows that the account is connected to the dapp', async function () {
  //   await withFixtures(
  //     {
  //       dapp: true,
  //       fixtures: new FixtureBuilder().build(),
  //       title: this.test.fullTitle(),
  //       ganacheOptions: defaultGanacheOptions,
  //     },
  //     async ({ driver, ganacheServer }) => {
  //       const ACCOUNT = '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1';
  //       const SHORTENED_ACCOUNT = shortenAddress(ACCOUNT);
  //       await logInWithBalanceValidation(driver, ganacheServer);
  //       await openDappConnectionsPage(driver);
  //       // Verify that there are no connected accounts
  //       await driver.assertElementNotPresent(
  //         '[data-testid="account-list-address"]',
  //       );

  //       await connectToDapp(driver);
  //       await openDappConnectionsPage(driver);

  //       const account = await driver.findElement(
  //         '[data-testid="account-list-address"]',
  //       );
  //       const accountAddress = await account.getText();

  //       // Dapp should contain single connected account address
  //       assert.strictEqual(accountAddress, SHORTENED_ACCOUNT);
  //     },
  //   );
  // });
});
