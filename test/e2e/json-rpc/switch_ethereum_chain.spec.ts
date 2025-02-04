import {
  withFixtures,
  defaultGanacheOptions,
  WINDOW_TITLES,
  ACCOUNT_1,
} from '../helpers';
import FixtureBuilder from '../fixture-builder';
import TestDapp, {
  DAPP_HOST_ADDRESS,
  DAPP_TWO_URL,
} from '../page-objects/pages/test-dapp';
import ActivityListPage from '../page-objects/pages/home/activity-list';
import ConfirmTxPage from '../page-objects/pages/send/confirm-tx-page';
import ConnectConfirmation from '../page-objects/pages/confirmations/redesign/connect-confirmation';
import ExperimentalSettings from '../page-objects/pages/settings/experimental-settings';
import HeaderNavbar from '../page-objects/pages/header-navbar';
import HomePage from '../page-objects/pages/home/homepage';
import ReviewPermissionConfirmation from '../page-objects/pages/confirmations/redesign/review-permission-confirmation';
import SettingsPage from '../page-objects/pages/settings/settings-page';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';

describe('Switch Ethereum Chain for two dapps', function () {
  it('switches the chainId of two dapps when switchEthereumChain of one dapp is confirmed', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleGanache()
          .build(),
        dappOptions: { numberOfDapps: 2 },

        ganacheOptions: {
          ...defaultGanacheOptions,
          concurrent: [{ port: 8546, chainId: 1338 }],
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver, ganacheServer }) => {
        await loginWithBalanceValidation(driver, ganacheServer);

        // open two dapps
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage({ url: DAPP_HOST_ADDRESS });
        await testDapp.check_pageIsLoaded();
        await testDapp.openTestDappPage({ url: DAPP_TWO_URL });
        await testDapp.check_pageIsLoaded();

        // Initiate switch ethereum chain request on Dapp Two
        const switchEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x53a' }],
        });
        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequest})`,
        );

        // Confirm switch ethereum chain
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const reviewPermissionConfirmation = new ReviewPermissionConfirmation(
          driver,
        );
        await reviewPermissionConfirmation.check_pageIsLoaded();
        await reviewPermissionConfirmation.confirmReviewPermissions();

        // Switch to Dapp One and check chainId
        await driver.switchToWindowWithUrl(DAPP_HOST_ADDRESS);
        await driver.waitForUrl({
          url: `${DAPP_HOST_ADDRESS}/`,
        });
        await testDapp.check_pageIsLoaded();
        await testDapp.check_currentConnectedChainId('0x53a');

        // Switch to Dapp Two and check chainId
        await driver.switchToWindowWithUrl(DAPP_TWO_URL);
        await driver.waitForUrl({ url: `${DAPP_TWO_URL}/` });
        await testDapp.check_pageIsLoaded();
        await testDapp.check_currentConnectedChainId('0x53a');
      },
    );
  });

  it('queues switchEthereumChain request from second dapp after send tx request', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleGanache()
          .withPreferencesControllerSmartTransactionsOptedOut()
          .build(),
        dappOptions: { numberOfDapps: 2 },
        ganacheOptions: {
          ...defaultGanacheOptions,
          concurrent: [{ port: 8546, chainId: 1338 }],
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver, ganacheServer }) => {
        await loginWithBalanceValidation(driver, ganacheServer);

        // Open two dapps and connect account to dapp two
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage({ url: DAPP_HOST_ADDRESS });
        await testDapp.check_pageIsLoaded();
        await testDapp.openTestDappPage({ url: DAPP_TWO_URL });
        await testDapp.check_pageIsLoaded();
        await testDapp.connectAccount({
          publicAddress: ACCOUNT_1,
          testDappUrl: DAPP_TWO_URL,
        });

        // Switch to Dapp One and disconnect Localhost 8545
        await driver.switchToWindowWithUrl(DAPP_HOST_ADDRESS);
        await driver.waitForUrl({ url: `${DAPP_HOST_ADDRESS}/` });
        await testDapp.check_pageIsLoaded();
        await testDapp.clickConnectButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const connectConfirmation = new ConnectConfirmation(driver);
        await connectConfirmation.check_pageIsLoaded();
        await connectConfirmation.editNetworkAndConfirmConnect(
          'Localhost 8545',
        );

        // Switch to Dapp Two and initiate send transaction
        await driver.switchToWindowWithUrl(DAPP_TWO_URL);
        await driver.waitForUrl({ url: `${DAPP_TWO_URL}/` });
        await testDapp.check_pageIsLoaded();
        await testDapp.clickSimpleSendButton();
        await driver.delay(2000);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const confirmTxPage = new ConfirmTxPage(driver);
        await confirmTxPage.check_pageIsLoaded('0.00021');

        // Switch to Dapp One and initiate switch ethereum chain request
        await driver.switchToWindowWithUrl(DAPP_HOST_ADDRESS);
        await driver.waitForUrl({ url: `${DAPP_HOST_ADDRESS}/` });
        await testDapp.check_pageIsLoaded();

        const switchEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x539' }],
        });
        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequest})`,
        );

        // Confirm switch ethereum chain
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        if (await confirmTxPage.check_actionNameIsDisplayed('Sending ETH')) {
          await confirmTxPage.rejectTx();
        }
        const reviewPermissionConfirmation = new ReviewPermissionConfirmation(
          driver,
        );
        await reviewPermissionConfirmation.check_pageIsLoaded();
        await reviewPermissionConfirmation.confirmReviewPermissions();

        // Switch to Dapp One and check chainId
        await driver.switchToWindowWithUrl(DAPP_HOST_ADDRESS);
        await driver.waitForUrl({
          url: `${DAPP_HOST_ADDRESS}/`,
        });
        await testDapp.check_pageIsLoaded();
        await testDapp.check_currentConnectedChainId('0x539');

        // Switch to Dapp Two and check chainId
        await driver.switchToWindowWithUrl(DAPP_TWO_URL);
        await driver.waitForUrl({ url: `${DAPP_TWO_URL}/` });
        await testDapp.check_pageIsLoaded();
        await testDapp.check_currentConnectedChainId('0x539');
      },
    );
  });

  it('queues send tx after switchEthereum request with a warning, confirming removes pending tx', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleGanache()
          .build(),
        dappOptions: { numberOfDapps: 2 },
        ganacheOptions: {
          ...defaultGanacheOptions,
          concurrent: [{ port: 8546, chainId: 1338 }],
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver, ganacheServer }) => {
        await loginWithBalanceValidation(driver, ganacheServer);

        // Go to experimental settings page and toggle off request queue setting (on by default now)
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.check_pageIsLoaded();
        await settingsPage.goToExperimentalSettings();

        const experimentalSettings = new ExperimentalSettings(driver);
        await experimentalSettings.check_pageIsLoaded();
        await experimentalSettings.toggleRequestQueue();

        // Open two dapps and connect account to dapp one
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage({ url: DAPP_TWO_URL });
        await testDapp.check_pageIsLoaded();
        await testDapp.openTestDappPage({ url: DAPP_HOST_ADDRESS });
        await testDapp.check_pageIsLoaded();
        await testDapp.connectAccount(ACCOUNT_1, DAPP_HOST_ADDRESS);

        // Switch to Dapp Two and disconnect Localhost 8545
        await driver.switchToWindowWithUrl(DAPP_TWO_URL);
        await driver.waitForUrl({ url: `${DAPP_TWO_URL}/` });
        await testDapp.check_pageIsLoaded();
        await testDapp.clickConnectButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const connectConfirmation = new ConnectConfirmation(driver);
        await connectConfirmation.check_pageIsLoaded();
        await connectConfirmation.editNetworkAndConfirmConnect(
          'Localhost 8545',
        );

        // Initiate switch ethereum chain request on Dapp Two
        await driver.switchToWindowWithUrl(DAPP_TWO_URL);
        await driver.waitForUrl({ url: `${DAPP_TWO_URL}/` });
        await testDapp.check_pageIsLoaded();

        const switchEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x539' }],
        });
        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequest})`,
        );
        await driver.delay(2000);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const reviewPermissionConfirmation = new ReviewPermissionConfirmation(
          driver,
        );
        await reviewPermissionConfirmation.check_pageIsLoaded();

        // Switch back to dapp one and initiate send tx on dapp one
        await driver.switchToWindowWithUrl(DAPP_HOST_ADDRESS);
        await driver.waitForUrl({ url: `${DAPP_HOST_ADDRESS}/` });
        await testDapp.check_pageIsLoaded();
        await testDapp.clickSimpleSendButton();
        await driver.delay(1000);

        // Switch to notification that should still be switchEthereumChain request but with a warning
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await reviewPermissionConfirmation.check_pageIsLoaded();
        /*          THIS IS BROKEN, see https://github.com/MetaMask/metamask-extension/issues/11206
         await driver.findElement({
           span: 'span',
           text: 'Switching networks will cancel all pending confirmations',
         }); */

        // Confirm switchEthereumChain with queued pending tx and check no pending tx is displayed
        await reviewPermissionConfirmation.confirmReviewPermissions();
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await experimentalSettings.check_pageIsLoaded();
        await settingsPage.closeSettingsPage();
        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();
        await homePage.goToActivityList();
        await new ActivityListPage(driver).check_noTxInActivity();
      },
    );
  });

  it('queues send tx after switchEthereum request with a warning, if switch ethereum request is cancelled should show pending tx', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleGanache()
          .build(),
        dappOptions: { numberOfDapps: 2 },
        ganacheOptions: {
          ...defaultGanacheOptions,
          concurrent: [{ port: 8546, chainId: 1338 }],
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver, ganacheServer }) => {
        await loginWithBalanceValidation(driver, ganacheServer);

        // Go to experimental settings page and toggle off request queue setting (on by default now)
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.check_pageIsLoaded();
        await settingsPage.goToExperimentalSettings();

        const experimentalSettings = new ExperimentalSettings(driver);
        await experimentalSettings.check_pageIsLoaded();
        await experimentalSettings.toggleRequestQueue();

        // Open two dapps and connect account to dapp one
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage({ url: DAPP_TWO_URL });
        await testDapp.check_pageIsLoaded();
        await testDapp.openTestDappPage({ url: DAPP_HOST_ADDRESS });
        await testDapp.check_pageIsLoaded();
        await testDapp.connectAccount(ACCOUNT_1, DAPP_HOST_ADDRESS);

        // Switch to Dapp Two and disconnect Localhost 8545
        await driver.switchToWindowWithUrl(DAPP_TWO_URL);
        await driver.waitForUrl({ url: `${DAPP_TWO_URL}/` });
        await testDapp.check_pageIsLoaded();
        await testDapp.clickConnectButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const connectConfirmation = new ConnectConfirmation(driver);
        await connectConfirmation.check_pageIsLoaded();
        await connectConfirmation.editNetworkAndConfirmConnect(
          'Localhost 8545',
        );

        // Switch back to dapp two and initiate switch ethereum chain request
        await driver.switchToWindowWithUrl(DAPP_TWO_URL);
        await driver.waitForUrl({ url: `${DAPP_TWO_URL}/` });
        await testDapp.check_pageIsLoaded();

        const switchEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x539' }],
        });
        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequest})`,
        );
        await driver.delay(2000);

        // Switch to notification of switchEthereumChain
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const reviewPermissionConfirmation = new ReviewPermissionConfirmation(
          driver,
        );
        await reviewPermissionConfirmation.check_pageIsLoaded();

        // Switch back to dapp one and initiate send tx on dapp one
        await driver.switchToWindowWithUrl(DAPP_HOST_ADDRESS);
        await driver.waitForUrl({ url: `${DAPP_HOST_ADDRESS}/` });
        await testDapp.check_pageIsLoaded();
        await testDapp.clickSimpleSendButton();

        // Switch to notification that should still be switchEthereumChain request but with a warning.
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await reviewPermissionConfirmation.check_pageIsLoaded();
        /*          THIS IS BROKEN, see https://github.com/MetaMask/metamask-extension/issues/11206
         await driver.findElement({
           span: 'span',
           text: 'Switching networks will cancel all pending confirmations',
         }); */

        // Cancel switchEthereumChain with queued pending tx and switch window to confirm tx in notification
        await reviewPermissionConfirmation.cancelReviewPermissions();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const confirmTxPage = new ConfirmTxPage(driver);
        await confirmTxPage.check_pageIsLoaded('0.00021');
        await confirmTxPage.clickConfirmButton();
      },
    );
  });
});
