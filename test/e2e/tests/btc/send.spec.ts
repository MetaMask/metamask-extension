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
import {
  mockCurrencyExchangeRates,
  mockExchangeRates,
  mockFiatExchangeRates,
  mockInitialFullScan,
  mockInitialFullScanWithConfirmedSend,
  mockSolanaSpotPrices,
  mockSupportedVsCurrencies,
  mockTokensV2SupportedNetworks,
  mockTokensV3Assets,
} from './mocks';
import { BTC_CHAIN_ID } from './mocks/bridge';
import { mockPriceMulti, mockPriceMultiBtcAndSol } from './mocks/min-api';
import { buildBtcSwapFixtures } from './unified-btc-assets';

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

async function mockBtcSendConfirmMocks(mockServer: Mockttp) {
  return [
    await mockInitialFullScanWithConfirmedSend(mockServer),
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
  homePage: HomePage;
  sendPage: SendPage;
}> {
  await login(driver);
  const homePage = new HomePage(driver);
  await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Bitcoin');
  await homePage.checkPageIsLoaded();
  // Refresh re-hydrates the UI from background state so the asynchronously-fetched Snap balance is shown reliably.
  await driver.refresh();
  await new TokensTab(driver).checkExpectedTokenBalanceIsDisplayed(
    `${DEFAULT_BTC_BALANCE}`,
    'BTC',
  );

  const sendPage = new SendPage(driver);
  await homePage.startSendFlow();
  await sendPage.selectToken(BTC_CHAIN_ID, 'BTC');

  return { homePage, sendPage };
}

describe('BTC Account - Send', function (this: Suite) {
  this.timeout(300_000);

  const btcSendFixtureOptions = {
    fixtures: buildBtcSwapFixtures(),
    localNodeOptions: [{ type: 'none' as const }],
    dappOptions: { numberOfTestDapps: 1 },
  };

  it('blocks Continue when the recipient address is invalid', async function () {
    await withFixtures(
      {
        ...btcSendFixtureOptions,
        title: this.test?.fullTitle(),
        testSpecificMock: mockBtcSendMocks,
      },
      async ({ driver }: { driver: Driver }) => {
        const { sendPage } = await landOnBitcoinSendForm(driver);

        await sendPage.fillRecipient({
          recipientAddress: 'not-a-valid-btc-address',
          validAddress: false,
        });
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
        ...btcSendFixtureOptions,
        title: this.test?.fullTitle(),
        testSpecificMock: mockBtcSendMocks,
      },
      async ({ driver }: { driver: Driver }) => {
        const { sendPage } = await landOnBitcoinSendForm(driver);

        await sendPage.fillRecipient({ recipientAddress: RECIPIENT_ADDRESS });
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

  it('surfaces an insufficient-fee error after Continue when the amount leaves no room for fees', async function () {
    const sendAmount = '0.9999999';

    await withFixtures(
      {
        ...btcSendFixtureOptions,
        title: this.test?.fullTitle(),
        testSpecificMock: mockBtcSendMocks,
      },
      async ({ driver }: { driver: Driver }) => {
        const { sendPage } = await landOnBitcoinSendForm(driver);

        await sendPage.fillRecipient({ recipientAddress: RECIPIENT_ADDRESS });
        await sendPage.fillAmount(sendAmount);

        const enabled = await sendPage.isContinueButtonEnabled();
        if (!enabled) {
          throw new Error(
            'Continue should be enabled: amount is within balance; the fee shortfall is only detected on confirm',
          );
        }

        await sendPage.pressContinueButton();
        await sendPage.checkInsufficientBalanceToCoverFeesError();
      },
    );
  });

  it('sends part of the BTC balance and shows it pending in Activity', async function () {
    const sendAmount = '0.5';
    const expectedFee = '0.00000281';
    const expectedTotal = '53381.50';

    await withFixtures(
      {
        ...btcSendFixtureOptions,
        title: this.test?.fullTitle(),
        testSpecificMock: mockBtcSendMocks,
      },
      async ({ driver }: { driver: Driver }) => {
        const { sendPage } = await landOnBitcoinSendForm(driver);

        await sendPage.fillRecipient({ recipientAddress: RECIPIENT_ADDRESS });
        await sendPage.fillAmount(sendAmount);
        await sendPage.isContinueButtonEnabled();
        await sendPage.pressContinueButton();

        const reviewPage = new BitcoinReviewTxPage(driver);
        await reviewPage.checkPageIsLoaded();
        await reviewPage.checkNetworkFeeIsDisplayed(expectedFee);
        await reviewPage.checkTotalAmountIsDisplayed(expectedTotal);
        await reviewPage.clickConfirmButton();

        const activityListPage = new ActivityTab(driver);
        await activityListPage.checkTransactionActivityByText('Sending BTC');
        await activityListPage.checkWaitForTransactionStatus('pending');
      },
    );
  });

  it('sends the total BTC balance and shows it pending in Activity', async function () {
    await withFixtures(
      {
        ...btcSendFixtureOptions,
        title: this.test?.fullTitle(),
        testSpecificMock: mockBtcSendMocks,
      },
      async ({ driver }: { driver: Driver }) => {
        const { sendPage } = await landOnBitcoinSendForm(driver);

        await sendPage.fillRecipient({ recipientAddress: RECIPIENT_ADDRESS });
        await sendPage.fillAmount(`${DEFAULT_BTC_BALANCE}`);
        await sendPage.isContinueButtonEnabled();
        await sendPage.pressContinueButton();

        const reviewPage = new BitcoinReviewTxPage(driver);
        await reviewPage.checkPageIsLoaded();
        await reviewPage.clickConfirmButton();

        const activityListPage = new ActivityTab(driver);
        await activityListPage.checkTransactionActivityByText('Sending BTC');
        await activityListPage.checkWaitForTransactionStatus('pending');
      },
    );
  });

  it('sends part of the BTC balance and confirms it in Activity', async function () {
    const sendAmount = '0.5';

    await withFixtures(
      {
        ...btcSendFixtureOptions,
        title: this.test?.fullTitle(),
        testSpecificMock: mockBtcSendConfirmMocks,
      },
      async ({ driver }: { driver: Driver }) => {
        const { sendPage } = await landOnBitcoinSendForm(driver);

        await sendPage.fillRecipient({ recipientAddress: RECIPIENT_ADDRESS });
        await sendPage.fillAmount(sendAmount);
        await sendPage.isContinueButtonEnabled();
        await sendPage.pressContinueButton();

        const reviewPage = new BitcoinReviewTxPage(driver);
        await reviewPage.checkPageIsLoaded();
        await reviewPage.clickConfirmButton();

        const activityListPage = new ActivityTab(driver);
        await activityListPage.checkTransactionActivityByText('Sending BTC');
        // Re-sync so the Snap reconciles the broadcast tx into a confirmed one.
        await driver.refresh();
        await activityListPage.checkWaitForTransactionStatus('confirmed');
      },
    );
  });
});
