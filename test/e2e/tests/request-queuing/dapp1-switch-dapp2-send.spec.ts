import FixtureBuilder from '../../fixture-builder';
import {
  DAPP_ONE_URL,
  DAPP_URL,
  WINDOW_TITLES,
  withFixtures,
} from '../../helpers';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import ConnectAccountConfirmation from '../../page-objects/pages/confirmations/redesign/connect-account-confirmation';
import HomePage from '../../page-objects/pages/home/homepage';
import NetworkManager from '../../page-objects/pages/network-manager';
import NetworkPermissionSelectModal from '../../page-objects/pages/dialog/network-permission-select-modal';
import ReviewPermissionsConfirmation from '../../page-objects/pages/confirmations/redesign/review-permissions-confirmation';
import TestDapp from '../../page-objects/pages/test-dapp';
import TransactionConfirmation from '../../page-objects/pages/confirmations/redesign/transaction-confirmation';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Request Queuing Dapp 1, Switch Tx -> Dapp 2 Send Tx', function () {
  it('should queue send tx after switch network confirmation and transaction should target the correct network after switch is confirmed', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerTripleNode()
          .withSelectedNetworkControllerPerDomain()
          .build(),
        dappOptions: { numberOfDapps: 2 },
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
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        // Open Dapp One
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        // Connect to dapp
        await testDapp.clickConnectAccountButton();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const connectAccountConfirmation = new ConnectAccountConfirmation(
          driver,
        );
        await connectAccountConfirmation.checkPageIsLoaded();
        await connectAccountConfirmation.goToPermissionsTab();
        await connectAccountConfirmation.openEditNetworksModal();

        // Disconnect Localhost 8545
        const networkPermissionSelectModal = new NetworkPermissionSelectModal(
          driver,
        );
        await networkPermissionSelectModal.checkPageIsLoaded();
        await networkPermissionSelectModal.selectNetwork({
          networkName: 'Localhost 8545',
          shouldBeSelected: false,
        });
        await networkPermissionSelectModal.clickConfirmEditButton();
        await connectAccountConfirmation.checkPageIsLoaded();
        await connectAccountConfirmation.confirmConnect();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Network Selector
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectNetworkByName('Localhost 8546');

        // TODO: Request Queuing bug when opening both dapps at the same time will have them stuck on the same network, with will be incorrect for one of them.
        // Open Dapp Two
        const testDappTwo = new TestDapp(driver);
        await testDappTwo.openTestDappPage({ url: DAPP_ONE_URL });
        await testDappTwo.checkPageIsLoaded();

        // Connect to dapp 2
        await testDappTwo.connectAccount({});

        await driver.switchToWindowWithUrl(DAPP_URL);

        // switchEthereumChain request
        const switchEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x539' }],
        });

        // Initiate switchEthereumChain on Dapp One
        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequest})`,
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const reviewPermissionsConfirmation = new ReviewPermissionsConfirmation(
          driver,
        );
        await reviewPermissionsConfirmation.checkPageIsLoaded();
        await reviewPermissionsConfirmation.checkUseEnabledNetworksMessageIsDisplayed();

        await driver.switchToWindowWithUrl(DAPP_ONE_URL);

        await testDappTwo.checkPageIsLoaded();
        await testDappTwo.clickSimpleSendButton();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await reviewPermissionsConfirmation.checkPageIsLoaded();
        await reviewPermissionsConfirmation.clickConfirmReviewPermissionsButton();

        await driver.switchToWindowWithUrl(DAPP_ONE_URL);

        // Wait for switch confirmation to close then tx confirmation to show.
        // There is an extra window appearing and disappearing
        // so we leave this delay until the issue is fixed (#27360)
        await driver.delay(5000);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // Check correct network on the send confirmation.
        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.checkPageIsLoaded();
        await transactionConfirmation.checkNetworkIsDisplayed('Localhost 8546');
        await transactionConfirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();
      },
    );
  });

  it('should queue send tx after switch network confirmation and transaction should target the correct network after switch is cancelled.', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerTripleNode()
          .withSelectedNetworkControllerPerDomain()
          .build(),
        dappOptions: { numberOfDapps: 2 },
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
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        // Open Dapp One
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        // Connect to dapp
        await testDapp.clickConnectAccountButton();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const connectAccountConfirmation = new ConnectAccountConfirmation(
          driver,
        );
        await connectAccountConfirmation.checkPageIsLoaded();
        await connectAccountConfirmation.goToPermissionsTab();
        await connectAccountConfirmation.openEditNetworksModal();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // Disconnect Localhost 8545
        const networkPermissionSelectModal = new NetworkPermissionSelectModal(
          driver,
        );
        await networkPermissionSelectModal.checkPageIsLoaded();
        await networkPermissionSelectModal.selectNetwork({
          networkName: 'Localhost 8545',
          shouldBeSelected: false,
        });
        await networkPermissionSelectModal.clickConfirmEditButton();
        await connectAccountConfirmation.checkPageIsLoaded();
        await connectAccountConfirmation.confirmConnect();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Network Selector
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectNetworkByName('Localhost 8546');

        // TODO: Request Queuing bug when opening both dapps at the same time will have them stuck on the same network, with will be incorrect for one of them.
        // Open Dapp Two
        const testDappTwo = new TestDapp(driver);
        await testDappTwo.openTestDappPage({ url: DAPP_ONE_URL });
        await testDappTwo.checkPageIsLoaded();

        // Connect to dapp 2
        await testDappTwo.connectAccount({});

        await driver.switchToWindowWithUrl(DAPP_URL);
        await testDapp.checkPageIsLoaded();

        // switchEthereumChain request
        const switchEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x539' }],
        });

        // Initiate switchEthereumChain on Dapp One
        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequest})`,
        );

        await driver.switchToWindowWithUrl(DAPP_ONE_URL);
        await testDappTwo.checkPageIsLoaded();
        await testDappTwo.clickSimpleSendButton();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const reviewPermissionsConfirmation = new ReviewPermissionsConfirmation(
          driver,
        );
        await reviewPermissionsConfirmation.checkPageIsLoaded();
        await reviewPermissionsConfirmation.clickCancelReviewPermissionsButton();
        await driver.switchToWindowWithUrl(DAPP_ONE_URL);

        // Wait for switch confirmation to close then tx confirmation to show.
        // There is an extra window appearing and disappearing
        // so we leave this delay until the issue is fixed (#27360)
        await driver.delay(5000);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // Check correct network on the send confirmation.
        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.checkPageIsLoaded();
        await transactionConfirmation.checkNetworkIsDisplayed('Localhost 8546');
        await transactionConfirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();

        // Switch back to the extension
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.goToActivityList();

        // Check for transaction
        await new ActivityListPage(
          driver,
        ).checkConfirmedTxNumberDisplayedInActivity(1);
      },
    );
  });
});
