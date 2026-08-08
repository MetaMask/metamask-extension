import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { DEFAULT_BTC_ADDRESS, DEFAULT_BTC_BALANCE } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { broadcastBitcoinSend } from '../../page-objects/flows/bitcoin-send.flow';
import { login } from '../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import ActivityTab from '../../page-objects/pages/home/activity-tab';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import HomePage from '../../page-objects/pages/home/homepage';
import TransactionDetailsPage from '../../page-objects/pages/transaction-details-page';
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

describe('BTC Account - Activity', function (this: Suite) {
  const recipientAddress = 'bc1qsqvczpxkgvp3lw230p7jffuuqnw9pp4j5tawmf';
  const sendAmount = '0.5';

  it('Receive transaction is rendered with Received label and confirmed status', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        dappOptions: { numberOfTestDapps: 1 },
        testSpecificMock: mockBtcActivityMocks,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Bitcoin');
        await homePage.checkPageIsLoaded();
        await homePage.goToActivityList();

        const activity = new ActivityTab(driver);
        await activity.checkTransactionActivityByText('Received BTC');
        await activity.checkConfirmedTxNumberDisplayedInActivity(1);
        await activity.checkTxAction({
          action: 'Received BTC',
          txIndex: 1,
          confirmedTx: 1,
        });
        await activity.checkTransactionAmount(`${DEFAULT_BTC_BALANCE} BTC`);
      },
    );
  });

  it('Transaction details show Title / Time / Status / TXID / From / To / Amount / View details', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        dappOptions: { numberOfTestDapps: 1 },
        testSpecificMock: mockBtcActivityMocks,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Bitcoin');
        await homePage.checkPageIsLoaded();

        await broadcastBitcoinSend({
          driver,
          recipientAddress,
          amount: sendAmount,
        });

        const activity = new ActivityTab(driver);

        // Bug #43641 - Sometimes we land at Home instead of Activity list, so we manually go to the Activity list before checking for the transaction until that is resolved
        await homePage.goToActivityList();
        await activity.checkTransactionActivityByText('Sending BTC');
        await activity.checkPendingTxNumberDisplayedInActivity(1);
        await activity.clickOnActivity(1);

        const details = new TransactionDetailsPage(driver);
        await details.checkPageIsLoaded();
        await details.checkTitle('Sending BTC');
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
        await login(driver);
        const homePage = new HomePage(driver);
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Bitcoin');
        await homePage.checkPageIsLoaded();

        const assetList = new TokensTab(driver);
        await assetList.selectOnlyNetworkInFilter('Bitcoin');

        await homePage.goToActivityList();
        const activity = new ActivityTab(driver);
        await activity.checkTransactionActivityByText('Received BTC');
        await activity.checkConfirmedTxNumberDisplayedInActivity(1);
        await activity.checkTransactionAmount(`${DEFAULT_BTC_BALANCE} BTC`);
      },
    );
  });
});
