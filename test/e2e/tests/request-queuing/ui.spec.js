const { strict: assert } = require('assert');
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
  switchToNotificationWindow,
  veryLargeDelayMs,
  DAPP_TWO_URL,
} = require('../../helpers');
const { PAGES } = require('../../webdriver/driver');

async function openDappAndSwitchChain(
  driver,
  dappUrl,
  chainId,
  notificationWindowIndex = 3,
) {
  // Open the dapp
  await openDapp(driver, undefined, dappUrl);
  await driver.delay(regularDelayMs);

  // Connect to the dapp
  await driver.findClickableElement({ text: 'Connect', tag: 'button' });
  await driver.clickElement('#connectButton');
  await driver.delay(regularDelayMs);
  await switchToNotificationWindow(driver, notificationWindowIndex);
  await driver.clickElement({
    text: 'Next',
    tag: 'button',
    css: '[data-testid="page-container-footer-next"]',
  });
  await driver.clickElement({
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
    await switchToNotificationWindow(driver, notificationWindowIndex);

    await driver.findClickableElement(
      '[data-testid="confirmation-submit-button"]',
    );
    await driver.clickElement('[data-testid="confirmation-submit-button"]');
  }
}

async function selectDappClickSend(driver, dappUrl, expectedWindowHandles = 3) {
  await driver.switchToWindowWithUrl(dappUrl);
  // Windows: MetaMask, TestDapp1, TestDapp2, TestDapp3
  await driver.waitUntilXWindowHandles(expectedWindowHandles);
  await driver.clickElement('#sendButton');
}

async function switchtoNotificationWindow(driver) {
  // Switches to the MetaMask Dialog window for confirmation
  const windowHandles = await driver.getAllWindowHandles();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog, windowHandles);
}

async function switchToNotificationPopoverValidateDetails(
  driver,
  expectedDetails,
) {
  await switchtoNotificationWindow(driver);

  // Get UI details
  const networkPill = await driver.findElement(
    '[data-testid="network-display"]',
  );
  const networkText = await networkPill.getText();
  const originElement = await driver.findElement(
    '.confirm-page-container-summary__origin bdi',
  );
  const originText = await originElement.getText();

  // Get state details
  const notificationWindowState = await driver.executeScript(() =>
    window.stateHooks?.getCleanAppState?.(),
  );
  const { chainId } = notificationWindowState.metamask.providerConfig;

  // Ensure accuracy
  validateConfirmationDetails(
    { networkText, originText, chainId },
    expectedDetails,
  );
}

async function rejectTransaction(driver) {
  await driver.clickElement({ tag: 'button', text: 'Reject' });
}

async function confirmTransaction(driver) {
  await driver.clickElement({ tag: 'button', text: 'Confirm' });
}

function validateConfirmationDetails(
  { chainId, networkText, originText },
  expected,
) {
  assert.equal(chainId, expected.chainId);
  assert.equal(networkText, expected.networkText);
  assert.equal(originText, expected.originText);
}

async function switchToNetworkByName(driver, networkName) {
  await driver.clickElement('[data-testid="network-display"]');
  await driver.clickElement(`[data-testid="${networkName}"]`);
}

async function validateBalanceAndActivity(
  driver,
  expectedBalance,
  expectedActivityEntries = 1,
) {
  // Ensure the balance changed if the the transaction was confirmed
  const balanceElement = await driver.findElement(
    '[data-testid="eth-overview__primary-currency"] .currency-display-component__text',
  );
  const balanceText = await balanceElement.getText();
  assert.equal(balanceText, expectedBalance);

  // Ensure there's an activity entry
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
    (await driver.findElements('.transaction-status-label--confirmed')).length,
    expectedActivityEntries,
  );
}


describe('Request-queue UI changes', function () {
  it('UI should show network specific to domain @no-mmi', async function () {
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
        await openDappAndSwitchChain(driver, DAPP_ONE_URL, '0x1', 4);

        // Go to wallet fullscreen, ensure that the global network changed to Ethereum Mainnet
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await driver.findElement({
          css: '[data-testid="network-display"]',
          text: 'Ethereum Mainnet',
        });

        // Go to the first dapp, ensure it uses localhost
        await selectDappClickSend(driver, DAPP_URL);
        await switchToNotificationPopoverValidateDetails(driver, {
          chainId: '0x539',
          networkText: 'Localhost 8545',
          originText: DAPP_URL,
        });
        await rejectTransaction(driver);

        // Go to the second dapp, ensure it uses Ethereum Mainnet
        await selectDappClickSend(driver, DAPP_ONE_URL);
        await switchToNotificationPopoverValidateDetails(driver, {
          chainId: '0x1',
          networkText: 'Ethereum Mainnet',
          originText: DAPP_ONE_URL,
        });
        await rejectTransaction(driver);
      },
    );
  });

  it.only('handles three confirmations on three confirmations concurrently @no-mmi', async function () {
    const port = 8546;
    const chainId = 1338;
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
        await openDappAndSwitchChain(driver, DAPP_ONE_URL, '0x1', 4);

        // Open the third dapp and switch chains
        await openDappAndSwitchChain(driver, DAPP_TWO_URL, '0x3e8', 5);

        // Trigger a send confirmation on the first dapp, do not confirm or reject
        await selectDappClickSend(driver, DAPP_URL, 4);

        // Trigger a send confirmation on the second dapp, do not confirm or reject
        await selectDappClickSend(driver, DAPP_ONE_URL, 4);

        // Trigger a send confirmation on the third dapp, do not confirm or reject
        await selectDappClickSend(driver, DAPP_TWO_URL, 4);

        // Switch to the Notification window, ensure first transaction still showing
        await switchToNotificationPopoverValidateDetails(driver, {
          chainId: '0x539',
          networkText: 'Localhost 8545',
          originText: DAPP_URL,
        });

        // Confirm transaction, wait for first confirmation window to close, second to display
        await confirmTransaction(driver);
        await driver.delay(veryLargeDelayMs);

        // Switch to the new Notification window, ensure second transaction showing
        await switchToNotificationPopoverValidateDetails(driver, {
          chainId: '0x1',
          networkText: 'Ethereum Mainnet',
          originText: DAPP_ONE_URL,
        });

        // Reject this transaction, wait for second confirmation window to close, third to display
        await rejectTransaction(driver);
        await driver.delay(veryLargeDelayMs);

        // Switch to the new Notification window, ensure third transaction showing
        await switchToNotificationPopoverValidateDetails(driver, {
          chainId: '0x3e8',
          networkText: 'Localhost 7777',
          originText: DAPP_TWO_URL,
        });

        // Confirm transaction
        await confirmTransaction(driver);

        // With first and last confirmations confirmed, and second rejected,
        // Ensure only first and last network balances were affected
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Wait for transaction to be completed on final confirmation
        await driver.delay(veryLargeDelayMs);

        // Start on the last joined network, whose send transaction was just confirmed
        await validateBalanceAndActivity(driver, '24.9998');

        // Switch to second network, ensure full balance
        await switchToNetworkByName(driver, 'Ethereum Mainnet');
        await validateBalanceAndActivity(driver, '25', 0);

        // Switch to first network, whose send transaction was just confirmed
        await switchToNetworkByName(driver, 'Localhost 8545');
        await validateBalanceAndActivity(driver, '24.9998');
      },
    );
  });
});
