const { strict: assert } = require('assert');
const {
  withFixtures,
  openDapp,
  generateGanacheOptions,
  WALLET_PASSWORD,
  WINDOW_TITLES,
  DEFAULT_GANACHE_OPTIONS,
  generateETHBalance,
  roundToXDecimalPlaces,
  generateRandNumBetween,
  switchToWindow,
  sleepSeconds,
  terminateServiceWorker,
  unlockWallet,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('MV3 - Restart service worker multiple times', function () {
  it('Simple simple send flow within full screen view should still be usable', async function () {
    const initialBalance = roundToXDecimalPlaces(
      generateRandNumBetween(10, 100),
      4,
    );

    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: generateGanacheOptions({
          accounts: [
            {
              secretKey: DEFAULT_GANACHE_OPTIONS.accounts[0].secretKey,
              balance: generateETHBalance(initialBalance),
            },
          ],
        }),
        title: this.test.title,
        driverOptions: { openDevToolsForTabs: true },
      },
      async ({ driver }) => {
        await driver.navigate();

        await unlockWallet(driver, WALLET_PASSWORD);

        await assertETHBalance(driver, initialBalance);

        // first send ETH and then terminate SW
        const RECIPIENT_ADDRESS = '0x985c30949c92df7a0bd42e0f3e3d539ece98db24';
        const amountFirstTx = roundToXDecimalPlaces(
          generateRandNumBetween(0.5, 2),
          4,
        );

        const gasFeesFirstTx = await simpleSendETH(
          driver,
          amountFirstTx,
          RECIPIENT_ADDRESS,
        );
        const totalAfterFirstTx = roundToXDecimalPlaces(
          initialBalance - amountFirstTx - gasFeesFirstTx,
          4,
        );

        await terminateServiceWorker(driver);

        await assertETHBalance(driver, totalAfterFirstTx);

        // first send ETH #2 and then terminate SW
        const amountSecondTx = roundToXDecimalPlaces(
          generateRandNumBetween(0.5, 2),
          4,
        );
        const gasFeesSecondTx = await simpleSendETH(
          driver,
          amountSecondTx,
          RECIPIENT_ADDRESS,
        );
        const totalAfterSecondTx = roundToXDecimalPlaces(
          initialBalance -
            amountFirstTx -
            gasFeesFirstTx -
            amountSecondTx -
            gasFeesSecondTx,
          4,
        );

        await terminateServiceWorker(driver);

        await assertETHBalance(driver, totalAfterSecondTx);

        // first terminate SW and then send ETH
        const amountThirdTx = roundToXDecimalPlaces(
          generateRandNumBetween(0.5, 2),
          4,
        );
        const gasFeesThirdTx = await simpleSendETH(
          driver,
          amountThirdTx,
          RECIPIENT_ADDRESS,
        );
        const totalAfterThirdTx = roundToXDecimalPlaces(
          initialBalance -
            amountFirstTx -
            gasFeesFirstTx -
            amountSecondTx -
            gasFeesSecondTx -
            amountThirdTx -
            gasFeesThirdTx,
          4,
        );

        await assertETHBalance(driver, totalAfterThirdTx);
      },
    );

    async function simpleSendETH(driver, value, recipient) {
      await switchToWindow(driver, WINDOW_TITLES.ExtensionInFullScreenView);

      await driver.clickElement('[data-testid="eth-overview-send"]');
      await driver.fill('[data-testid="ens-input"]', recipient);
      const formattedValue = `${value}`.replace('.', ',');
      await driver.fill('.unit-input__input', formattedValue);

      await driver.clickElement('[data-testid="page-container-footer-next"]');

      const gasFeesEl = await driver.findElement(
        '.transaction-detail-item__detail-values .currency-display-component',
      );
      const gasFees = await gasFeesEl.getText();

      await driver.clickElement('[data-testid="page-container-footer-next"]');
      await driver.clickElement('[data-testid="home__activity-tab"]');
      await driver.findElement('.transaction-list-item');
      // reset view to assets tab
      await driver.clickElement('[data-testid="home__asset-tab"]');

      return gasFees;
    }

    async function assertETHBalance(driver, expectedBalance) {
      await switchToWindow(driver, WINDOW_TITLES.ExtensionInFullScreenView);

      const isETHBalanceOverviewPresentAndVisible =
        await driver.isElementPresentAndVisible({
          css: '[data-testid="eth-overview__primary-currency"]',
          text: `${expectedBalance} ETH`,
        });

      assert.equal(
        isETHBalanceOverviewPresentAndVisible,
        true,
        `Balance DOM element should be visible and match ${expectedBalance} ETH.`,
      );
    }
  });

  it('Should continue to support add network dApp interactions after service worker re-starts multiple times', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: generateGanacheOptions({
          concurrent: { port: 8546, chainId: 1338 },
        }),
        title: this.test.title,
        driverOptions: { openDevToolsForTabs: true },
      },
      async ({ driver }) => {
        await driver.navigate();

        await unlockWallet(driver, WALLET_PASSWORD);

        await openDapp(driver);

        // Click add Ethereum chain
        await switchToWindow(driver, WINDOW_TITLES.TestDApp);
        await driver.clickElement('#addEthereumChain');
        await driver.waitUntilXWindowHandles(2);

        // Notification pop up opens
        await switchToWindow(driver, WINDOW_TITLES.Notification);
        let notification = await driver.isElementPresent({
          text: 'Allow this site to add a network?',
          tag: 'h3',
        });
        assert.ok(notification, 'Dapp action does not appear in Metamask');

        // Cancel Notification
        await driver.clickElement({ text: 'Cancel', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);

        // Terminate Service Worker
        await switchToWindow(driver, WINDOW_TITLES.TestDApp);
        await terminateServiceWorker(driver);

        // Click add Ethereum chain #2
        await switchToWindow(driver, WINDOW_TITLES.TestDApp);
        await driver.clickElement('#addEthereumChain');
        await driver.waitUntilXWindowHandles(2);

        // Notification pop up opens
        await switchToWindow(driver, WINDOW_TITLES.Notification);
        notification = await driver.isElementPresent({
          text: 'Allow this site to add a network?',
          tag: 'h3',
        });
        assert.ok(notification, 'Dapp action does not appear in Metamask');

        // Cancel Notification
        await driver.clickElement({ text: 'Cancel', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);

        // Terminate Service Worker
        await switchToWindow(driver, WINDOW_TITLES.TestDApp);
        await terminateServiceWorker(driver);

        // Click add Ethereum chain #3
        await switchToWindow(driver, WINDOW_TITLES.TestDApp);
        await driver.clickElement('#addEthereumChain');
        await driver.waitUntilXWindowHandles(2);

        // Notification pop up opens
        await switchToWindow(driver, WINDOW_TITLES.Notification);
        notification = await driver.isElementPresent({
          text: 'Allow this site to add a network?',
          tag: 'h3',
        });
        assert.ok(notification, 'Dapp action does not appear in Metamask');

        // Accept Notification
        await driver.clickElement({ text: 'Approve', tag: 'button' });
        await driver.clickElement({ text: 'Switch network', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
      },
    );
  });

  it('Should continue to support send ETH dApp interactions after service worker re-starts multiple times', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: generateGanacheOptions({
          concurrent: { port: 8546, chainId: 1338 },
        }),
        title: this.test.title,
        driverOptions: { openDevToolsForTabs: true },
      },
      async ({ driver }) => {
        await driver.navigate();

        await unlockWallet(driver, WALLET_PASSWORD);

        await openDapp(driver);

        await clickSendButton(driver);
        await driver.waitUntilXWindowHandles(2);

        await switchToWindow(driver, WINDOW_TITLES.TestDApp);
        await terminateServiceWorker(driver);
        await driver.waitUntilXWindowHandles(2);

        await clickSendButton(driver);
        await driver.waitUntilXWindowHandles(2);

        await switchToWindow(driver, WINDOW_TITLES.TestDApp);
        await terminateServiceWorker(driver);

        await clickSendButton(driver);
        await driver.waitUntilXWindowHandles(2);

        await assertNumberOfTransactionsInPopUp(driver, 3);

        await confirmETHSendNotification(driver, 1);

        await assertNumberOfTransactionsInPopUp(driver, 2);

        await confirmETHSendNotification(driver, 1);

        await confirmETHSendNotification(driver, 1);
      },
    );

    async function clickSendButton(driver) {
      // Click send button
      await switchToWindow(driver, WINDOW_TITLES.TestDApp);

      await driver.waitForSelector({
        css: '#sendButton',
        text: 'Send',
      });
      await driver.clickElement('#sendButton');
    }

    async function confirmETHSendNotification(driver, amount) {
      await switchToWindow(driver, WINDOW_TITLES.Notification);

      await driver.clickElement({
        text: 'Edit',
        tag: 'span',
      });

      await driver.fill('[data-testid="currency-input"]', amount);

      await driver.clickElement({
        text: 'Next',
        tag: 'button',
      });

      await driver.clickElement({
        text: 'Confirm',
        tag: 'button',
      });
    }

    async function assertNumberOfTransactionsInPopUp(driver, number) {
      await switchToWindow(driver, WINDOW_TITLES.Notification);
      const navEl = await driver.findElement(
        '.confirm-page-container-navigation__navtext',
      );

      const notificationProgress = await navEl.getText();

      assert.ok(notificationProgress, `1 of ${number}`);
    }
  });

  it('Should lock wallet when a browser session ends (after turning off the extension)', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: generateGanacheOptions({
          concurrent: { port: 8546, chainId: 1338 },
        }),
        title: this.test.title,
      },
      async ({ driver }) => {
        const { extensionUrl } = driver;
        const extensionId = extensionUrl.split('//')[1];

        await driver.navigate();

        await unlockWallet(driver, WALLET_PASSWORD);

        await reloadExtension(driver, extensionId);

        // ensure extension finishes reloading before reopening full screen extension
        await sleepSeconds(0.1);

        await driver.openNewPage(`${extensionUrl}/home.html`);

        const passwordField = await driver.isElementPresent('#password');
        assert.ok(
          passwordField,
          'Password screen is not visible. Wallet should have been locked.',
        );
      },
    );

    async function reloadExtension(driver, extensionId) {
      await switchToWindow(driver, WINDOW_TITLES.ExtensionInFullScreenView);

      await driver.openNewPage('chrome://extensions/');

      // extensions-manager
      const extensionsManager = await driver.findElement('extensions-manager');

      // shadowRoot
      const extensionsManagerShadowRoot = await driver.executeScript(
        'return arguments[0][0].shadowRoot',
        extensionsManager,
      );

      // cr-view-manager
      const viewManager = await extensionsManagerShadowRoot.findElement({
        css: '#viewManager',
      });

      // extensions-item-list
      const itemList = await viewManager.findElement({
        css: '#items-list',
      });

      // shadowRoot
      const itemListShadowRoot = await driver.executeScript(
        'return arguments[0][0].shadowRoot',
        itemList,
      );

      // extension-item
      const extensionItem = await await itemListShadowRoot.findElement({
        css: `#${extensionId}`,
      });

      // shadowRoot
      const extensionItemShadowRoot = await driver.executeScript(
        'return arguments[0][0].shadowRoot',
        extensionItem,
      );

      // cr-icon-button
      const devReloadButton = await extensionItemShadowRoot.findElement({
        css: '#dev-reload-button',
      });

      // shadowRoot
      const devReloadButtonShadowRoot = await driver.executeScript(
        'return arguments[0][0].shadowRoot',
        devReloadButton,
      );

      // cr-icon-button
      const reloadBtn = await devReloadButtonShadowRoot.findElement({
        css: '#maskedImage',
      });

      await reloadBtn.click();
    }
  });
});
