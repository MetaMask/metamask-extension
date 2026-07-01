import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { DEFAULT_BTC_BALANCE } from '../../constants';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import ActivityTab from '../../page-objects/pages/home/activity-tab';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import HomePage from '../../page-objects/pages/home/homepage';
import BitcoinReviewTxPage from '../../page-objects/pages/send/bitcoin-review-tx-page';
import SendPage from '../../page-objects/pages/send/send-page';
import {
  mockAccountsApiV2WithBtc,
  mockAccountsApiV5WithBtc,
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
import { buildBtcUnifiedAssetsFixtures } from '../btc/btc-assets-fixture';

async function mockBtcSendMocks(mockServer: Mockttp) {
  return [
    await mockAccountsApiV2WithBtc(mockServer),
    await mockAccountsApiV5WithBtc(mockServer),
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
  const fixtureOptions = {
    fixtures: buildBtcUnifiedAssetsFixtures(),
    localNodeOptions: [{ type: 'none' as const }],
  };

  it('fields validation', async function () {
    await withFixtures(
      {
        ...fixtureOptions,
        title: this.test?.fullTitle(),
        dappOptions: { numberOfTestDapps: 1 },
        testSpecificMock: mockBtcSendMocks,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Bitcoin');
        // Refresh re-hydrates the UI from background state so the asynchronously-fetched Snap balance is shown reliably.
        await driver.refresh();
        await new TokensTab(driver).checkExpectedTokenBalanceIsDisplayed(
          `${DEFAULT_BTC_BALANCE}`,
          'BTC',
        );

        const sendPage = new SendPage(driver);
        await homePage.startSendFlow();
        await sendPage.selectToken(bitcoinChainId, 'BTC');

        await sendPage.fillRecipient({
          recipientAddress: 'invalidBTCAddress',
          validAddress: false,
        });
        await sendPage.checkInvalidAddressError();
      },
    );
  });

  it('amount validation', async function () {
    await withFixtures(
      {
        ...fixtureOptions,
        title: this.test?.fullTitle(),
        dappOptions: { numberOfTestDapps: 1 },
        testSpecificMock: mockBtcSendMocks,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Bitcoin');
        // Refresh re-hydrates the UI from background state so the asynchronously-fetched Snap balance is shown reliably.
        await driver.refresh();
        await new TokensTab(driver).checkExpectedTokenBalanceIsDisplayed(
          `${DEFAULT_BTC_BALANCE}`,
          'BTC',
        );

        const sendPage = new SendPage(driver);
        await homePage.startSendFlow();
        await sendPage.selectToken(bitcoinChainId, 'BTC');

        await sendPage.fillRecipient({ recipientAddress });

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
        ...fixtureOptions,
        title: this.test?.fullTitle(),
        dappOptions: { numberOfTestDapps: 1 },
        testSpecificMock: mockBtcSendMocks,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Bitcoin');
        // Refresh re-hydrates the UI from background state so the asynchronously-fetched Snap balance is shown reliably.
        await driver.refresh();
        await new TokensTab(driver).checkExpectedTokenBalanceIsDisplayed(
          `${DEFAULT_BTC_BALANCE}`,
          'BTC',
        );

        const sendPage = new SendPage(driver);
        const activityTab = new ActivityTab(driver);

        await homePage.startSendFlow();

        await sendPage.selectToken(bitcoinChainId, 'BTC');
        await sendPage.fillRecipient({ recipientAddress });
        await sendPage.fillAmount(sendAmount);
        await sendPage.isContinueButtonEnabled();
        await sendPage.pressContinueButton();

        // From here, we have moved to the confirmation screen
        const bitcoinReviewTxPage = new BitcoinReviewTxPage(driver);
        await bitcoinReviewTxPage.checkPageIsLoaded();
        await bitcoinReviewTxPage.checkNetworkFeeIsDisplayed(expectedFee);
        await bitcoinReviewTxPage.checkTotalAmountIsDisplayed(expectedTotal);
        await bitcoinReviewTxPage.clickConfirmButton();

        await homePage.goToActivityList();

        // BTC snap transactions stay pending until confirmed on-chain.
        await activityTab.checkPendingTxNumberDisplayedInActivity(1);
      },
    );
  });
});
