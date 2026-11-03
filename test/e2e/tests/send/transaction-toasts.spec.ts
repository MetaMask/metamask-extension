/**
 * Generic transaction toasts are off in the default fixture.
 * This spec turns them on and covers the EVM and non-EVM toast paths
 * (submitted, confirmed, failed).
 */

import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { SOLANA_MAINNET_SCOPE } from '../../constants';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { broadcastBitcoinSend } from '../../page-objects/flows/bitcoin-send.flow';
import { login } from '../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import { createInternalTransaction } from '../../page-objects/flows/transaction.flow';
import Confirmation from '../../page-objects/pages/confirmations/confirmation';
import SnapTransactionConfirmation from '../../page-objects/pages/confirmations/snap-transaction-confirmation';
import HomePage from '../../page-objects/pages/home/homepage';
import SendPage from '../../page-objects/pages/send/send-page';
import TransactionDetailsPage from '../../page-objects/pages/transaction-details-page';
import { TxToastNotification } from '../../page-objects/components/tx-toast-notification';
import {
  mockCurrencyExchangeRates,
  mockExchangeRates,
  mockFiatExchangeRates,
  mockInitialFullScan,
  mockSolanaSpotPrices,
  mockSupportedVsCurrencies,
  mockTokensV2SupportedNetworks,
  mockTokensV3Assets,
} from '../btc/mocks';
import { mockPriceMulti, mockPriceMultiBtcAndSol } from '../btc/mocks/min-api';
import {
  buildSolanaTestSpecificMock,
  commonSolanaAddress,
} from '../solana/common-solana';
import { buildSolanaPositiveBalanceFixture } from '../solana/unified-solana-assets';

const BTC_RECIPIENT_ADDRESS = 'bc1qsqvczpxkgvp3lw230p7jffuuqnw9pp4j5tawmf';

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
    ...(await mockTokensV2SupportedNetworks(mockServer)),
    await mockTokensV3Assets(mockServer),
  ];
}

describe('Transaction toasts', function (this: Suite) {
  this.timeout(180_000);

  it('dismisses the confirmed toast and stays on the home page', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().withTransactionToastsEnabled().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);
        await createInternalTransaction({ driver });
        await new Confirmation(driver).clickFooterButton({
          button: 'confirm',
        });

        const txToast = new TxToastNotification(driver);
        await txToast.checkTxConfirmedToast();
        await txToast.closeToastNotification();
        await new HomePage(driver).checkPageIsLoaded();
      },
    );
  });

  it('opens transaction details from the confirmed toast', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().withTransactionToastsEnabled().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);
        await createInternalTransaction({ driver });
        await new Confirmation(driver).clickFooterButton({
          button: 'confirm',
        });

        const txToast = new TxToastNotification(driver);
        await txToast.checkTxConfirmedToast();
        await txToast.openConfirmedToast();

        const transactionDetailsPage = new TransactionDetailsPage(driver);
        await transactionDetailsPage.checkPageIsLoaded();
        await transactionDetailsPage.checkStatus('Confirmed');
      },
    );
  });

  it('shows the submitted toast for a non-EVM (Bitcoin) send', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().withTransactionToastsEnabled().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockBtcSendMocks,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToNetworkFromNetworkSelect(driver, 'Bitcoin');
        // Refresh re-hydrates the UI from background state so the asynchronously-fetched Snap balance is shown reliably.
        await driver.refresh();

        await broadcastBitcoinSend({
          driver,
          recipientAddress: BTC_RECIPIENT_ADDRESS,
          amount: '0.5',
        });

        const txToast = new TxToastNotification(driver);
        await txToast.checkTxSubmittedToast();
        await txToast.closeToastNotification();
        await homePage.checkPageIsLoaded();
      },
    );
  });

  it('shows the failed toast for a non-EVM (Solana) send that fails', async function () {
    await withFixtures(
      {
        fixtures: buildSolanaPositiveBalanceFixture({
          transactionToastsEnabled: true,
        }),
        title: this.test?.fullTitle(),
        testSpecificMock: buildSolanaTestSpecificMock({
          mockGetTransactionFailed: true,
        }),
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await switchToNetworkFromNetworkSelect(driver, 'Solana');
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed('50');

        await homePage.clickOnSendButton();
        const sendPage = new SendPage(driver);
        await sendPage.selectToken(SOLANA_MAINNET_SCOPE, 'SOL');
        await sendPage.fillRecipient({ recipientAddress: commonSolanaAddress });
        await sendPage.fillAmount('0.1');
        await sendPage.checkContinueButton({ state: 'enabled' });
        await sendPage.pressContinueButton();

        const confirmation = new SnapTransactionConfirmation(driver);
        await confirmation.checkPageIsLoaded();
        await confirmation.clickFooterButton({ button: 'confirm' });

        await new TxToastNotification(driver).checkTxFailedToast();
      },
    );
  });
});
