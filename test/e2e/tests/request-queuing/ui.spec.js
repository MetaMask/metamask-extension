const { strict: assert } = require('assert');
const { Browser, until } = require('selenium-webdriver');
const {
  BUILT_IN_INFURA_NETWORKS,
} = require('../../../../shared/constants/network');
const FixtureBuilder = require('../../fixture-builder');
const {
  withFixtures,
  openDapp,
  unlockWallet,
  DAPP_URL,
  DAPP_ONE_URL,
  regularDelayMs,
  WINDOW_TITLES,
  defaultGanacheOptions,
  tempToggleSettingRedesignedConfirmations,
  veryLargeDelayMs,
  DAPP_TWO_URL,
} = require('../../helpers');
const { PAGES } = require('../../webdriver/driver');

// Window handle adjustments will need to be made for Non-MV3 Firefox
// due to OffscreenDocument.  Additionally Firefox continually bombs
// with a "NoSuchWindowError: Browsing context has been discarded" whenever
// we try to open a third dapp, so this test run in Firefox will
// validate two dapps instead of 3
const IS_FIREFOX = process.env.SELENIUM_BROWSER === Browser.FIREFOX;

async function openDappAndSwitchChain(driver, dappUrl, chainId) {
  // Open the dapp
  await openDapp(driver, undefined, dappUrl);

  // Connect to the dapp
  await driver.findClickableElement({ text: 'Connect', tag: 'button' });
  await driver.clickElement('#connectButton');
  await driver.delay(regularDelayMs);

  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  await driver.clickElement({
    text: 'Next',
    tag: 'button',
    css: '[data-testid="page-container-footer-next"]',
  });
  await driver.clickElementAndWaitForWindowToClose({
    text: 'Confirm',
    tag: 'button',
    css: '[data-testid="page-container-footer-next"]',
  });

  // Switch back to the dapp
  await driver.switchToWindowWithUrl(dappUrl);

  // Switch chains if necessary
  if (chainId) {
    await driver.delay(veryLargeDelayMs);
    const switchChainRequest = JSON.stringify({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    });

    await driver.executeScript(
      `window.ethereum.request(${switchChainRequest})`,
    );

    await driver.delay(veryLargeDelayMs);
    await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

    await driver.findClickableElement(
      '[data-testid="confirmation-submit-button"]',
    );
    await driver.clickElementAndWaitForWindowToClose(
      '[data-testid="confirmation-submit-button"]',
    );

    // Switch back to the dapp
    await driver.switchToWindowWithUrl(dappUrl);
  }
}

async function selectDappClickSend(driver, dappUrl) {
  await driver.switchToWindowWithUrl(dappUrl);
  await driver.clickElement('#sendButton');
}

async function selectDappClickPersonalSign(driver, dappUrl) {
  await driver.switchToWindowWithUrl(dappUrl);
  await driver.clickElement('#personalSign');
}

async function switchToDialogPopoverValidateDetails(driver, expectedDetails) {
  // Switches to the MetaMask Dialog window for confirmation
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  await driver.findElement({
    css: '[data-testid="network-display"], [data-testid="signature-request-network-display"]',
    text: expectedDetails.networkText,
  });

  await driver.findElement({
    css: '.confirm-page-container-summary__origin bdi, .request-signature__origin .chip__label',
    text: expectedDetails.originText,
  });

  // Get state details
  const notificationWindowState = await driver.executeScript(() =>
    window.stateHooks?.getCleanAppState?.(),
  );

  const {
    metamask: { selectedNetworkClientId, networkConfigurations },
  } = notificationWindowState;

  const { chainId } =
    BUILT_IN_INFURA_NETWORKS[selectedNetworkClientId] ??
    networkConfigurations[selectedNetworkClientId];

  assert.equal(chainId, expectedDetails.chainId);
}

async function rejectTransaction(driver) {
  await driver.clickElementAndWaitForWindowToClose({
    tag: 'button',
    text: 'Reject',
  });
}

async function confirmTransaction(driver) {
  await driver.clickElement({ tag: 'button', text: 'Confirm' });
}

async function switchToNetworkByName(driver, networkName) {
  await driver.clickElement('.mm-picker-network');
  await driver.clickElement(`[data-testid="${networkName}"]`);
}

async function openPopupWithActiveTabOrigin(driver, origin) {
  await driver.openNewPage(
    `${driver.extensionUrl}/${PAGES.POPUP}.html?activeTabOrigin=${origin}`,
  );
}

async function validateBalanceAndActivity(
  driver,
  expectedBalance,
  expectedActivityEntries = 1,
) {
  // Ensure the balance changed if the the transaction was confirmed
  await driver.waitForSelector({
    css: '[data-testid="eth-overview__primary-currency"] .currency-display-component__text',
    text: expectedBalance,
  });

  // Ensure there's an activity entry of "Send" and "Confirmed"
  if (expectedActivityEntries) {
    await driver.clickElement('[data-testid="account-overview__activity-tab"]');
    assert.equal(
      (
        await driver.findElements({
          css: '[data-testid="activity-list-item-action"]',
          text: 'Send',
        })
      ).length,
      expectedActivityEntries,
    );
    assert.equal(
      (await driver.findElements('.transaction-status-label--confirmed'))
        .length,
      expectedActivityEntries,
    );
  }
}

describe('Request-queue UI changes', function () {
  it('should show network specific to domain @no-mmi', async function () {
    const port = 8546;
    const chainId = 1338; // 0x53a
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleGanache()
          .withPreferencesControllerUseRequestQueueEnabled()
          .withSelectedNetworkControllerPerDomain()
          .build(),
        ganacheOptions: {
          ...defaultGanacheOptions,
          concurrent: [
            {
              port,
              chainId,
              ganacheOptions2: defaultGanacheOptions,
            },
          ],
        },
        dappOptions: { numberOfDapps: 2 },
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // Navigate to extension home screen
        await driver.navigate(PAGES.HOME);

        // Open the first dapp
        await openDappAndSwitchChain(driver, DAPP_URL);

        // Open the second dapp and switch chains
        await openDappAndSwitchChain(driver, DAPP_ONE_URL, '0x53a');

        // Go to wallet fullscreen, ensure that the global network changed to Ethereum Mainnet
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await driver.findElement({
          css: '[data-testid="network-display"]',
          text: 'Localhost 8546',
        });

        // Go to the first dapp, ensure it uses localhost
        await selectDappClickSend(driver, DAPP_URL);
        await switchToDialogPopoverValidateDetails(driver, {
          chainId: '0x539',
          networkText: 'Localhost 8545',
          originText: DAPP_URL,
        });
        await rejectTransaction(driver);

        // Go to the second dapp, ensure it uses Ethereum Mainnet
        await selectDappClickSend(driver, DAPP_ONE_URL);
        await switchToDialogPopoverValidateDetails(driver, {
          chainId: '0x53a',
          networkText: 'Localhost 8546',
          originText: DAPP_ONE_URL,
        });
        await rejectTransaction(driver);
      },
    );
  });

  it('handles three confirmations on three confirmations concurrently @no-mmi', async function () {
    const port = 8546;
    const chainId = 1338; // 0x53a
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerTripleGanache()
          .withPreferencesControllerUseRequestQueueEnabled()
          .withSelectedNetworkControllerPerDomain()
          .build(),
        ganacheOptions: {
          ...defaultGanacheOptions,
          concurrent: [
            // Ganache for network 1
            {
              port,
              chainId,
              ganacheOptions2: defaultGanacheOptions,
            },
            // Ganache for network 3
            {
              port: 7777,
              chainId: 1000,
              ganacheOptions2: defaultGanacheOptions,
            },
          ],
        },
        dappOptions: { numberOfDapps: 3 },
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // Navigate to extension home screen
        await driver.navigate(PAGES.HOME);

        // Open the first dapp
        await openDappAndSwitchChain(driver, DAPP_URL);

        // Open the second dapp and switch chains
        await openDappAndSwitchChain(driver, DAPP_ONE_URL, '0x53a');

        if (!IS_FIREFOX) {
          // Open the third dapp and switch chains
          await openDappAndSwitchChain(driver, DAPP_TWO_URL, '0x3e8');
        }

        // Trigger a send confirmation on the first dapp, do not confirm or reject
        await selectDappClickSend(driver, DAPP_URL);

        // Trigger a send confirmation on the second dapp, do not confirm or reject
        await selectDappClickSend(driver, DAPP_ONE_URL);

        if (!IS_FIREFOX) {
          // Trigger a send confirmation on the third dapp, do not confirm or reject
          await selectDappClickSend(driver, DAPP_TWO_URL);
        }

        // Switch to the Notification window, ensure first transaction still showing
        await switchToDialogPopoverValidateDetails(driver, {
          chainId: '0x539',
          networkText: 'Localhost 8545',
          originText: DAPP_URL,
        });

        // Confirm transaction, wait for first confirmation window to close, second to display
        await confirmTransaction(driver);
        await driver.delay(veryLargeDelayMs);

        // Switch to the new Notification window, ensure second transaction showing
        await switchToDialogPopoverValidateDetails(driver, {
          chainId: '0x53a',
          networkText: 'Localhost 8546',
          originText: DAPP_ONE_URL,
        });

        // Reject this transaction, wait for second confirmation window to close, third to display
        await rejectTransaction(driver);
        await driver.delay(veryLargeDelayMs);

        if (!IS_FIREFOX) {
          // Switch to the new Notification window, ensure third transaction showing
          await switchToDialogPopoverValidateDetails(driver, {
            chainId: '0x3e8',
            networkText: 'Localhost 7777',
            originText: DAPP_TWO_URL,
          });

          // Confirm transaction
          await confirmTransaction(driver);
        }

        // With first and last confirmations confirmed, and second rejected,
        // Ensure only first and last network balances were affected
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Wait for transaction to be completed on final confirmation
        await driver.delay(veryLargeDelayMs);

        if (!IS_FIREFOX) {
          // Start on the last joined network, whose send transaction was just confirmed
          await validateBalanceAndActivity(driver, '24.9998');
        }

        // Switch to second network, ensure full balance
        await switchToNetworkByName(driver, 'Localhost 8546');
        await validateBalanceAndActivity(driver, '25', 0);

        // Turn on test networks in Networks menu so Localhost 8545 is available
        await driver.clickElement('[data-testid="network-display"]');
        await driver.clickElement('.mm-modal-content__dialog .toggle-button');
        await driver.clickElement(
          '.mm-modal-content__dialog button[aria-label="Close"]',
        );

        // Switch to first network, whose send transaction was just confirmed
        await switchToNetworkByName(driver, 'Localhost 8545');
        await validateBalanceAndActivity(driver, '24.9998');
      },
    );
  });

  it('should gracefully handle deleted network @no-mmi', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleGanache()
          .withPreferencesControllerUseRequestQueueEnabled()
          .withSelectedNetworkControllerPerDomain()
          .build(),
        ganacheOptions: {
          ...defaultGanacheOptions,
          concurrent: [
            {
              port,
              chainId,
              ganacheOptions2: defaultGanacheOptions,
            },
          ],
        },
        dappOptions: { numberOfDapps: 2 },
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // Navigate to extension home screen
        await driver.navigate(PAGES.HOME);

        // Open the first dapp
        await openDappAndSwitchChain(driver, DAPP_URL);

        // Open the second dapp and switch chains
        await openDappAndSwitchChain(driver, DAPP_ONE_URL, '0x1');

        // Go to wallet fullscreen, ensure that the global network changed to Ethereum Mainnet
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await driver.findElement({
          css: '[data-testid="network-display"]',
          text: 'Ethereum Mainnet',
        });

        // Go to Settings, delete the first dapp's network
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement('[data-testid="global-menu-settings"]');
        await driver.clickElement({
          css: '.tab-bar__tab__content__title',
          text: 'Networks',
        });
        await driver.clickElement({
          css: '.networks-tab__networks-list-name',
          text: 'Localhost 8545',
        });
        await driver.clickElement({ css: '.btn-danger', text: 'Delete' });
        await driver.clickElement({
          css: '.modal-container__footer-button',
          text: 'Delete',
        });

        // Go back to first dapp, try an action, ensure deleted network doesn't block UI
        // The current globally selected network, Ethereum Mainnet, should be used
        await selectDappClickSend(driver, DAPP_URL);
        await driver.delay(veryLargeDelayMs);
        await switchToDialogPopoverValidateDetails(driver, {
          chainId: '0x1',
          networkText: 'Ethereum Mainnet',
          originText: DAPP_URL,
        });
      },
    );
  });

  it('should signal from UI to dapp the network change @no-mmi', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPreferencesControllerUseRequestQueueEnabled()
          .withSelectedNetworkControllerPerDomain()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        driverOptions: { constrainWindowSize: true },
      },
      async ({ driver }) => {
        // Navigate to extension home screen
        await unlockWallet(driver);

        // Open the first dapp which starts on chain '0x539
        await openDappAndSwitchChain(driver, DAPP_URL);

        // Ensure the dapp starts on the correct network
        await driver.wait(
          until.elementTextContains(
            await driver.findElement('#chainId'),
            '0x539',
          ),
        );

        // Open the popup with shimmed activeTabOrigin
        await openPopupWithActiveTabOrigin(driver, DAPP_URL);

        // Switch to mainnet
        await switchToNetworkByName(driver, 'Ethereum Mainnet');

        // Switch back to the Dapp tab
        await driver.switchToWindowWithUrl(DAPP_URL);

        // Check to make sure the dapp network changed
        await driver.wait(
          until.elementTextContains(
            await driver.findElement('#chainId'),
            '0x1',
          ),
        );
      },
    );
  });

  it('should autoswitch networks to the last used network for domain', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleGanache()
          .withPreferencesControllerUseRequestQueueEnabled()
          .withSelectedNetworkControllerPerDomain()
          .build(),
        ganacheOptions: {
          ...defaultGanacheOptions,
          concurrent: [
            {
              port,
              chainId,
              ganacheOptions2: defaultGanacheOptions,
            },
          ],
        },
        dappOptions: { numberOfDapps: 2 },
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        // Open fullscreen
        await unlockWallet(driver);

        // Open the first dapp which starts on chain '0x539
        await openDappAndSwitchChain(driver, DAPP_URL);

        // Open tab 2, switch to Ethereum Mainnet
        await openDappAndSwitchChain(driver, DAPP_ONE_URL, '0x1');

        // Open the popup with shimmed activeTabOrigin
        await openPopupWithActiveTabOrigin(driver, DAPP_URL);

        // Ensure network was reset to original
        await driver.findElement({
          css: '.multichain-app-header__contents--avatar-network .mm-text',
          text: 'Localhost 8545',
        });

        // Ensure toast is shown to the user
        await driver.findElement({
          css: '.toast-text',
          text: 'Localhost 8545 is now active on 127.0.0.1:8080',
        });
      },
    );
  });

  it('should autoswitch networks when last confirmation from another network is rejected', async function () {
    const port = 8546;
    const chainId = 1338;

    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleGanache()
          .withPreferencesControllerUseRequestQueueEnabled()
          .withSelectedNetworkControllerPerDomain()
          .build(),
        ganacheOptions: {
          ...defaultGanacheOptions,
          concurrent: [
            {
              port,
              chainId,
              ganacheOptions2: defaultGanacheOptions,
            },
          ],
        },
        dappOptions: { numberOfDapps: 2 },
        title: this.test.fullTitle(),
        driverOptions: { constrainWindowSize: true },
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // Open the first dapp which starts on chain '0x539
        await openDappAndSwitchChain(driver, DAPP_URL);

        // Open tab 2, switch to Ethereum Mainnet
        await openDappAndSwitchChain(driver, DAPP_ONE_URL, '0x1');
        await driver.waitForSelector({
          css: '.error-message-text',
          text: 'You are on the Ethereum Mainnet.',
        });
        await driver.delay(veryLargeDelayMs);

        // Start a Send on Ethereum Mainnet
        await driver.clickElement('#sendButton');
        await driver.delay(regularDelayMs);

        // Open the popup with shimmed activeTabOrigin
        await openPopupWithActiveTabOrigin(driver, DAPP_URL);

        // Ensure the confirmation pill shows Ethereum Mainnet
        await driver.waitForSelector({
          css: '[data-testid="network-display"]',
          text: 'Ethereum Mainnet',
        });

        // Reject the confirmation
        await driver.clickElement(
          '[data-testid="page-container-footer-cancel"]',
        );

        // Wait for network to automatically change to localhost
        await driver.waitForSelector({
          css: '.multichain-app-header__contents--avatar-network .mm-text',
          text: 'Localhost 8545',
        });

        // Ensure toast is shown to the user
        await driver.waitForSelector({
          css: '.toast-text',
          text: 'Localhost 8545 is now active on 127.0.0.1:8080',
        });
      },
    );
  });

  it('should gracefully handle network connectivity failure for signatures @no-mmi', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleGanache()
          .withPreferencesControllerUseRequestQueueEnabled()
          .withSelectedNetworkControllerPerDomain()
          .build(),
        ganacheOptions: {
          ...defaultGanacheOptions,
          concurrent: [
            {
              port,
              chainId,
              ganacheOptions2: defaultGanacheOptions,
            },
          ],
        },
        // This test intentionally quits Ganache while the extension is using it, causing
        // PollingBlockTracker errors and others. These are expected.
        ignoredConsoleErrors: ['ignore-all'],
        dappOptions: { numberOfDapps: 2 },
        title: this.test.fullTitle(),
      },
      async ({ driver, ganacheServer, secondaryGanacheServer }) => {
        await unlockWallet(driver);
        await tempToggleSettingRedesignedConfirmations(driver);

        // Navigate to extension home screen
        await driver.navigate(PAGES.HOME);

        // Open the first dapp
        await openDappAndSwitchChain(driver, DAPP_URL);

        // Open the second dapp and switch chains
        await openDappAndSwitchChain(driver, DAPP_ONE_URL, '0x1');

        // Go to wallet fullscreen, ensure that the global network changed to Ethereum Mainnet
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await driver.waitForSelector({
          css: '[data-testid="network-display"]',
          text: 'Ethereum Mainnet',
        });

        // Kill ganache servers
        await ganacheServer.quit();
        await secondaryGanacheServer[0].quit();

        // Go back to first dapp, try an action, ensure network connection failure doesn't block UI
        await selectDappClickPersonalSign(driver, DAPP_URL);

        // When the network is down, there is a performance degradation that causes the
        // popup to take a few seconds to open in MV3 (issue #25690)
        await driver.waitUntilXWindowHandles(4, 1000, 15000);

        await switchToDialogPopoverValidateDetails(driver, {
          chainId: '0x539',
          networkText: 'Localhost 8545',
          originText: DAPP_URL,
        });
      },
    );
  });

  it('should gracefully handle network connectivity failure for confirmations @no-mmi', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dapp: true,
        // Presently confirmations take up to 10 seconds to display on a dead network
        driverOptions: { timeOut: 30000 },
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleGanache()
          .withPreferencesControllerUseRequestQueueEnabled()
          .withSelectedNetworkControllerPerDomain()
          .build(),
        ganacheOptions: {
          ...defaultGanacheOptions,
          concurrent: [
            {
              port,
              chainId,
              ganacheOptions2: defaultGanacheOptions,
            },
          ],
        },
        // This test intentionally quits Ganache while the extension is using it, causing
        // PollingBlockTracker errors and others. These are expected.
        ignoredConsoleErrors: ['ignore-all'],
        dappOptions: { numberOfDapps: 2 },
        title: this.test.fullTitle(),
      },
      async ({ driver, ganacheServer, secondaryGanacheServer }) => {
        await unlockWallet(driver);

        // Navigate to extension home screen
        await driver.navigate(PAGES.HOME);

        // Open the first dapp
        await openDappAndSwitchChain(driver, DAPP_URL);

        // Open the second dapp and switch chains
        await openDappAndSwitchChain(driver, DAPP_ONE_URL, '0x1');

        // Go to wallet fullscreen, ensure that the global network changed to Ethereum Mainnet
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await driver.findElement({
          css: '[data-testid="network-display"]',
          text: 'Ethereum Mainnet',
        });

        // Kill ganache servers
        await ganacheServer.quit();
        await secondaryGanacheServer[0].quit();

        // Go back to first dapp, try an action, ensure network connection failure doesn't block UI
        await selectDappClickSend(driver, DAPP_URL);

        // When the network is down, there is a performance degradation that causes the
        // popup to take a few seconds to open in MV3 (issue #25690)
        await driver.waitUntilXWindowHandles(4, 1000, 15000);

        await switchToDialogPopoverValidateDetails(driver, {
          chainId: '0x539',
          networkText: 'Localhost 8545',
          originText: DAPP_URL,
        });
      },
    );
  });
});
