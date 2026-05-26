import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { DEFAULT_BTC_ADDRESS, DEFAULT_BTC_BALANCE } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import BitcoinHomepage from '../../page-objects/pages/home/bitcoin-homepage';
import BitcoinTransactionDetailsPage from '../../page-objects/pages/home/bitcoin-transaction-details';
import SendPage from '../../page-objects/pages/send/send-page';
import BitcoinReviewTxPage from '../../page-objects/pages/send/bitcoin-review-tx-page';
import { Driver } from '../../webdriver/driver';
import {
  mockExchangeRates,
  mockCurrencyExchangeRates,
  mockFiatExchangeRates,
  mockInitialFullScan,
  mockSolanaSpotPrices,
  mockSupportedVsCurrencies,
  mockTokensV2SupportedNetworks,
  mockTokensV3Assets,
} from './mocks';
import { mockPriceMulti, mockPriceMultiBtcAndSol } from './mocks/min-api';
import { BTC_CHAIN_ID } from './mocks/bridge';

async function mockBtcActivityMocks(mockServer: Mockttp) {
  return [
    await mockInitialFullScan(mockServer),
    await mockExchangeRates(mockServer),
    await mockCurrencyExchangeRates(mockServer),
    await mockFiatExchangeRates(mockServer),
    await mockSolanaSpotPrices(mockServer),
    await mockSupportedVsCurrencies(mockServer),
    await mockPriceMulti(mockServer),
    await mockPriceMultiBtcAndSol(mockServer),
    await mockTokensV2SupportedNetworks(mockServer),
    await mockTokensV3Assets(mockServer),
  ];
}

async function landOnBitcoinHomepage(driver: Driver): Promise<BitcoinHomepage> {
  await login(driver);
  const homePage = new BitcoinHomepage(driver);
  await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Bitcoin');
  await homePage.checkPageIsLoaded();
  await homePage.checkIsExpectedBitcoinBalanceDisplayed(DEFAULT_BTC_BALANCE);
  return homePage;
}

async function broadcastBitcoinSend(
  driver: Driver,
  recipient: string,
  amount: string,
): Promise<void> {
  const homePage = await landOnBitcoinHomepage(driver);
  const sendPage = new SendPage(driver);
  await homePage.startSendFlow();
  await sendPage.selectToken(BTC_CHAIN_ID, 'BTC');
  await sendPage.fillRecipient(recipient);
  await sendPage.fillAmount(amount);
  await sendPage.isContinueButtonEnabled();
  await sendPage.pressContinueButton();
  const reviewPage = new BitcoinReviewTxPage(driver);
  await reviewPage.checkPageIsLoaded();
  await reviewPage.clickConfirmButton();
}

describe('BTC Account - Activity', function (this: Suite) {
  const recipientAddress = 'bc1qsqvczpxkgvp3lw230p7jffuuqnw9pp4j5tawmf';
  const sendAmount = '0.5';

  it('Send transaction is rendered with Sent label and pending status', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        dappOptions: { numberOfTestDapps: 1 },
        testSpecificMock: mockBtcActivityMocks,
      },
      async ({ driver }) => {
        await broadcastBitcoinSend(driver, recipientAddress, sendAmount);

        const activity = new ActivityListPage(driver);
        await activity.checkTransactionActivityByText('Sent');
        await activity.checkWaitForTransactionStatus('pending');
        await activity.checkPendingTxNumberDisplayedInActivity(1);
        await activity.checkTxAction({
          action: 'Sent',
          txIndex: 1,
          confirmedTx: 0,
        });
        await activity.checkTransactionAmount(`-${sendAmount} BTC`);
      },
    );
  });

  it('Receive transaction is rendered with Received label and confirmed status', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        dappOptions: { numberOfTestDapps: 1 },
        testSpecificMock: mockBtcActivityMocks,
      },
      async ({ driver }) => {
        const homePage = await landOnBitcoinHomepage(driver);
        await homePage.goToActivityList();

        const activity = new ActivityListPage(driver);
        await activity.checkTransactionActivityByText('Received');
        await activity.checkConfirmedTxNumberDisplayedInActivity(1);
        await activity.checkTxAction({
          action: 'Received',
          txIndex: 1,
          confirmedTx: 1,
        });
        await activity.checkTransactionAmount(`${DEFAULT_BTC_BALANCE} BTC`);
      },
    );
  });

  it('Transaction details show Title / Time / Status / TXID / From / To / Amount / Network fee / View details', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        dappOptions: { numberOfTestDapps: 1 },
        testSpecificMock: mockBtcActivityMocks,
      },
      async ({ driver }) => {
        await broadcastBitcoinSend(driver, recipientAddress, sendAmount);

        const activity = new ActivityListPage(driver);
        await activity.checkTransactionActivityByText('Sent');
        await activity.checkPendingTxNumberDisplayedInActivity(1);
        await activity.clickOnActivity(1);

        const details = new BitcoinTransactionDetailsPage(driver);
        await details.checkPageIsLoaded();
        await details.checkTitle('Send');
        await details.checkTime();
        await details.checkStatus('Pending');
        await details.checkAmount(`-${sendAmount} BTC`);
        await details.checkAddressInLog(recipientAddress);
        await details.checkAddressInLog(DEFAULT_BTC_ADDRESS);
        await details.checkHashLinkPresent();
        await details.checkViewDetailsLink();
      },
    );
  });

  it('Current network filter shows only Bitcoin transactions', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        dappOptions: { numberOfTestDapps: 1 },
        testSpecificMock: mockBtcActivityMocks,
      },
      async ({ driver }) => {
        const homePage = await landOnBitcoinHomepage(driver);
        const assetList = new AssetListPage(driver);
        await assetList.selectOnlyNetworkInFilter('Bitcoin');

        await homePage.goToActivityList();
        const activity = new ActivityListPage(driver);
        await activity.checkTransactionActivityByText('Received');
        await activity.checkConfirmedTxNumberDisplayedInActivity(1);
        await activity.checkTransactionAmount(`${DEFAULT_BTC_BALANCE} BTC`);
      },
    );
  });
});
