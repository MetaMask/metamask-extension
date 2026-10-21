import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import {
  confirmBitcoinSendAndAssertPending,
  landOnBitcoinSendScreen,
  waitForBitcoinSendConfirmation,
} from '../../page-objects/flows/bitcoin-send.flow';
import BitcoinReviewTxPage from '../../page-objects/pages/send/bitcoin-review-tx-page';
import {
  createBtcSendLifecycle,
  mockExchangeRates,
  mockCurrencyExchangeRates,
  mockFiatExchangeRates,
  mockInitialFullScan,
  mockSolanaSpotPrices,
  mockSupportedVsCurrencies,
  mockTokensV3Assets,
  mockTokensV2SupportedNetworks,
} from '../btc/mocks';
import type { BtcSendLifecycle } from '../btc/mocks/esplora';
import { mockPriceMulti, mockPriceMultiBtcAndSol } from '../btc/mocks/min-api';

const RECIPIENT_ADDRESS = 'bc1qsqvczpxkgvp3lw230p7jffuuqnw9pp4j5tawmf';
const SEND_AMOUNT = '0.5';
const TOTAL_BALANCE_SEND_AMOUNT = '0.99999719';

async function mockBtcSendMocks(
  mockServer: Mockttp,
  lifecycle?: BtcSendLifecycle,
) {
  return [
    await mockInitialFullScan(mockServer, lifecycle),
    await mockExchangeRates(mockServer),
    await mockCurrencyExchangeRates(mockServer),
    await mockFiatExchangeRates(mockServer),
    await mockSolanaSpotPrices(mockServer),
    await mockSupportedVsCurrencies(mockServer),
    await mockPriceMulti(mockServer),
    await mockPriceMultiBtcAndSol(mockServer),
    ...(await mockTokensV2SupportedNetworks(mockServer)),
    await mockTokensV3Assets(mockServer),
  ];
}

describe('BTC Account - Send', function (this: Suite) {
  this.timeout(300000);

  it('fields validation', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockBtcSendMocks,
      },
      async ({ driver }) => {
        const sendPage = await landOnBitcoinSendScreen(driver);
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
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockBtcSendMocks,
      },
      async ({ driver }) => {
        const sendPage = await landOnBitcoinSendScreen(driver);
        await sendPage.fillRecipient({
          recipientAddress: RECIPIENT_ADDRESS,
        });

        await sendPage.fillAmount('5');
        await sendPage.checkInsufficientFundsError();
      },
    );
  });

  it('blocks the send flow when the amount is empty', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockBtcSendMocks,
      },
      async ({ driver }) => {
        const sendPage = await landOnBitcoinSendScreen(driver);
        await sendPage.fillRecipient({
          recipientAddress: RECIPIENT_ADDRESS,
        });
        await sendPage.pressContinueButton();
        await sendPage.checkInvalidValueError();
        await sendPage.checkContinueButtonIsDisabled();
      },
    );
  });

  it('sends the fee-buffered total BTC balance', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockBtcSendMocks,
      },
      async ({ driver }) => {
        const sendPage = await landOnBitcoinSendScreen(driver);
        await sendPage.fillRecipient({
          recipientAddress: RECIPIENT_ADDRESS,
        });
        await sendPage.fillAmount(TOTAL_BALANCE_SEND_AMOUNT);
        await sendPage.checkContinueButton({ state: 'enabled' });
        await sendPage.pressContinueButton();

        await confirmBitcoinSendAndAssertPending({ driver });
      },
    );
  });

  it('sends part of the BTC balance and shows it pending then confirmed', async function () {
    const expectedFee = '0.00000281';
    const expectedTotal = '53381.50';
    const lifecycle = createBtcSendLifecycle();

    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer: Mockttp) =>
          mockBtcSendMocks(mockServer, lifecycle),
      },
      async ({ driver }) => {
        const expectedAmount = `-${SEND_AMOUNT} BTC`;
        const sendPage = await landOnBitcoinSendScreen(driver);
        await sendPage.fillRecipient({
          recipientAddress: RECIPIENT_ADDRESS,
        });
        await sendPage.fillAmount(SEND_AMOUNT);
        await sendPage.checkContinueButton({ state: 'enabled' });
        await sendPage.pressContinueButton();

        const bitcoinReviewTxPage = new BitcoinReviewTxPage(driver);
        await bitcoinReviewTxPage.checkPageIsLoaded();
        await bitcoinReviewTxPage.checkSendAmountIsDisplayed(SEND_AMOUNT);
        await bitcoinReviewTxPage.checkNetworkFeeIsDisplayed(expectedFee);
        await bitcoinReviewTxPage.checkTotalAmountIsDisplayed(expectedTotal);

        const activityTab = await confirmBitcoinSendAndAssertPending({
          driver,
          expectedAmount,
        });
        lifecycle.confirm();
        await waitForBitcoinSendConfirmation({
          activityTab,
          expectedAmount,
        });
      },
    );
  });
});
