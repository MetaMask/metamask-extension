import { Browser } from 'selenium-webdriver';
import {
  DAPP_ONE_URL,
  DAPP_TWO_URL,
  DAPP_URL,
  DEFAULT_FIXTURE_ACCOUNT_ID,
  DEFAULT_LOCAL_NODE_ETH_BALANCE_DEC,
  NETWORK_CLIENT_ID,
  WINDOW_TITLES,
} from '../../constants';
import NetworkManager, {
  NetworkId,
} from '../../page-objects/pages/network-manager';
import { login } from '../../page-objects/flows/login.flow';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures, veryLargeDelayMs } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import TestDapp from '../../page-objects/pages/test-dapp';
import { Anvil } from '../../seeder/anvil';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import Confirmation from '../../page-objects/pages/confirmations/confirmation';
import TransactionConfirmation from '../../page-objects/pages/confirmations/transaction-confirmation';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import {
  openDappAndSwitchChain,
  openPopupWithActiveTabOrigin,
  selectDappClickSend,
  switchToDialogPopoverValidateDetailsRedesign,
} from '../../page-objects/flows/test-dapp.flow';
import { validateBalanceAndActivity } from '../../page-objects/flows/send-transaction.flow';

// Window handle adjustments will need to be made for Non-MV3 Firefox
// due to OffscreenDocument.  Additionally Firefox continually bombs
// with a "NoSuchWindowError: Browsing context has been discarded" whenever
// we try to open a third dapp, so this test run in Firefox will
// validate two dapps instead of 3
const IS_FIREFOX = process.env.SELENIUM_BROWSER === Browser.FIREFOX;

/**
 * Second/third Anvil chains (1338, 1000) are absent from the default fixture's
 * AssetsController. With assets-unify, native gas balance is read from there,
 * so confirmations otherwise show "Insufficient funds" when opening network fees.
 */
const REQUEST_QUEUE_EXTRA_LOCAL_ANVIL_NATIVE_ETH_INFO = {
  aggregators: [],
  decimals: 18,
  image: '',
  name: 'Ethereum',
  symbol: 'ETH',
  type: 'native' as const,
};

const REQUEST_QUEUE_EXTRA_LOCAL_ANVIL_ASSETS_CONTROLLER = {
  assetsBalance: {
    [DEFAULT_FIXTURE_ACCOUNT_ID]: {
      'eip155:1338/slip44:60': { amount: '25' },
      'eip155:1000/slip44:60': { amount: '25' },
    },
  },
  assetsInfo: {
    'eip155:1338/slip44:60': REQUEST_QUEUE_EXTRA_LOCAL_ANVIL_NATIVE_ETH_INFO,
    'eip155:1000/slip44:60': REQUEST_QUEUE_EXTRA_LOCAL_ANVIL_NATIVE_ETH_INFO,
  },
};

describe('Request-queue UI changes', function () {
  this.timeout(500000); // This test is very long, so we need an unusually high timeout

  it('should show network specific to domain', async function () {
    const port = 8546;
    const chainId = 1338; // 0x53a
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
              port,
              chainId,
            },
          },
        ],

        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        // Open the first dapp
        await openDappAndSwitchChain(driver, DAPP_URL, '0x539');

        // Open the second dapp and switch chains
        await openDappAndSwitchChain(driver, DAPP_ONE_URL, '0x53a');

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Open network manager and select custom network
        await new NetworkManager(driver).openNetworkAndSelectNetwork(
          'Custom',
          'Localhost 8546',
        );

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
        fixtures: new FixtureBuilderV2()
          .withNetworkControllerTripleNode()
          .withAssetsController(
            REQUEST_QUEUE_EXTRA_LOCAL_ANVIL_ASSETS_CONTROLLER,
          )
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
        await login(driver);

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
        await transactionConfirmation.clickFooterConfirmButton();
        await driver.waitForWindowWithTitleToBePresent(WINDOW_TITLES.Dialog);

        // Switch to the new Notification window, ensure second transaction showing
        await switchToDialogPopoverValidateDetailsRedesign(driver, {
          chainId: '0x53a',
          networkText: 'Localhost 8546',
          originText: DAPP_ONE_URL,
        });

        // Reject this transaction, wait for second confirmation window to close, third to display
        const confirmation = new Confirmation(driver);
        await confirmation.clickFooterCancelButton();

        if (!IS_FIREFOX) {
          // Switch to the new Notification window, ensure third transaction showing
          await switchToDialogPopoverValidateDetailsRedesign(driver, {
            chainId: '0x3e8',
            networkText: 'Localhost 7777',
            originText: DAPP_TWO_URL,
          });

          // Confirm transaction
          await transactionConfirmation.clickFooterConfirmButton();
        }

        // With first and last confirmations confirmed, and second rejected,
        // Ensure only first and last network balances were affected
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Wait for transaction to be completed on final confirmation
        await driver.waitForWindowWithTitleToBePresent(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        if (!IS_FIREFOX) {
          // Start on the last joined network, whose send transaction was just confirmed
          await new NetworkManager(driver).openNetworkAndSelectNetwork(
            'Custom',
            'Localhost 7777',
          );
          await validateBalanceAndActivity(driver, '25');
        }

        // Validate second network, where transaction was rejected
        await new NetworkManager(driver).openNetworkAndSelectNetwork(
          'Custom',
          'Localhost 8546',
        );
        await validateBalanceAndActivity(driver, '25', 0);

        // Validate first network, where transaction was confirmed
        await new NetworkManager(driver).openNetworkAndSelectNetwork(
          'Custom',
          'Localhost 8545',
        );
        await validateBalanceAndActivity(driver, '25');
      },
    );
  });

  it('should gracefully handle deleted network', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 2 },
        fixtures: new FixtureBuilderV2()
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
        await login(driver);

        // Open the first dapp
        await openDappAndSwitchChain(driver, DAPP_URL, '0x539');

        // Open the second dapp and switch chains
        await openDappAndSwitchChain(driver, DAPP_ONE_URL, '0x1');

        // Go to wallet fullscreen, ensure that the global network changed to Ethereum
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        await new NetworkManager(driver).openNetworkAndSelectNetwork(
          'Popular',
          NetworkId.LINEA,
        );
        await new NetworkManager(driver).openNetworkAndSelectNetwork(
          'Popular',
          NetworkId.ETHEREUM,
        );

        // Open Network Manager and delete custom network
        await new NetworkManager(driver).openNetworkAndDeleteNetwork(
          'Custom',
          CHAIN_IDS.LOCALHOST,
        );

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
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        driverOptions: { constrainWindowSize: true },
      },
      async ({ driver }: { driver: Driver }) => {
        // Navigate to extension home screen
        await login(driver);

        // Open the first dapp which starts on chain '0x539
        await openDappAndSwitchChain(driver, DAPP_URL, '0x539');

        // Ensure the dapp starts on the correct network
        const testDapp = new TestDapp(driver);
        const headerNavbar = new HeaderNavbar(driver);
        await testDapp.checkNetworkIsConnected('0x539');

        // Open the popup with shimmed activeTabOrigin
        await openPopupWithActiveTabOrigin(driver, DAPP_URL);

        // Switch to mainnet using control bar per-dapp network selector
        await headerNavbar.openDappNetworkMenu();
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
        fixtures: new FixtureBuilderV2()
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
        await login(driver);

        // Open the first dapp
        await openDappAndSwitchChain(driver, DAPP_URL, '0x539');

        // Open the second dapp and switch chains
        await openDappAndSwitchChain(driver, DAPP_ONE_URL, '0x1');

        // Go to wallet fullscreen, ensure that the global network changed to Ethereum
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Check if Ethereum is selected
        await new NetworkManager(driver).openNetworkAndSelectNetwork(
          'Popular',
          NetworkId.ETHEREUM,
        );

        // Kill local node servers
        await localNodes[0].quit();
        await localNodes[1].quit();

        // Go back to first dapp, try an action, ensure network connection failure doesn't block UI
        await driver.switchToWindowWithUrl(DAPP_URL);
        const testDapp = new TestDapp(driver);
        await testDapp.clickPersonalSign();
        await driver.waitForWindowWithTitleToBePresent(WINDOW_TITLES.Dialog);

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
        fixtures: new FixtureBuilderV2()
          .withNetworkControllerDoubleNode()
          .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
          .withEnabledNetworks({
            eip155: {
              '0x1': true,
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
        await login(driver, {
          expectedBalance: DEFAULT_LOCAL_NODE_ETH_BALANCE_DEC,
        });

        // Open the first dapp
        await openDappAndSwitchChain(driver, DAPP_URL, '0x539');

        // Open the second dapp and switch chains
        await openDappAndSwitchChain(driver, DAPP_ONE_URL, '0x1');

        // Go to wallet fullscreen, ensure that the global network changed to Ethereum
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Check if Ethereum is selected
        await new NetworkManager(driver).openNetworkAndSelectNetwork(
          'Popular',
          NetworkId.ETHEREUM,
        );

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
