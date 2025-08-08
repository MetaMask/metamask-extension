import { strict as assert } from 'assert';
import {
  withFixtures,
  DAPP_URL,
  DAPP_ONE_URL,
  WINDOW_TITLES,
} from '../helpers';
import FixtureBuilder from '../fixture-builder';
import { DEFAULT_FIXTURE_ACCOUNT } from '../constants';
import Confirmation from '../page-objects/pages/confirmations/redesign/confirmation';
import ConnectAccountConfirmation from '../page-objects/pages/confirmations/redesign/connect-account-confirmation';
import NetworkPermissionSelectModal from '../page-objects/pages/dialog/network-permission-select-modal';
import ReviewPermissionsConfirmation from '../page-objects/pages/confirmations/redesign/review-permissions-confirmation';
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
        await dappOne.checkPageIsLoaded();
        const dappTwo = new TestDapp(driver);
        await dappTwo.openTestDappPage({ url: DAPP_ONE_URL });
        await dappTwo.checkPageIsLoaded();

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
        await reviewPermissionsConfirmation.checkPageIsLoaded();
        await reviewPermissionsConfirmation.confirmReviewPermissions();

        // Switch to Dapp One
        await driver.switchToWindowWithUrl(DAPP_URL);
        await dappOne.checkPageIsLoaded();
        assert.equal(await driver.getCurrentUrl(), `${DAPP_URL}/`);

        // Dapp One ChainId assertion
        await dappOne.checkNetworkIsConnected('0x53a');

        // Switch to Dapp Two
        await driver.switchToWindowWithUrl(DAPP_ONE_URL);
        await dappTwo.checkPageIsLoaded();
        assert.equal(await driver.getCurrentUrl(), `${DAPP_ONE_URL}/`);

        // Dapp Two ChainId Assertion
        await dappTwo.checkNetworkIsConnected('0x53a');
      },
    );
  });

  it('queues switchEthereumChain request from second dapp after send tx request', async function () {
    const { fixtures, manifestFlags } = new FixtureBuilder()
      .withNetworkControllerDoubleNode()
      .withPreferencesControllerSmartTransactionsOptedOut();

    await withFixtures(
      {
        dapp: true,
        fixtures,
        manifestFlags,
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
        await dappOne.checkPageIsLoaded();
        const dappTwo = new TestDapp(driver);
        await dappTwo.openTestDappPage({ url: DAPP_ONE_URL });
        await dappTwo.checkPageIsLoaded();

        // Connect Dapp Two
        await dappTwo.clickConnectAccountButton();
        await dappTwo.confirmConnectAccountModal();
        await driver.switchToWindowWithUrl(DAPP_ONE_URL);
        await dappTwo.checkPageIsLoaded();
        await dappTwo.checkConnectedAccounts(DEFAULT_FIXTURE_ACCOUNT);
        await dappTwo.checkNetworkIsConnected('0x539');

        // Switch to Dapp One and connect it
        await driver.switchToWindowWithUrl(DAPP_URL);
        await dappOne.checkPageIsLoaded();
        await dappOne.clickConnectAccountButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const connectAccountConfirmation = new ConnectAccountConfirmation(
          driver,
        );
        await connectAccountConfirmation.checkPageIsLoaded();
        await connectAccountConfirmation.goToPermissionsTab();
        await connectAccountConfirmation.openEditNetworksModal();

        // Disconnect Localhost 8545 and connect to Dapp One
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

        // Switch to Dapp Two
        await driver.switchToWindowWithUrl(DAPP_ONE_URL);
        await dappTwo.checkPageIsLoaded();
        // Initiate send transaction on Dapp two
        await dappTwo.clickSimpleSendButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const confirmation = new Confirmation(driver);
        await confirmation.checkPageIsLoaded();

        // Switch to Dapp One
        await driver.switchToWindowWithUrl(DAPP_URL);
        await dappOne.checkPageIsLoaded();

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
        await confirmation.checkPageIsLoaded();
        await confirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();

        // Switch and confirm to queued notification for switchEthereumChain
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const reviewPermissionsConfirmation = new ReviewPermissionsConfirmation(
          driver,
        );
        await reviewPermissionsConfirmation.checkPageIsLoaded();
        await reviewPermissionsConfirmation.confirmReviewPermissions();

        await driver.switchToWindowWithUrl(DAPP_URL);
        await dappOne.checkPageIsLoaded();
        await dappOne.checkNetworkIsConnected('0x539');
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
        await dappTwo.checkPageIsLoaded();
        const dappOne = new TestDapp(driver);
        await dappOne.openTestDappPage({ url: DAPP_URL });
        await dappOne.checkPageIsLoaded();

        // Connect Dapp One
        await dappOne.clickConnectAccountButton();
        await dappOne.confirmConnectAccountModal();

        // Switch and connect Dapp Two
        await driver.switchToWindowWithUrl(DAPP_ONE_URL);
        assert.equal(await driver.getCurrentUrl(), `${DAPP_ONE_URL}/`);

        await dappTwo.checkPageIsLoaded();
        await dappTwo.clickConnectAccountButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const connectAccountConfirmation = new ConnectAccountConfirmation(
          driver,
        );
        await connectAccountConfirmation.checkPageIsLoaded();

        // Click the edit button for networks and disconnect Localhost 8545
        await connectAccountConfirmation.goToPermissionsTab();
        await connectAccountConfirmation.openEditNetworksModal();

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

        await driver.switchToWindowWithUrl(DAPP_ONE_URL);
        assert.equal(await driver.getCurrentUrl(), `${DAPP_ONE_URL}/`);
        await dappTwo.checkPageIsLoaded();

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
        await reviewPermissionsConfirmation.checkPageIsLoaded();

        // Switch back to dapp one
        await driver.switchToWindowWithUrl(DAPP_URL);
        assert.equal(await driver.getCurrentUrl(), `${DAPP_URL}/`);
        await dappOne.checkPageIsLoaded();

        // Initiate send tx on dapp one
        await dappOne.clickSimpleSendButton();

        // Switch to notification that should still be switchEthereumChain request but with an warning.
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // Cancel switchEthereumChain with queued pending tx
        await reviewPermissionsConfirmation.checkPageIsLoaded();
        await reviewPermissionsConfirmation.clickCancelReviewPermissionsButton();

        // Switch to new pending tx notification
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.checkPageIsLoaded();
        await transactionConfirmation.checkDappInitiatedHeadingTitle();
        await transactionConfirmation.checkSendAmount('0 ETH');

        // Confirm pending tx
        await transactionConfirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();
      },
    );
  });
});
