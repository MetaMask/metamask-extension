import { Suite } from 'mocha';
import { Driver } from '../../../webdriver/driver';
import { openActivityTransactionDetails } from '../../../page-objects/flows/activity.flow';
import { login } from '../../../page-objects/flows/login.flow';
import {
  selectAllNetworksFromNetworkSelect,
  switchToNetworkFromNetworkSelect,
} from '../../../page-objects/flows/network.flow';
import { selectStellarNetwork } from '../../../page-objects/flows/stellar-network.flow';
import ActivityTab from '../../../page-objects/pages/home/activity-tab';
import HomePage from '../../../page-objects/pages/home/homepage';
import { withStellarFixtures } from '../../stellar/fixtures/with-stellar-fixtures';
import {
  STELLAR_ACCOUNT_ADDRESS,
  STELLAR_NETWORK_NAME,
  buildStellarFixture,
} from '../../stellar/mocks/common-stellar';
import {
  STELLAR_EXTERNAL_SENDER_ADDRESS,
  STELLAR_RECIPIENT_ADDRESS,
  stellarBridgeHistoryItem,
  xlmReceiveTx,
  xlmSendTx,
  xlmSwapTx,
} from '../../stellar/mocks/stellar-tx-fixtures';
import { mockEvmActivityApi } from '../utils/mock-evm-activity-api';

const BASE_TIMESTAMP = Date.now();

/**
 * Closes transaction details without relying on history.back() clearing `/tx/`
 * (Stellar CAIP chain ids in the hash make that wait flaky). Re-open Activity.
 *
 * @param driver - WebDriver instance.
 * @param activityTab - Activity tab page object.
 */
async function closeDetailsAndReturnToActivity(
  driver: Driver,
  activityTab: ActivityTab,
): Promise<void> {
  await driver.clickElementSafe(
    { testId: 'transaction-details-back-button' },
    1_000,
  );
  await driver.clickElement({ testId: 'bottom-nav-activity' });
  await activityTab.checkPageIsLoaded();
}

describe('Stellar - Activity types', function (this: Suite) {
  this.timeout(180_000);

  it('renders sent, received, swapped and bridged transactions', async function () {
    // Staggered timestamps keep the activity list ordering deterministic.
    const sendTx = xlmSendTx({
      amount: '1',
      destination: STELLAR_RECIPIENT_ADDRESS,
      status: 'confirmed',
      timestamp: BASE_TIMESTAMP - 120_000,
    });
    const receiveTx = xlmReceiveTx({
      amount: '2.5',
      from: STELLAR_EXTERNAL_SENDER_ADDRESS,
      timestamp: BASE_TIMESTAMP - 180_000,
    });
    const swapTx = xlmSwapTx({
      sendAmount: '1',
      destMin: '2.5',
      timestamp: BASE_TIMESTAMP - 240_000,
    });
    const bridgeTx = xlmSendTx({
      amount: '1.5',
      destination: STELLAR_RECIPIENT_ADDRESS,
      status: 'confirmed',
      timestamp: BASE_TIMESTAMP - 300_000,
    });
    const bridgeHistory = stellarBridgeHistoryItem({
      txHash: bridgeTx.hash,
      srcAmount: '1.5',
      destAmount: '1.49',
      timestamp: BASE_TIMESTAMP - 300_000,
    });

    await withStellarFixtures(
      {
        accounts: [
          {
            address: STELLAR_ACCOUNT_ADDRESS,
            horizonTransactions: [sendTx, receiveTx, swapTx, bridgeTx],
          },
        ],
        fixtures: buildStellarFixture()
          .withBridgeStatusController({
            txHistory: { [bridgeTx.hash]: bridgeHistory },
          })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, {
          validateBalance: false,
          waitForNonEvmAccounts: false,
        });
        await selectStellarNetwork(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.goToActivityList();
        const activityTab = new ActivityTab(driver);
        await activityTab.checkPageIsLoaded();

        // Sent
        await activityTab.checkTransactionActivityByText('Sent XLM');
        await activityTab.checkTransactionAmount('-1 XLM');
        const sendDetails = await openActivityTransactionDetails({
          driver,
          activityTab,
          activityText: 'Sent XLM',
        });
        await sendDetails.checkTitle('Sent XLM');
        await sendDetails.checkAmount('-1 XLM');
        await sendDetails.checkAddressInLog(STELLAR_RECIPIENT_ADDRESS);
        await sendDetails.checkAddressInLog(STELLAR_ACCOUNT_ADDRESS);
        await closeDetailsAndReturnToActivity(driver, activityTab);

        // Received
        await activityTab.checkTransactionActivityByText('Received XLM');
        await activityTab.checkTransactionAmount('+2.5 XLM');

        // Swapped
        await activityTab.checkTransactionActivityByText('Swapped');
        await activityTab.checkTransactionAmount('+2.5 USDC');
        const swapDetails = await openActivityTransactionDetails({
          driver,
          activityTab,
          activityText: 'Swapped',
        });
        await swapDetails.checkTitle('Swapped');
        await swapDetails.checkAmount('-1 XLM');
        await swapDetails.checkAmount('+2.5 USDC');
        await closeDetailsAndReturnToActivity(driver, activityTab);

        // Bridged (reclassified from the seeded BridgeStatusController history)
        await activityTab.checkTransactionActivityByText('Bridged XLM');
        await activityTab.checkTransactionAmount('+1.49 USDC');
        const bridgeDetails = await openActivityTransactionDetails({
          driver,
          activityTab,
          activityText: 'Bridged XLM',
        });
        await bridgeDetails.checkTitle('Bridged XLM');
        await bridgeDetails.checkAmount('-1.5 XLM');
        await bridgeDetails.checkAmount('+1.49 USDC');
        await closeDetailsAndReturnToActivity(driver, activityTab);
      },
    );
  });

  it('hides EVM activity under the Stellar-only filter and shows it under all networks', async function () {
    const sendTx = xlmSendTx({
      amount: '1',
      destination: STELLAR_RECIPIENT_ADDRESS,
      status: 'confirmed',
      timestamp: BASE_TIMESTAMP - 60_000,
    });

    await withStellarFixtures(
      {
        accounts: [
          {
            address: STELLAR_ACCOUNT_ADDRESS,
            horizonTransactions: [sendTx],
          },
        ],
        fixtures: buildStellarFixture().build(),
        testSpecificMock: mockEvmActivityApi,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, {
          validateBalance: false,
          waitForNonEvmAccounts: false,
        });
        await selectStellarNetwork(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.goToActivityList();
        const activityTab = new ActivityTab(driver);
        await activityTab.checkPageIsLoaded();

        await activityTab.checkTransactionActivityByText('Sent XLM');
        await activityTab.checkTransactionActivityNotPresentByText('Sent ETH');

        await selectAllNetworksFromNetworkSelect(driver);
        await activityTab.checkTransactionActivityByText('Sent ETH');
        await activityTab.checkTransactionAmount('-1 ETH');

        // Restore the Stellar-only filter so the EVM send is hidden again.
        await switchToNetworkFromNetworkSelect(driver, STELLAR_NETWORK_NAME);
        await activityTab.checkTransactionActivityNotPresentByText('Sent ETH');
      },
    );
  });
});
