const { strict: assert } = require('assert');
const { Browser, By } = require('selenium-webdriver');
const { toEvmCaipChainId } = require('@metamask/multichain-network-controller');
const {
  default: NetworkManager,
  NetworkId,
} = require('../../page-objects/pages/network-manager');
const {
  loginWithBalanceValidation,
} = require('../../page-objects/flows/login.flow');
const { CHAIN_IDS } = require('../../../../shared/constants/network');
const FixtureBuilder = require('../../fixture-builder');
const {
  withFixtures,
  openDapp,
  DAPP_URL,
  DAPP_ONE_URL,
  WINDOW_TITLES,
  veryLargeDelayMs,
  DAPP_TWO_URL,
} = require('../../helpers');
const { PAGES } = require('../../webdriver/driver');
const {
  PermissionNames,
} = require('../../../../app/scripts/controllers/permissions');
const { CaveatTypes } = require('../../../../shared/constants/permissions');

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
  await driver.clickElement({ text: 'Connect', tag: 'button' });

  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  await driver.clickElementAndWaitForWindowToClose({
    text: 'Connect',
    tag: 'button',
  });

  // Switch back to the dapp
  await driver.switchToWindowWithUrl(dappUrl);

  // Switch chains if necessary
  if (chainId) {
    await driver.delay(veryLargeDelayMs);
    const getPermissionsRequest = JSON.stringify({
      method: 'wallet_getPermissions',
    });
    const getPermissionsResult = await driver.executeScript(
      `return window.ethereum.request(${getPermissionsRequest})`,
    );

    const permittedChains =
      getPermissionsResult
        ?.find(
          (permission) =>
            permission.parentCapability === PermissionNames.permittedChains,
        )
        ?.caveats.find(
          (caveat) => caveat.type === CaveatTypes.restrictNetworkSwitching,
        )?.value || [];

    const isAlreadyPermitted = permittedChains.includes(chainId);

    const switchChainRequest = JSON.stringify({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    });

    await driver.executeScript(
      `window.ethereum.request(${switchChainRequest})`,
    );

    if (!isAlreadyPermitted) {
      await driver.delay(veryLargeDelayMs);
      await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

      await driver.findClickableElement(
        '[data-testid="page-container-footer-next"]',
      );
      await driver.clickElementAndWaitForWindowToClose(
        '[data-testid="page-container-footer-next"]',
      );

      // Switch back to the dapp
      await driver.switchToWindowWithUrl(dappUrl);
    }
  }
}

async function selectDappClickSend(driver, dappUrl) {
  await driver.switchToWindowWithUrl(dappUrl);
  await driver.clickElement('#sendButton');
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.waitForSelector({
    tag: 'h3',
    text: 'Transfer request',
  });
}

async function selectDappClickPersonalSign(driver, dappUrl) {
  await driver.switchToWindowWithUrl(dappUrl);
  await driver.clickElement('#personalSign');
}

async function switchToDialogPopoverValidateDetailsRedesign(
  driver,
  expectedDetails,
) {
  // Switches to the MetaMask Dialog window for confirmation
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  await driver.findElement({
    css: 'p',
    text: expectedDetails.networkText,
  });
}

async function rejectTransactionRedesign(driver) {
  await driver.clickElementAndWaitForWindowToClose({
    tag: 'button',
    text: 'Cancel',
  });
}

async function confirmTransaction(driver) {
  await driver.clickElement({ tag: 'button', text: 'Confirm' });
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

  // Ensure there's an activity entry of "Sent" and "Confirmed"
  if (expectedActivityEntries) {
    await driver.clickElement('[data-testid="account-overview__activity-tab"]');
    assert.equal(
      (
        await driver.findElements({
          css: '[data-testid="activity-list-item-action"]',
          text: 'Sent',
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
  this.timeout(500000); // This test is very long, so we need an unusually high timeout
  it('should show network specific to domain', async function () {
    const port = 8546;
    const chainId = 1338; // 0x53a
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleNode()
          .build(),
        localNodeOptions: [
          {
            type: 'anvil',
          },
          {
            type: 'anvil',
            options: {
              port,
              chainId,
            },
          },
        ],
        dappOptions: { numberOfDapps: 2 },
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        // Open the first dapp
        await openDappAndSwitchChain(driver, DAPP_URL, '0x539');

        // Open the second dapp and switch chains
        await openDappAndSwitchChain(driver, DAPP_ONE_URL, '0x53a');

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Custom');
        await driver.clickElementAndWaitToDisappear(
          '[data-testid="Localhost 8546"]',
        );

        // Go to the first dapp, ensure it uses localhost
        await selectDappClickSend(driver, DAPP_URL);
        await switchToDialogPopoverValidateDetailsRedesign(driver, {
          chainId: '0x539',
          networkText: 'Localhost 8545',
          originText: DAPP_URL,
        });
        await rejectTransactionRedesign(driver);

        // Go to the second dapp, ensure it uses Ethereum
        await selectDappClickSend(driver, DAPP_ONE_URL);
        await switchToDialogPopoverValidateDetailsRedesign(driver, {
          chainId: '0x53a',
          networkText: 'Localhost 8546',
          originText: DAPP_ONE_URL,
        });
        await rejectTransactionRedesign(driver);
      },
    );
  });

  it('handles three confirmations on three confirmations concurrently', async function () {
    const port = 8546;
    const chainId = 1338; // 0x53a
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerTripleNode()
          .withPreferencesController({
            preferences: { showTestNetworks: true },
          })
          .withEnabledNetworks({
            eip155: {
              '0x539': true,
            },
          })
          .build(),
        localNodeOptions: [
          {
            type: 'anvil',
          },
          {
            type: 'anvil',
            options: {
              port,
              chainId,
            },
          },
          {
            type: 'anvil',
            options: {
              port: 7777,
              chainId: 1000,
            },
          },
        ],

        dappOptions: { numberOfDapps: 3 },
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        // Open the first dapp
        await openDappAndSwitchChain(driver, DAPP_URL, '0x539');

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
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.waitForSelector(
          By.xpath("//p[normalize-space(.)='1 of 2']"),
        );

        if (!IS_FIREFOX) {
          // Trigger a send confirmation on the third dapp, do not confirm or reject
          await selectDappClickSend(driver, DAPP_TWO_URL);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await driver.waitForSelector(
            By.xpath("//p[normalize-space(.)='1 of 3']"),
          );
        }

        // Switch to the Notification window, ensure first transaction still showing
        await switchToDialogPopoverValidateDetailsRedesign(driver, {
          chainId: '0x539',
          networkText: 'Localhost 8545',
          originText: DAPP_URL,
        });

        // Confirm transaction, wait for first confirmation window to close, second to display
        await confirmTransaction(driver);
        await driver.delay(veryLargeDelayMs);

        // Switch to the new Notification window, ensure second transaction showing
        await switchToDialogPopoverValidateDetailsRedesign(driver, {
          chainId: '0x53a',
          networkText: 'Localhost 8546',
          originText: DAPP_ONE_URL,
        });

        // Reject this transaction, wait for second confirmation window to close, third to display
        await driver.clickElement({
          tag: 'button',
          text: 'Cancel',
        });
        await driver.delay(veryLargeDelayMs);

        if (!IS_FIREFOX) {
          // Switch to the new Notification window, ensure third transaction showing
          await switchToDialogPopoverValidateDetailsRedesign(driver, {
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

        const networkManager = new NetworkManager(driver);

        if (!IS_FIREFOX) {
          // Start on the last joined network, whose send transaction was just confirmed
          await networkManager.openNetworkManager();
          await networkManager.selectTab('Custom');
          await driver.clickElementAndWaitToDisappear(
            '[data-testid="Localhost 7777"]',
          );
          await validateBalanceAndActivity(driver, '24.9998');
        }

        // Validate second network, where transaction was rejected
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Custom');
        await driver.clickElementAndWaitToDisappear(
          '[data-testid="Localhost 8546"]',
        );

        await validateBalanceAndActivity(driver, '25', 0);

        // Validate first network, where transaction was confirmed
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Custom');
        await driver.clickElementAndWaitToDisappear(
          '[data-testid="Localhost 8545"]',
        );

        await validateBalanceAndActivity(driver, '24.9998');
      },
    );
  });

  it('should gracefully handle deleted network', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleNode()
          .withPreferencesController({
            preferences: { showTestNetworks: true },
          })

          .build(),
        localNodeOptions: [
          {
            type: 'anvil',
          },
          {
            type: 'anvil',
            options: {
              port,
              chainId,
            },
          },
        ],
        dappOptions: { numberOfDapps: 2 },
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        // Open the first dapp
        await openDappAndSwitchChain(driver, DAPP_URL, '0x539');

        // Open the second dapp and switch chains
        await openDappAndSwitchChain(driver, DAPP_ONE_URL, '0x1');

        // Go to wallet fullscreen, ensure that the global network changed to Ethereum
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Open Network Manager and delete custom network
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Custom');

        // Delete network
        const networkRow = await driver.findElement({
          css: '.multichain-network-list-item',
          text: 'Localhost 8545',
        });

        const networkMenu = await driver.findNestedElement(
          networkRow,
          `[data-testid="network-list-item-options-button-${toEvmCaipChainId(
            CHAIN_IDS.LOCALHOST,
          )}"]`,
        );

        await networkMenu.click();
        await driver.clickElement(
          '[data-testid="network-list-item-options-delete"]',
        );

        await driver.clickElement({ tag: 'button', text: 'Delete' });

        // Go back to first dapp, try an action, ensure deleted network doesn't block UI
        // The current globally selected network, Ethereum, should be used
        await selectDappClickSend(driver, DAPP_URL);
        await driver.delay(veryLargeDelayMs);
        await switchToDialogPopoverValidateDetailsRedesign(driver, {
          chainId: '0x1',
          networkText: 'Ethereum',
          originText: DAPP_URL,
        });
      },
    );
  });

  it('should signal from UI to dapp the network change', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        title: this.test.fullTitle(),
        driverOptions: { constrainWindowSize: true },
      },
      async ({ driver }) => {
        // Navigate to extension home screen
        await loginWithBalanceValidation(driver);

        // Open the first dapp which starts on chain '0x539
        await openDappAndSwitchChain(driver, DAPP_URL, '0x539');

        // Ensure the dapp starts on the correct network
        await driver.waitForSelector({
          css: '[id="chainId"]',
          text: '0x539',
        });

        // Open the popup with shimmed activeTabOrigin
        await openPopupWithActiveTabOrigin(driver, DAPP_URL);

        // Switch to mainnet using per-dapp connected network flow
        await driver.clickElement('[data-testid="connection-menu"]');
        await driver.clickElement(
          '[data-testid="connected-site-popover-network-button"]',
        );
        await driver.clickElement('[data-testid="Ethereum"]');

        // Switch back to the Dapp tab
        await driver.switchToWindowWithUrl(DAPP_URL);

        // Check to make sure the dapp network changed
        await driver.waitForSelector({
          css: '[id="chainId"]',
          text: '0x1',
        });
      },
    );
  });

  it('should gracefully handle network connectivity failure for signatures', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleNode()
          .withEnabledNetworks({
            eip155: {
              '0x539': true,
            },
          })
          .build(),
        localNodeOptions: [
          {
            type: 'anvil',
          },
          {
            type: 'anvil',
            options: {
              port,
              chainId,
            },
          },
        ],
        // This test intentionally quits the local node server while the extension is using it, causing
        // PollingBlockTracker errors and others. These are expected.
        ignoredConsoleErrors: ['ignore-all'],
        dappOptions: { numberOfDapps: 2 },
        title: this.test.fullTitle(),
      },
      async ({ driver, localNodes }) => {
        await loginWithBalanceValidation(driver);

        // Open the first dapp
        await openDappAndSwitchChain(driver, DAPP_URL, '0x539');

        // Open the second dapp and switch chains
        await openDappAndSwitchChain(driver, DAPP_ONE_URL, '0x1');

        // Go to wallet fullscreen, ensure that the global network changed to Ethereum
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Check if Ethereum is selected
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.checkNetworkIsSelected(NetworkId.ETHEREUM);
        await networkManager.closeNetworkManager();

        // Kill local node servers
        await localNodes[0].quit();
        await localNodes[1].quit();

        // Go back to first dapp, try an action, ensure network connection failure doesn't block UI
        await selectDappClickPersonalSign(driver, DAPP_URL);

        // When the network is down, there is a performance degradation that causes the
        // popup to take a few seconds to open in MV3 (issue #25690)
        await driver.waitUntilXWindowHandles(4, 1000, 15000);

        await switchToDialogPopoverValidateDetailsRedesign(driver, {
          chainId: '0x539',
          networkText: 'Localhost 8545',
          originText: DAPP_URL,
        });
      },
    );
  });

  it('should gracefully handle network connectivity failure for confirmations', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dapp: true,
        // Presently confirmations take up to 10 seconds to display on a dead network
        driverOptions: { timeOut: 30000 },
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleNode()
          .withEnabledNetworks({
            eip155: {
              '0x1': true,
              '0x539': true,
            },
          })
          .build(),
        localNodeOptions: [
          {
            type: 'anvil',
          },
          {
            type: 'anvil',
            options: {
              port,
              chainId,
            },
          },
        ],
        // This test intentionally quits the local node server while the extension is using it, causing
        // PollingBlockTracker errors and others. These are expected.
        ignoredConsoleErrors: ['ignore-all'],
        dappOptions: { numberOfDapps: 2 },
        title: this.test.fullTitle(),
      },
      async ({ driver, localNodes }) => {
        await loginWithBalanceValidation(
          driver,
          undefined,
          undefined,
          '85,000.00',
        );

        // Open the first dapp
        await openDappAndSwitchChain(driver, DAPP_URL, '0x539');

        // Open the second dapp and switch chains
        await openDappAndSwitchChain(driver, DAPP_ONE_URL, '0x1');

        // Go to wallet fullscreen, ensure that the global network changed to Ethereum
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Check if Ethereum is selected
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.checkNetworkIsSelected(NetworkId.ETHEREUM);
        await networkManager.closeNetworkManager();

        // Kill local node servers
        await localNodes[0].quit();
        await localNodes[1].quit();

        // Go back to first dapp, try an action, ensure network connection failure doesn't block UI
        await selectDappClickSend(driver, DAPP_URL);

        // When the network is down, there is a performance degradation that causes the
        // popup to take a few seconds to open in MV3 (issue #25690)
        await driver.waitUntilXWindowHandles(4, 1000, 15000);

        await switchToDialogPopoverValidateDetailsRedesign(driver, {
          chainId: '0x539',
          networkText: 'Localhost 8545',
          originText: DAPP_URL,
        });
      },
    );
  });
});
