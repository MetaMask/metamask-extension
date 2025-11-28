import { Browser } from 'selenium-webdriver';
import {
  CaveatConstraint,
  PermissionConstraint,
} from '@metamask/permission-controller';
import NetworkManager, {
  NetworkId,
} from '../../page-objects/pages/network-manager';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { DEFAULT_LOCAL_NODE_USD_BALANCE } from '../../constants';
import {
  withFixtures,
  DAPP_URL,
  DAPP_ONE_URL,
  WINDOW_TITLES,
  veryLargeDelayMs,
  DAPP_TWO_URL,
} from '../../helpers';
import { Driver, PAGES } from '../../webdriver/driver';
import { PermissionNames } from '../../../../app/scripts/controllers/permissions';
import { CaveatTypes } from '../../../../shared/constants/permissions';
import TestDapp from '../../page-objects/pages/test-dapp';
import { Anvil } from '../../seeder/anvil';
import HomePage from '../../page-objects/pages/home/homepage';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import ConnectAccountConfirmation from '../../page-objects/pages/confirmations/redesign/connect-account-confirmation';
import Confirmation from '../../page-objects/pages/confirmations/redesign/confirmation';
import TokenTransferTransactionConfirmation from '../../page-objects/pages/confirmations/redesign/token-transfer-confirmation';
import ReviewPermissionsConfirmation from '../../page-objects/pages/confirmations/redesign/review-permissions-confirmation';
import TransactionConfirmation from '../../page-objects/pages/confirmations/redesign/transaction-confirmation';
import HeaderNavbar from '../../page-objects/pages/header-navbar';

// Window handle adjustments will need to be made for Non-MV3 Firefox
// due to OffscreenDocument.  Additionally Firefox continually bombs
// with a "NoSuchWindowError: Browsing context has been discarded" whenever
// we try to open a third dapp, so this test run in Firefox will
// validate two dapps instead of 3
const IS_FIREFOX = process.env.SELENIUM_BROWSER === Browser.FIREFOX;

type ExpectedDetails = {
  chainId: string;
  networkText: string;
  originText: string;
};

async function openDappAndSwitchChain(
  driver: Driver,
  dappUrl: string,
  chainId?: string,
): Promise<void> {
  // Open the dapp
  const testDapp = new TestDapp(driver);
  const connectAccountConfirmation = new ConnectAccountConfirmation(driver);
  const reviewPermissionsConfirmation = new ReviewPermissionsConfirmation(
    driver,
  );

  // Open the dapp
  await driver.openNewPage(dappUrl);

  // Connect to the dapp
  await testDapp.clickConnectAccountButton();

  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  await connectAccountConfirmation.confirmConnect();

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
          (permission: PermissionConstraint) =>
            permission.parentCapability === PermissionNames.permittedChains,
        )
        ?.caveats.find(
          (caveat: CaveatConstraint) =>
            caveat.type === CaveatTypes.restrictNetworkSwitching,
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

      await reviewPermissionsConfirmation.clickConfirmReviewPermissionsButtonWithWaitForWindowToClose();

      // Switch back to the dapp
      await driver.switchToWindowWithUrl(dappUrl);
    }
  }
}

async function selectDappClickSend(
  driver: Driver,
  dappUrl: string,
): Promise<void> {
  const testDapp = new TestDapp(driver);
  const transactionConfirmation = new TransactionConfirmation(driver);

  await driver.switchToWindowWithUrl(dappUrl);
  await testDapp.clickSimpleSendButton();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  await transactionConfirmation.checkDappInitiatedHeadingTitle();
}

async function selectDappClickPersonalSign(
  driver: Driver,
  dappUrl: string,
): Promise<void> {
  await driver.switchToWindowWithUrl(dappUrl);

  const testDapp = new TestDapp(driver);
  await testDapp.clickPersonalSign();
}

async function switchToDialogPopoverValidateDetailsRedesign(
  driver: Driver,
  expectedDetails: ExpectedDetails,
): Promise<void> {
  // Switches to the MetaMask Dialog window for confirmation
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  const tokenTransferTransactionConfirmation =
    new TokenTransferTransactionConfirmation(driver);
  await tokenTransferTransactionConfirmation.checkNetwork(
    expectedDetails.networkText,
  );
}

async function confirmTransaction(driver: Driver): Promise<void> {
  const confirmation = new Confirmation(driver);
  await confirmation.clickFooterConfirmButton();
}

async function openPopupWithActiveTabOrigin(
  driver: Driver,
  origin: string,
): Promise<void> {
  await driver.openNewPage(
    `${driver.extensionUrl}/${PAGES.POPUP}.html?activeTabOrigin=${origin}`,
  );
}

async function validateBalanceAndActivity(
  driver: Driver,
  expectedBalance: string,
  expectedActivityEntries: number = 1,
): Promise<void> {
  // Ensure the balance changed if the the transaction was confirmed
  const homePage = new HomePage(driver);
  await homePage.checkExpectedBalanceIsDisplayed(expectedBalance);

  // Ensure there's an activity entry of "Sent" and "Confirmed"
  if (expectedActivityEntries) {
    const activityList = new ActivityListPage(driver);
    await activityList.openActivityTab();
    await activityList.checkTxAction({ action: 'Sent' });
    await activityList.checkConfirmedTxNumberDisplayedInActivity(
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
        dappOptions: { numberOfTestDapps: 2 },
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

        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
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
        await networkManager.selectNetworkByNameWithWait('Localhost 8546');

        // Go to the first dapp, ensure it uses localhost
        await selectDappClickSend(driver, DAPP_URL);
        await switchToDialogPopoverValidateDetailsRedesign(driver, {
          chainId: '0x539',
          networkText: 'Localhost 8545',
          originText: DAPP_URL,
        });
        const confirmation = new Confirmation(driver);
        await confirmation.clickFooterCancelButtonAndAndWaitForWindowToClose();

        // Go to the second dapp, ensure it uses Ethereum
        await selectDappClickSend(driver, DAPP_ONE_URL);
        await switchToDialogPopoverValidateDetailsRedesign(driver, {
          chainId: '0x53a',
          networkText: 'Localhost 8546',
          originText: DAPP_ONE_URL,
        });
        await confirmation.clickFooterCancelButtonAndAndWaitForWindowToClose();
      },
    );
  });

  it('handles three confirmations on three confirmations concurrently', async function () {
    const port = 8546;
    const chainId = 1338; // 0x53a
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 3 },
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

        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
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

        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.checkNumberOfDappsConnected('1 of 2');

        if (!IS_FIREFOX) {
          // Trigger a send confirmation on the third dapp, do not confirm or reject
          await selectDappClickSend(driver, DAPP_TWO_URL);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          await transactionConfirmation.checkNumberOfDappsConnected('1 of 3');
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
        const confirmation = new Confirmation(driver);
        await confirmation.clickFooterCancelButton();
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

          await networkManager.selectNetworkByNameWithWait('Localhost 7777');
          await validateBalanceAndActivity(driver, '24.9998');
        }

        // Validate second network, where transaction was rejected
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Custom');
        await networkManager.selectNetworkByNameWithWait('Localhost 8546');

        await validateBalanceAndActivity(driver, '25', 0);

        // Validate first network, where transaction was confirmed
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Custom');
        await networkManager.selectNetworkByNameWithWait('Localhost 8545');

        await validateBalanceAndActivity(driver, '24.9998');
      },
    );
  });

  it('should gracefully handle deleted network', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 2 },
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

        title: this.test?.fullTitle(),
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

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByChainId(NetworkId.LINEA);

        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByChainId(NetworkId.ETHEREUM);

        // Open Network Manager and delete custom network
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Custom');

        // Delete network
        await networkManager.deleteNetworkByChainId(CHAIN_IDS.LOCALHOST);

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
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        driverOptions: { constrainWindowSize: true },
      },
      async ({ driver }: { driver: Driver }) => {
        // Navigate to extension home screen
        await loginWithBalanceValidation(driver);

        // Open the first dapp which starts on chain '0x539
        await openDappAndSwitchChain(driver, DAPP_URL, '0x539');

        // Ensure the dapp starts on the correct network
        const testDapp = new TestDapp(driver);
        const headerNavbar = new HeaderNavbar(driver);
        await testDapp.checkNetworkIsConnected('0x539');

        // Open the popup with shimmed activeTabOrigin
        await openPopupWithActiveTabOrigin(driver, DAPP_URL);

        // Switch to mainnet using per-dapp connected network flow
        await headerNavbar.openConnectionMenu();
        await headerNavbar.clickConnectedSitePopoverNetworkButton();
        await headerNavbar.selectNetwork('Ethereum');

        // Switch back to the Dapp tab
        await driver.switchToWindowWithUrl(DAPP_URL);

        // Check to make sure the dapp network changed
        await testDapp.checkNetworkIsConnected('0x1');
      },
    );
  });

  it('should gracefully handle network connectivity failure for signatures', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 2 },
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

        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        localNodes,
      }: {
        driver: Driver;
        localNodes: Anvil[];
      }) => {
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
        dappOptions: { numberOfTestDapps: 2 },
        // Presently confirmations take up to 10 seconds to display on a dead network
        driverOptions: { timeOut: 30000 },
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleNode()
          .withNetworkControllerOnMainnet()
          .withEnabledNetworks({
            eip155: {
              '0x1': true,
              '0x2105': true,
              '0xe708': true,
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

        title: this.test?.fullTitle(),
      },
      async ({ driver, localNodes }) => {
        await loginWithBalanceValidation(
          driver,
          undefined,
          undefined,
          DEFAULT_LOCAL_NODE_USD_BALANCE,
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
        await networkManager.selectNetworkByChainId(NetworkId.ETHEREUM);

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
