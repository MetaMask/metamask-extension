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
import { Driver } from '../../webdriver/driver';
import { buildBtcUnifiedAssetsFixtures } from '../btc/btc-unified-assets-fixture';
import {
  mockExchangeRates,
  mockCurrencyExchangeRates,
  mockFiatExchangeRates,
  mockInitialFullScan,
  mockBtcSpotPrices,
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
    mockBtcSpotPrices(mockServer),
    await mockTokensV2SupportedNetworks(mockServer),
    mockTokensV3Assets(mockServer),
  ];
}

async function switchToBitcoinAndAssertBalance(driver: Driver) {
  const homePage = new HomePage(driver);
  const tokensTab = new TokensTab(driver);
  await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Bitcoin');
  await homePage.checkPageIsLoaded();
  await tokensTab.checkNetworkFilterText('Bitcoin');
  await tokensTab.checkExpectedTokenBalanceIsDisplayed(
    `${DEFAULT_BTC_BALANCE}`,
    'BTC',
  );
}

describe('BTC Account - Send', function (this: Suite) {
  const recipientAddress = 'bc1qsqvczpxkgvp3lw230p7jffuuqnw9pp4j5tawmf';
  const bitcoinChainId = 'bip122:000000000019d6689c085ae165831e93';

  it('fields validation', async function () {
    await withFixtures(
      {
        fixtures: buildBtcUnifiedAssetsFixtures(),
        title: this.test?.fullTitle(),
        dappOptions: { numberOfTestDapps: 1 },
        testSpecificMock: mockBtcSendMocks,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToBitcoinAndAssertBalance(driver);

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
        fixtures: buildBtcUnifiedAssetsFixtures(),
        title: this.test?.fullTitle(),
        dappOptions: { numberOfTestDapps: 1 },
        testSpecificMock: mockBtcSendMocks,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToBitcoinAndAssertBalance(driver);

        const sendPage = new SendPage(driver);
        await homePage.startSendFlow();
        await sendPage.selectToken(bitcoinChainId, 'BTC');

        await sendPage.fillRecipient({
          recipientAddress,
          validAddress: true,
        });

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
        fixtures: buildBtcUnifiedAssetsFixtures(),
        title: this.test?.fullTitle(),
        dappOptions: { numberOfTestDapps: 1 },
        testSpecificMock: mockBtcSendMocks,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToBitcoinAndAssertBalance(driver);

        const sendPage = new SendPage(driver);
        const activityTab = new ActivityTab(driver);

        await homePage.startSendFlow();

        await sendPage.selectToken(bitcoinChainId, 'BTC');
        await sendPage.fillRecipient({
          recipientAddress,
          validAddress: true,
        });
        await sendPage.fillAmount(sendAmount);
        await sendPage.isContinueButtonEnabled();
        await sendPage.pressContinueButton();

        const bitcoinReviewTxPage = new BitcoinReviewTxPage(driver);
        await bitcoinReviewTxPage.checkPageIsLoaded();
        await bitcoinReviewTxPage.checkNetworkFeeIsDisplayed(expectedFee);
        await bitcoinReviewTxPage.checkTotalAmountIsDisplayed(expectedTotal);
        await bitcoinReviewTxPage.clickConfirmButton();

        await activityTab.checkTransactionActivityByText('Sending');
        await activityTab.checkWaitForTransactionStatus('pending');
      },
    );
  });
});
