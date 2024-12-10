/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import { DAPP_URL } from '../../../constants';
import {
  unlockWallet,
  veryLargeDelayMs,
  WINDOW_TITLES,
} from '../../../helpers';
import TokenTransferTransactionConfirmation from '../../../page-objects/pages/confirmations/redesign/token-transfer-confirmation';
import HomePage from '../../../page-objects/pages/homepage';
import SendTokenPage from '../../../page-objects/pages/send/send-token-page';
import TestDapp from '../../../page-objects/pages/test-dapp';
import { Driver } from '../../../webdriver/driver';
import { withTransactionEnvelopeTypeFixtures } from '../helpers';
import { TestSuiteArguments } from './shared';

const TOKEN_RECIPIENT_ADDRESS = '0x2f318C334780961FB129D2a6c30D0763d9a5C970';

describe('Confirmation Redesign Native Send @no-mmi', function () {
  describe('Wallet initiated', async function () {
    it('Sends a type 0 transaction (Legacy)', async function () {
      await withTransactionEnvelopeTypeFixtures(
        this.test?.fullTitle(),
        TransactionEnvelopeType.legacy,
        async ({ driver }: TestSuiteArguments) => {
          await createWalletInitiatedTransactionAndAssertDetails(driver);
        },
      );
    });

    it('Sends a type 2 transaction (EIP1559)', async function () {
      await withTransactionEnvelopeTypeFixtures(
        this.test?.fullTitle(),
        TransactionEnvelopeType.feeMarket,
        async ({ driver }: TestSuiteArguments) => {
          await createWalletInitiatedTransactionAndAssertDetails(driver);
        },
      );
    });
  });

  describe('dApp initiated', async function () {
    it('Sends a type 0 transaction (Legacy)', async function () {
      await withTransactionEnvelopeTypeFixtures(
        this.test?.fullTitle(),
        TransactionEnvelopeType.legacy,
        async ({ driver }: TestSuiteArguments) => {
          await createDAppInitiatedTransactionAndAssertDetails(driver);
        },
      );
    });

    it('Sends a type 2 transaction (EIP1559)', async function () {
      await withTransactionEnvelopeTypeFixtures(
        this.test?.fullTitle(),
        TransactionEnvelopeType.feeMarket,
        async ({ driver }: TestSuiteArguments) => {
          await createDAppInitiatedTransactionAndAssertDetails(driver);
        },
      );
    });
  });
});

async function createWalletInitiatedTransactionAndAssertDetails(
  driver: Driver,
) {
  await unlockWallet(driver);

  const testDapp = new TestDapp(driver);

  await testDapp.openTestDappPage({ contractAddress: null, url: DAPP_URL });

  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);
  const homePage = new HomePage(driver);
  await homePage.startSendFlow();
  const sendToPage = new SendTokenPage(driver);
  await sendToPage.check_pageIsLoaded();
  await sendToPage.fillRecipient(TOKEN_RECIPIENT_ADDRESS);
  await sendToPage.fillAmount('1');
  await sendToPage.goToNextScreen();

  const tokenTransferTransactionConfirmation =
    new TokenTransferTransactionConfirmation(driver);
  await tokenTransferTransactionConfirmation.check_walletInitiatedHeadingTitle();
  await tokenTransferTransactionConfirmation.check_networkParagraph();
  await tokenTransferTransactionConfirmation.check_networkFeeParagraph();

  await tokenTransferTransactionConfirmation.clickFooterConfirmButton();
}

async function createDAppInitiatedTransactionAndAssertDetails(driver: Driver) {
  await unlockWallet(driver);

  const testDapp = new TestDapp(driver);

  await testDapp.openTestDappPage({ contractAddress: null, url: DAPP_URL });

  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

  await testDapp.clickSimpleSendButton();

  await driver.delay(veryLargeDelayMs);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  const tokenTransferTransactionConfirmation =
    new TokenTransferTransactionConfirmation(driver);
  await tokenTransferTransactionConfirmation.check_dappInitiatedHeadingTitle();
  await tokenTransferTransactionConfirmation.check_networkParagraph();
  await tokenTransferTransactionConfirmation.check_networkFeeParagraph();

  await tokenTransferTransactionConfirmation.clickScrollToBottomButton();
  await tokenTransferTransactionConfirmation.clickFooterConfirmButton();
}
