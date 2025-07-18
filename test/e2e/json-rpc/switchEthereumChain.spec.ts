import { strict as assert } from 'assert';
import {
  withFixtures,
  DAPP_URL,
  DAPP_ONE_URL,
  WINDOW_TITLES,
} from '../helpers';
import FixtureBuilder from '../fixture-builder';
import { DEFAULT_FIXTURE_ACCOUNT } from '../constants';
import AdvancedSettings from '../page-objects/pages/settings/advanced-settings';
import Confirmation from '../page-objects/pages/confirmations/redesign/confirmation';
import ConnectAccountConfirmation from '../page-objects/pages/confirmations/redesign/connect-account-confirmation';
import HeaderNavbar from '../page-objects/pages/header-navbar';
import NetworkPermissionSelectModal from '../page-objects/pages/dialog/network-permission-select-modal';
import ReviewPermissionsConfirmation from '../page-objects/pages/confirmations/redesign/review-permissions-confirmation';
import SettingsPage from '../page-objects/pages/settings/settings-page';
import TestDapp from '../page-objects/pages/test-dapp';
import TransactionConfirmation from '../page-objects/pages/confirmations/redesign/transaction-confirmation';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';

describe('Switch Ethereum Chain for two dapps', function () {
  it('switches the chainId of two dapps when switchEthereumChain of one dapp is confirmed', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleNode()
          .build(),
        dappOptions: { numberOfDapps: 2 },
        localNodeOptions: [
          {
            type: 'anvil',
          },
          {
            type: 'anvil',
            options: {
              blockTime: 2,
              vmErrorsOnRPCResponse: false,
              mnemonic:
                'phrase upgrade clock rough situate wedding elder clever doctor stamp excess tent',
              port: 8546,
              chainId: 1338,
            },
          },
        ],
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        // open two dapps
        const dappOne = new TestDapp(driver);
        await dappOne.openTestDappPage({ url: DAPP_URL });
        await dappOne.check_pageIsLoaded();
        const dappTwo = new TestDapp(driver);
        await dappTwo.openTestDappPage({ url: DAPP_ONE_URL });
        await dappTwo.check_pageIsLoaded();

        // switchEthereumChain request
        const switchEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x53a' }],
        });

        // Initiate switchEthereumChain on Dapp Two
        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequest})`,
        );

        // Confirm switchEthereumChain
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const reviewPermissionsConfirmation = new ReviewPermissionsConfirmation(
          driver,
        );
        await reviewPermissionsConfirmation.check_pageIsLoaded();
        await reviewPermissionsConfirmation.confirmReviewPermissions();

        // Switch to Dapp One
        await driver.switchToWindowWithUrl(DAPP_URL);
        await dappOne.check_pageIsLoaded();
        assert.equal(await driver.getCurrentUrl(), `${DAPP_URL}/`);

        // Dapp One ChainId assertion
        await dappOne.check_networkIsConnected('0x53a');

        // Switch to Dapp Two
        await driver.switchToWindowWithUrl(DAPP_ONE_URL);
        await dappTwo.check_pageIsLoaded();
        assert.equal(await driver.getCurrentUrl(), `${DAPP_ONE_URL}/`);

        // Dapp Two ChainId Assertion
        await dappTwo.check_networkIsConnected('0x53a');
      },
    );
  });

  it('queues switchEthereumChain request from second dapp after send tx request', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleNode()
          .build(),
        dappOptions: { numberOfDapps: 2 },
        localNodeOptions: [
          {
            type: 'anvil',
          },
          {
            type: 'anvil',
            options: {
              blockTime: 2,
              vmErrorsOnRPCResponse: false,
              mnemonic:
                'phrase upgrade clock rough situate wedding elder clever doctor stamp excess tent',
              port: 8546,
              chainId: 1338,
            },
          },
        ],
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        // disable smart transactions step by step
        // we cannot use fixtures because migration 135 overrides the opt in value to true
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_pageIsLoaded();
        await headerNavbar.openSettingsPage();

        const settingsPage = new SettingsPage(driver);
        await settingsPage.check_pageIsLoaded();
        await settingsPage.clickAdvancedTab();
        const advancedSettingsPage = new AdvancedSettings(driver);
        await advancedSettingsPage.check_pageIsLoaded();
        await advancedSettingsPage.toggleSmartTransactions();
        await settingsPage.closeSettingsPage();

        // open two dapps
        const dappOne = new TestDapp(driver);
        await dappOne.openTestDappPage({ url: DAPP_URL });
        await dappOne.check_pageIsLoaded();
        const dappTwo = new TestDapp(driver);
        await dappTwo.openTestDappPage({ url: DAPP_ONE_URL });
        await dappTwo.check_pageIsLoaded();

        // Connect Dapp Two
        await dappTwo.clickConnectAccountButton();
        await dappTwo.confirmConnectAccountModal();
        await driver.switchToWindowWithUrl(DAPP_ONE_URL);
        await dappTwo.check_pageIsLoaded();
        await dappTwo.check_connectedAccounts(DEFAULT_FIXTURE_ACCOUNT);
        await dappTwo.check_networkIsConnected('0x539');

        // Switch to Dapp One and connect it
        await driver.switchToWindowWithUrl(DAPP_URL);
        await dappOne.check_pageIsLoaded();
        await dappOne.clickConnectAccountButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const connectAccountConfirmation = new ConnectAccountConfirmation(
          driver,
        );
        await connectAccountConfirmation.check_pageIsLoaded();
        await connectAccountConfirmation.goToPermissionsTab();
        await connectAccountConfirmation.openEditNetworksModal();

        // Disconnect Localhost 8545 and connect to Dapp One
        const networkPermissionSelectModal = new NetworkPermissionSelectModal(
          driver,
        );
        await networkPermissionSelectModal.check_pageIsLoaded();
        await networkPermissionSelectModal.selectNetwork({
          networkName: 'Localhost 8545',
          shouldBeSelected: false,
        });
        await networkPermissionSelectModal.clickConfirmEditButton();
        await connectAccountConfirmation.check_pageIsLoaded();
        await connectAccountConfirmation.confirmConnect();

        // Switch to Dapp Two
        await driver.switchToWindowWithUrl(DAPP_ONE_URL);
        await dappTwo.check_pageIsLoaded();
        // Initiate send transaction on Dapp two
        await dappTwo.clickSimpleSendButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const confirmation = new Confirmation(driver);
        await confirmation.check_pageIsLoaded();

        // Switch to Dapp One
        await driver.switchToWindowWithUrl(DAPP_URL);
        await dappOne.check_pageIsLoaded();

        // Switch Ethereum chain request
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
        await confirmation.check_pageIsLoaded();
        await confirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();

        // Switch and confirm to queued notification for switchEthereumChain
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const reviewPermissionsConfirmation = new ReviewPermissionsConfirmation(
          driver,
        );
        await reviewPermissionsConfirmation.check_pageIsLoaded();
        await reviewPermissionsConfirmation.confirmReviewPermissions();

        await driver.switchToWindowWithUrl(DAPP_URL);
        await dappOne.check_pageIsLoaded();
        await dappOne.check_networkIsConnected('0x539');
      },
    );
  });

  it('queues send tx after switchEthereum request with a warning, if switchEthereum request is cancelled should show pending tx', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleNode()
          .build(),
        dappOptions: { numberOfDapps: 2 },
        localNodeOptions: [
          {
            type: 'anvil',
          },
          {
            type: 'anvil',
            options: {
              blockTime: 2,
              vmErrorsOnRPCResponse: false,
              mnemonic:
                'phrase upgrade clock rough situate wedding elder clever doctor stamp excess tent',
              port: 8546,
              chainId: 1338,
            },
          },
        ],
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        // open two dapps
        const dappTwo = new TestDapp(driver);
        await dappTwo.openTestDappPage({ url: DAPP_ONE_URL });
        await dappTwo.check_pageIsLoaded();
        const dappOne = new TestDapp(driver);
        await dappOne.openTestDappPage({ url: DAPP_URL });
        await dappOne.check_pageIsLoaded();

        // Connect Dapp One
        await dappOne.clickConnectAccountButton();
        await dappOne.confirmConnectAccountModal();

        // Switch and connect Dapp Two
        await driver.switchToWindowWithUrl(DAPP_ONE_URL);
        assert.equal(await driver.getCurrentUrl(), `${DAPP_ONE_URL}/`);

        await dappTwo.check_pageIsLoaded();
        await dappTwo.clickConnectAccountButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const connectAccountConfirmation = new ConnectAccountConfirmation(
          driver,
        );
        await connectAccountConfirmation.check_pageIsLoaded();

        // Click the edit button for networks and disconnect Localhost 8545
        await connectAccountConfirmation.goToPermissionsTab();
        await connectAccountConfirmation.openEditNetworksModal();

        const networkPermissionSelectModal = new NetworkPermissionSelectModal(
          driver,
        );
        await networkPermissionSelectModal.check_pageIsLoaded();
        await networkPermissionSelectModal.selectNetwork({
          networkName: 'Localhost 8545',
          shouldBeSelected: false,
        });
        await networkPermissionSelectModal.clickConfirmEditButton();
        await connectAccountConfirmation.check_pageIsLoaded();
        await connectAccountConfirmation.confirmConnect();

        await driver.switchToWindowWithUrl(DAPP_ONE_URL);
        assert.equal(await driver.getCurrentUrl(), `${DAPP_ONE_URL}/`);
        await dappTwo.check_pageIsLoaded();

        // switchEthereumChain request
        const switchEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x539' }],
        });

        // Initiate switchEthereumChain on Dapp Two
        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequest})`,
        );

        // Switch to notification of switchEthereumChain
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const reviewPermissionsConfirmation = new ReviewPermissionsConfirmation(
          driver,
        );
        await reviewPermissionsConfirmation.check_pageIsLoaded();

        // Switch back to dapp one
        await driver.switchToWindowWithUrl(DAPP_URL);
        assert.equal(await driver.getCurrentUrl(), `${DAPP_URL}/`);
        await dappOne.check_pageIsLoaded();

        // Initiate send tx on dapp one
        await dappOne.clickSimpleSendButton();

        // Switch to notification that should still be switchEthereumChain request but with an warning.
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // Cancel switchEthereumChain with queued pending tx
        await reviewPermissionsConfirmation.check_pageIsLoaded();
        await reviewPermissionsConfirmation.clickCancelReviewPermissionsButton();

        // Switch to new pending tx notification
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.check_pageIsLoaded();
        await transactionConfirmation.check_dappInitiatedHeadingTitle();
        await transactionConfirmation.check_sendAmount('0 ETH');

        // Confirm pending tx
        await transactionConfirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();
      },
    );
  });
});
