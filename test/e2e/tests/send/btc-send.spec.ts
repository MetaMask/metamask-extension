import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { DEFAULT_BTC_BALANCE } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import BitcoinHomepage from '../../page-objects/pages/home/bitcoin-homepage';
import BitcoinReviewTxPage from '../../page-objects/pages/send/bitcoin-review-tx-page';
import SendPage from '../../page-objects/pages/send/send-page';
import {
  mockExchangeRates,
  mockCurrencyExchangeRates,
  mockFiatExchangeRates,
  mockInitialFullScan,
  mockSolanaSpotPrices,
  mockSupportedVsCurrencies,
  mockTokensV3Assets,
  mockTokensV2SupportedNetworks,
} from '../btc/mocks';
import { mockPriceMulti, mockPriceMultiBtcAndSol } from '../btc/mocks/min-api';

async function mockBtcSendMocks(mockServer: Mockttp) {
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

describe('BTC Account - Send', function (this: Suite) {
  const recipientAddress = 'bc1qsqvczpxkgvp3lw230p7jffuuqnw9pp4j5tawmf';
  const bitcoinChainId = 'bip122:000000000019d6689c085ae165831e93';

  it('fields validation', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        dappOptions: { numberOfTestDapps: 1 },
        testSpecificMock: mockBtcSendMocks,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new BitcoinHomepage(driver);
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Bitcoin');
        await homePage.checkPageIsLoaded();
        await homePage.checkIsExpectedBitcoinBalanceDisplayed(
          DEFAULT_BTC_BALANCE,
        );

        const sendPage = new SendPage(driver);
        await homePage.startSendFlow();
        await sendPage.selectToken(bitcoinChainId, 'BTC');

        await sendPage.fillRecipient('invalidBTCAddress');
        await sendPage.checkInvalidAddressError();
      },
    );
  });

  it('amount validation', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        dappOptions: { numberOfTestDapps: 1 },
        testSpecificMock: mockBtcSendMocks,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new BitcoinHomepage(driver);
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Bitcoin');
        await homePage.checkPageIsLoaded();
        await homePage.checkIsExpectedBitcoinBalanceDisplayed(
          DEFAULT_BTC_BALANCE,
        );

        const sendPage = new SendPage(driver);
        await homePage.startSendFlow();
        await sendPage.selectToken(bitcoinChainId, 'BTC');

        await sendPage.fillRecipient(recipientAddress);

        await sendPage.fillAmount('5');
        await sendPage.checkInsufficientFundsError();
      },
    );
  });

  it('can complete the send flow', async function () {
    const sendAmount = '0.5';
    const expectedFee = '0.00000281';
    const expectedTotal = '53381.50';

    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        dappOptions: { numberOfTestDapps: 1 },
        testSpecificMock: mockBtcSendMocks,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new BitcoinHomepage(driver);
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Bitcoin');
        await homePage.checkPageIsLoaded();
        await homePage.checkIsExpectedBitcoinBalanceDisplayed(
          DEFAULT_BTC_BALANCE,
        );

        const sendPage = new SendPage(driver);
        const activityListPage = new ActivityListPage(driver);

        await homePage.startSendFlow();

        await sendPage.selectToken(bitcoinChainId, 'BTC');
        await sendPage.fillRecipient(recipientAddress);
        await sendPage.fillAmount(sendAmount);
        await sendPage.isContinueButtonEnabled();
        await sendPage.pressContinueButton();

        // From here, we have moved to the confirmation screen
        const bitcoinReviewTxPage = new BitcoinReviewTxPage(driver);
        await bitcoinReviewTxPage.checkPageIsLoaded();
        await bitcoinReviewTxPage.checkNetworkFeeIsDisplayed(expectedFee);
        await bitcoinReviewTxPage.checkTotalAmountIsDisplayed(expectedTotal);
        await bitcoinReviewTxPage.clickConfirmButton();

        // Wait for the transaction to appear in the activity list
        await activityListPage.checkTransactionActivityByText('Sent');

        // Note: Transaction shows as "Pending" immediately after broadcast.
        // The BTC snap stores it with "Unconfirmed" status when broadcast.
        await activityListPage.checkWaitForTransactionStatus('pending');
      },
    );
  });
});
