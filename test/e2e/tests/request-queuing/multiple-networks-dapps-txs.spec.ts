import assert from 'assert';
import { Suite } from 'mocha';
import {
  DAPP_ONE_URL,
  DAPP_URL,
  DEFAULT_FIXTURE_ACCOUNT_ID,
  WINDOW_TITLES,
} from '../../constants';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import ActivityTab from '../../page-objects/pages/home/activity-tab';
import HomePage from '../../page-objects/pages/home/homepage';
import TestDapp from '../../page-objects/pages/test-dapp';
import TransactionConfirmation from '../../page-objects/pages/confirmations/transaction-confirmation';
import { login } from '../../page-objects/flows/login.flow';
import { connectAccountToTestDapp } from '../../page-objects/flows/test-dapp.flow';

const EXTRA_LOCAL_ANVIL_NATIVE_ETH_INFO = {
  aggregators: [],
  decimals: 18,
  image: '',
  name: 'Ethereum',
  symbol: 'ETH',
  type: 'native' as const,
};

describe('Request Queuing for Multiple Dapps and Txs on different networks.', function (this: Suite) {
  it('should be possible to send requests from different dapps on different networks', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 2 },
        fixtures: new FixtureBuilderV2()
          .withEnabledNetworks({
            eip155: {
              '0x53a': true,
            },
          })
          .withNetworkControllerDoubleNode()
          .withSelectedNetworkControllerPerDomain()
          .withPreferencesController({ securityAlertsEnabled: false })
          .withAssetsController({
            assetsBalance: {
              [DEFAULT_FIXTURE_ACCOUNT_ID]: {
                'eip155:1338/slip44:60': { amount: '25' },
              },
            },
            assetsInfo: {
              'eip155:1338/slip44:60': EXTRA_LOCAL_ANVIL_NATIVE_ETH_INFO,
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
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);

        // Open Dapp One
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage({ url: DAPP_URL });
        await testDapp.checkPageIsLoaded();

        // Connect to dapp 1
        await connectAccountToTestDapp(driver);

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Network Selector
        await switchToNetworkFromNetworkSelect(
          driver,
          'Custom',
          'Localhost 8546',
        );

        // TODO: Request Queuing bug when opening both dapps at the same time will have them stuck on the same network, with will be incorrect for one of them.
        // Open Dapp Two
        const testDappTwo = new TestDapp(driver);
        await testDappTwo.openTestDappPage({ url: DAPP_ONE_URL });
        await testDappTwo.checkPageIsLoaded();

        // Connect to dapp 2
        await connectAccountToTestDapp(driver);

        // Dapp one send tx
        await driver.switchToWindowWithUrl(DAPP_URL);
        await testDapp.checkPageIsLoaded();
        await testDapp.clickSimpleSendButton();

        await driver.waitUntilXWindowHandles(4);

        // Dapp two send tx
        await driver.switchToWindowWithUrl(DAPP_ONE_URL);
        await testDappTwo.checkPageIsLoaded();
        await testDappTwo.clickSimpleSendButton();

        // First switch network
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // Wait for confirm tx after switch network confirmation.
        await driver.waitUntilXWindowHandles(4);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // Reject Transaction
        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.checkPageIsLoaded();
        await transactionConfirmation.checkPageNumbers(1, 2);
        await transactionConfirmation.clickFooterCancelButton();

        // TODO: No second confirmation from dapp two will show, have to go back to the extension to see the switch chain & dapp two's tx.
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const homepage = new HomePage(driver);
        await homepage.checkPageIsLoaded();
        await homepage.goToActivityList();

        // Check for unconfirmed transaction in tx list
        const activityTab = new ActivityTab(driver);
        await activityTab.checkPendingTxNumberDisplayedInActivity(1);

        // Pending confirm stays in the dialog popup on Firefox.
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await transactionConfirmation.checkPageIsLoaded();
        await transactionConfirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Check for Confirmed Transaction
        await activityTab.checkConfirmedTxNumberDisplayedInActivity(1);
      },
    );
  });
});
