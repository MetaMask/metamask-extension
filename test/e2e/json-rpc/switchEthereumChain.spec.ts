import { strict as assert } from 'assert';
import {
  DAPP_ONE_URL,
  DAPP_URL,
  DEFAULT_FIXTURE_ACCOUNT,
  SECOND_NODE_NETWORK_CLIENT_ID,
  WINDOW_TITLES,
} from '../constants';
import { withFixtures } from '../helpers';
import FixtureBuilderV2 from '../fixtures/fixture-builder-v2';
import Confirmation from '../page-objects/pages/confirmations/confirmation';
import ConnectAccountConfirmation from '../page-objects/pages/confirmations/connect-account-confirmation';
import ReviewPermissionsConfirmation from '../page-objects/pages/confirmations/review-permissions-confirmation';
import TestDapp from '../page-objects/pages/test-dapp';
import TransactionConfirmation from '../page-objects/pages/confirmations/transaction-confirmation';
import { login } from '../page-objects/flows/login.flow';

describe('Switch Ethereum Chain for two dapps', function () {
  it('switches the chainId of two dapps when switchEthereumChain of one dapp is confirmed', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 2 },
        fixtures: new FixtureBuilderV2()
          .withNetworkControllerDoubleNode()
          .build(),
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
        await login(driver);
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
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withNetworkControllerDoubleNode()
          .withSmartTransactionsOptedOut()
          // Seed Dapp One's connection to chain 1338 only
          .withPermissionControllerConnectedToTestDapp({ chainIds: [1338] })
          .withSelectedNetworkController({
            domains: { [DAPP_URL]: SECOND_NODE_NETWORK_CLIENT_ID },
          })
          .build(),
        dappOptions: { numberOfTestDapps: 2 },
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
        await login(driver);

        // open two dapps
        const dappOne = new TestDapp(driver);
        await dappOne.openTestDappPage({ url: DAPP_URL });
        await dappOne.checkPageIsLoaded();
        const dappTwo = new TestDapp(driver);
        await dappTwo.openTestDappPage({ url: DAPP_ONE_URL });
        await dappTwo.checkPageIsLoaded();

        // Connect Dapp Two
        await dappTwo.clickConnectAccountButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const connectAccountConfirmation = new ConnectAccountConfirmation(
          driver,
        );
        await connectAccountConfirmation.checkPageIsLoaded();
        await connectAccountConfirmation.confirmConnect();
        await driver.switchToWindowWithUrl(DAPP_ONE_URL);
        await dappTwo.checkPageIsLoaded();
        await dappTwo.checkConnectedAccounts(DEFAULT_FIXTURE_ACCOUNT);
        await dappTwo.checkNetworkIsConnected('0x539');

        // Switch to Dapp One, which is seeded with a connection to
        // Localhost 8546 (chain 1338) only
        await driver.switchToWindowWithUrl(DAPP_URL);
        await dappOne.checkPageIsLoaded();
        await dappOne.checkConnectedAccounts(DEFAULT_FIXTURE_ACCOUNT);
        await dappOne.checkNetworkIsConnected('0x53a');

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
        fixtures: new FixtureBuilderV2()
          .withNetworkControllerDoubleNode()
          // Both dapps are seeded: Dapp Two (at DAPP_ONE_URL) with chain
          // 1338 only — so its later switch request to 1337 prompts for
          // review — and Dapp One additionally with chain 1337 through the
          // second, deep-merged call.
          .withPermissionControllerConnectedToTestDapp({
            chainIds: [1338],
            numberOfDapps: 2,
          })
          .withPermissionControllerConnectedToTestDapp({
            chainIds: [1337],
          })
          .withSelectedNetworkController({
            domains: { [DAPP_ONE_URL]: SECOND_NODE_NETWORK_CLIENT_ID },
          })
          .build(),
        dappOptions: { numberOfTestDapps: 2 },
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
        await login(driver);

        // open two dapps
        const dappTwo = new TestDapp(driver);
        await dappTwo.openTestDappPage({ url: DAPP_ONE_URL });
        await dappTwo.checkPageIsLoaded();
        const dappOne = new TestDapp(driver);
        await dappOne.openTestDappPage({ url: DAPP_URL });
        await dappOne.checkPageIsLoaded();

        // Dapp One is seeded with a connection to Localhost 8545 (chain 1337)
        await dappOne.checkConnectedAccounts(DEFAULT_FIXTURE_ACCOUNT);

        // Switch to Dapp Two, which is seeded with a connection to
        // Localhost 8546 (chain 1338) only
        await driver.switchToWindowWithUrl(DAPP_ONE_URL);
        assert.equal(await driver.getCurrentUrl(), `${DAPP_ONE_URL}/`);

        await dappTwo.checkPageIsLoaded();
        await dappTwo.checkConnectedAccounts(DEFAULT_FIXTURE_ACCOUNT);
        await dappTwo.checkNetworkIsConnected('0x53a');

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
