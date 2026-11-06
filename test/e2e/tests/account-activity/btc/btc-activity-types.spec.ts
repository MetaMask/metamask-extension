import { Suite } from 'mocha';
import {
  DEFAULT_BTC_ADDRESS,
  DEFAULT_BTC_BALANCE,
  DEFAULT_FIXTURE_ACCOUNT_ID,
} from '../../../constants';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { TxToastNotification } from '../../../page-objects/components/tx-toast-notification';
import { openActivityTransactionDetails } from '../../../page-objects/flows/activity.flow';
import { login } from '../../../page-objects/flows/login.flow';
import {
  selectAllNetworksFromNetworkSelect,
  switchToNetworkFromNetworkSelect,
} from '../../../page-objects/flows/network.flow';
import ActivityTab from '../../../page-objects/pages/home/activity-tab';
import HomePage from '../../../page-objects/pages/home/homepage';
import TokensTab from '../../../page-objects/pages/home/tokens-tab';
import BitcoinReviewTxPage from '../../../page-objects/pages/send/bitcoin-review-tx-page';
import SendPage from '../../../page-objects/pages/send/send-page';
import { withBitcoinFixtures } from '../../btc/fixtures/with-bitcoin-fixtures';
import { mockEvmActivityApi } from '../utils/mock-evm-activity-api';
import {
  bitcoinActivityControllerState,
  bitcoinBridgeHistoryItem,
  bitcoinSendActivityTransaction,
} from './bitcoin-activity-fixtures';

const RECIPIENT_ADDRESS = 'bc1qsqvczpxkgvp3lw230p7jffuuqnw9pp4j5tawmf';
const SEND_AMOUNT = '0.1';
const BRIDGE_TRANSACTION_ID = 'ab'.repeat(32);
const BRIDGE_SOURCE_AMOUNT = '0.25';
const BRIDGE_DESTINATION_AMOUNT = '1.5';

describe('Bitcoin - Activity types', function (this: Suite) {
  this.timeout(180_000);

  it('renders received, sent, and bridged Bitcoin transactions', async function () {
    const bridgeTransaction = bitcoinSendActivityTransaction({
      id: BRIDGE_TRANSACTION_ID,
      account: DEFAULT_FIXTURE_ACCOUNT_ID,
      amount: BRIDGE_SOURCE_AMOUNT,
      recipient: RECIPIENT_ADDRESS,
      status: 'confirmed',
    });
    const bridgeHistory = bitcoinBridgeHistoryItem({
      account: DEFAULT_BTC_ADDRESS,
      transactionId: BRIDGE_TRANSACTION_ID,
      srcAmount: '25000000',
      destAmount: '1500000000000000000',
    });

    await withBitcoinFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withMultichainTransactionsController(
            bitcoinActivityControllerState(
              DEFAULT_FIXTURE_ACCOUNT_ID,
              bridgeTransaction,
            ),
          )
          .withBridgeStatusController({
            txHistory: { [BRIDGE_TRANSACTION_ID]: bridgeHistory },
          })
          .build(),
        title: this.test?.fullTitle(),
        dappOptions: { numberOfTestDapps: 1 },
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToNetworkFromNetworkSelect(driver, 'Bitcoin');
        await homePage.refreshPage();
        await new TokensTab(driver).checkExpectedTokenBalanceIsDisplayed(
          `${DEFAULT_BTC_BALANCE}`,
          'BTC',
        );

        await homePage.goToActivityList();
        const activityTab = new ActivityTab(driver);
        await activityTab.checkPageIsLoaded();

        await activityTab.checkTransactionActivityByText('Received BTC');
        await activityTab.checkTransactionAmount(`+${DEFAULT_BTC_BALANCE} BTC`);
        const receiveDetails = await openActivityTransactionDetails({
          driver,
          activityTab,
          activityText: 'Received BTC',
        });
        await receiveDetails.checkTitle('Received BTC');
        await receiveDetails.checkStatus('Confirmed');
        await receiveDetails.checkAmount(`+${DEFAULT_BTC_BALANCE} BTC`);
        await receiveDetails.checkHashLinkPresent();
        await receiveDetails.checkViewDetailsLink();
        await receiveDetails.clickBackButton();

        await homePage.startSendFlow();
        const sendPage = new SendPage(driver);
        await sendPage.selectToken(
          'bip122:000000000019d6689c085ae165831e93',
          'BTC',
        );
        await sendPage.fillRecipient({
          recipientAddress: RECIPIENT_ADDRESS,
        });
        await sendPage.fillAmount(SEND_AMOUNT);
        await sendPage.checkContinueButton({ state: 'enabled' });
        await sendPage.pressContinueButton();

        const reviewPage = new BitcoinReviewTxPage(driver);
        await reviewPage.checkPageIsLoaded();
        await reviewPage.clickConfirmButton();

        const txToast = new TxToastNotification(driver);
        await txToast.checkTxSubmittedToast();
        await txToast.closeToastNotification();

        await homePage.goToActivityList();
        await activityTab.checkTransactionActivityByText('Sending BTC');
        await activityTab.checkTransactionAmount(`-${SEND_AMOUNT} BTC`);
        const sendDetails = await openActivityTransactionDetails({
          driver,
          activityTab,
          activityText: 'Sending BTC',
        });
        await sendDetails.checkTitle('Sending BTC');
        await sendDetails.checkStatus('Pending');
        await sendDetails.checkAmount(`-${SEND_AMOUNT} BTC`);
        await sendDetails.checkAddressInLog(RECIPIENT_ADDRESS);
        await sendDetails.checkAddressInLog(DEFAULT_BTC_ADDRESS);
        await sendDetails.checkHashLinkPresent();
        await sendDetails.checkViewDetailsLink();
        await sendDetails.clickBackButton();

        await activityTab.checkTransactionActivityByText('Bridged BTC');
        await activityTab.checkTransactionAmount(
          `+${BRIDGE_DESTINATION_AMOUNT} ETH`,
        );
        const bridgeDetails = await openActivityTransactionDetails({
          driver,
          activityTab,
          activityText: 'Bridged BTC',
        });
        await bridgeDetails.checkTitle('Bridged BTC');
        await bridgeDetails.checkAmount(`-${BRIDGE_SOURCE_AMOUNT} BTC`);
        await bridgeDetails.checkAmount(`+${BRIDGE_DESTINATION_AMOUNT} ETH`);
        await bridgeDetails.clickBackButtonIfPresent();
      },
    );
  });

  it('hides EVM activity under the Bitcoin-only filter and shows it under all networks', async function () {
    await withBitcoinFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        localNode: false,
        testSpecificMock: mockEvmActivityApi,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);
        await switchToNetworkFromNetworkSelect(driver, 'Bitcoin');

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.goToActivityList();
        const activityTab = new ActivityTab(driver);
        await activityTab.checkPageIsLoaded();

        await activityTab.checkTransactionActivityByText('Received BTC');
        await activityTab.checkTransactionActivityNotPresentByText('Sent ETH');

        await selectAllNetworksFromNetworkSelect(driver);
        await activityTab.checkTransactionActivityByText('Sent ETH');
        await activityTab.checkTransactionAmount('-1 ETH');

        await switchToNetworkFromNetworkSelect(driver, 'Bitcoin');
        await activityTab.checkTransactionActivityNotPresentByText('Sent ETH');
      },
    );
  });
});
