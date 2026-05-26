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
import { Driver } from '../../webdriver/driver';
import {
  mockCurrencyExchangeRates,
  mockExchangeRates,
  mockFiatExchangeRates,
  mockInitialFullScan,
  mockSolanaSpotPrices,
  mockSupportedVsCurrencies,
  mockTokensV2SupportedNetworks,
  mockTokensV3Assets,
} from './mocks';
import { BTC_CHAIN_ID } from './mocks/bridge';
import { mockPriceMulti, mockPriceMultiBtcAndSol } from './mocks/min-api';

const RECIPIENT_ADDRESS = 'bc1qsqvczpxkgvp3lw230p7jffuuqnw9pp4j5tawmf';

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

async function landOnBitcoinSendForm(driver: Driver): Promise<{
  homePage: BitcoinHomepage;
  sendPage: SendPage;
}> {
  await login(driver);
  const homePage = new BitcoinHomepage(driver);
  await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Bitcoin');
  await homePage.checkPageIsLoaded();
  await homePage.checkIsExpectedBitcoinBalanceDisplayed(DEFAULT_BTC_BALANCE);

  const sendPage = new SendPage(driver);
  await homePage.startSendFlow();
  await sendPage.selectToken(BTC_CHAIN_ID, 'BTC');

  return { homePage, sendPage };
}

describe('BTC Account - Send', function (this: Suite) {
  this.timeout(180_000);

  it('blocks Continue when the recipient address is invalid', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        dappOptions: { numberOfTestDapps: 1 },
        testSpecificMock: mockBtcSendMocks,
      },
      async ({ driver }: { driver: Driver }) => {
        const { sendPage } = await landOnBitcoinSendForm(driver);

        await sendPage.fillRecipient('not-a-valid-btc-address');
        await sendPage.checkInvalidAddressError();
        const enabled = await sendPage.isContinueButtonEnabled();
        if (enabled) {
          throw new Error(
            'Continue button should be disabled for an invalid recipient',
          );
        }
      },
    );
  });

  it('blocks Continue when the amount exceeds the balance', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        dappOptions: { numberOfTestDapps: 1 },
        testSpecificMock: mockBtcSendMocks,
      },
      async ({ driver }: { driver: Driver }) => {
        const { sendPage } = await landOnBitcoinSendForm(driver);

        await sendPage.fillRecipient(RECIPIENT_ADDRESS);
        await sendPage.fillAmount(String(DEFAULT_BTC_BALANCE + 1));
        await sendPage.checkInsufficientFundsError();
        const enabled = await sendPage.isContinueButtonEnabled();
        if (enabled) {
          throw new Error(
            'Continue button should be disabled when amount exceeds balance',
          );
        }
      },
    );
  });

  it('blocks Continue when the amount leaves no room for fees', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        dappOptions: { numberOfTestDapps: 1 },
        testSpecificMock: mockBtcSendMocks,
      },
      async ({ driver }: { driver: Driver }) => {
        const { sendPage } = await landOnBitcoinSendForm(driver);

        await sendPage.fillRecipient(RECIPIENT_ADDRESS);
        await sendPage.fillAmount(String(DEFAULT_BTC_BALANCE));
        await sendPage.checkInsufficientFundsError();
        const enabled = await sendPage.isContinueButtonEnabled();
        if (enabled) {
          throw new Error(
            'Continue button should be disabled when amount leaves no room for fees',
          );
        }
      },
    );
  });

  it('sends part of the BTC balance and shows it pending in Activity', async function () {
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
      async ({ driver }: { driver: Driver }) => {
        const { sendPage } = await landOnBitcoinSendForm(driver);

        await sendPage.fillRecipient(RECIPIENT_ADDRESS);
        await sendPage.fillAmount(sendAmount);
        await sendPage.isContinueButtonEnabled();
        await sendPage.pressContinueButton();

        const reviewPage = new BitcoinReviewTxPage(driver);
        await reviewPage.checkPageIsLoaded();
        await reviewPage.checkNetworkFeeIsDisplayed(expectedFee);
        await reviewPage.checkTotalAmountIsDisplayed(expectedTotal);
        await reviewPage.clickConfirmButton();

        const activityListPage = new ActivityListPage(driver);
        await activityListPage.checkTransactionActivityByText('Sent');
        await activityListPage.checkWaitForTransactionStatus('pending');
      },
    );
  });

  it('sends the total BTC balance via Max and shows it pending in Activity', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        dappOptions: { numberOfTestDapps: 1 },
        testSpecificMock: mockBtcSendMocks,
      },
      async ({ driver }: { driver: Driver }) => {
        const { sendPage } = await landOnBitcoinSendForm(driver);

        await sendPage.fillRecipient(RECIPIENT_ADDRESS);
        await sendPage.clickMaxButton();
        await sendPage.isContinueButtonEnabled();
        await sendPage.pressContinueButton();

        const reviewPage = new BitcoinReviewTxPage(driver);
        await reviewPage.checkPageIsLoaded();
        await reviewPage.clickConfirmButton();

        const activityListPage = new ActivityListPage(driver);
        await activityListPage.checkTransactionActivityByText('Sent');
        await activityListPage.checkWaitForTransactionStatus('pending');
      },
    );
  });
});
