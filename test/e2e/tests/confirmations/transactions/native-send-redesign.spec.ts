/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import { DAPP_URL, WINDOW_TITLES } from '../../../constants';
import { veryLargeDelayMs } from '../../../helpers';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import TestDapp from '../../../page-objects/pages/test-dapp';
import TokenTransferTransactionConfirmation from '../../../page-objects/pages/confirmations/token-transfer-confirmation';
import { Driver } from '../../../webdriver/driver';
import { createInternalTransaction } from '../../../page-objects/flows/transaction';
import { withTransactionEnvelopeTypeFixtures } from '../helpers';
import { TestSuiteArguments } from './shared';

const TOKEN_RECIPIENT_ADDRESS = '0x2f318C334780961FB129D2a6c30D0763d9a5C970';

describe('Confirmation Redesign Native Send', function () {
  describe('Wallet initiated', function () {
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

  describe('dApp initiated', function () {
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
  await loginWithBalanceValidation(driver);

  const testDapp = new TestDapp(driver);

  await testDapp.openTestDappPage({ contractAddress: null, url: DAPP_URL });

  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);

  await createInternalTransaction({
    driver,
    chainId: '0x539',
    symbol: 'ETH',
    recipientAddress: TOKEN_RECIPIENT_ADDRESS,
    amount: '1',
  });

  const tokenTransferTransactionConfirmation =
    new TokenTransferTransactionConfirmation(driver);
  await tokenTransferTransactionConfirmation.checkWalletInitiatedHeadingTitle();
  await tokenTransferTransactionConfirmation.checkNetworkParagraph();
  await tokenTransferTransactionConfirmation.checkNetworkFeeParagraph();

  await tokenTransferTransactionConfirmation.clickFooterConfirmButton();
}

async function createDAppInitiatedTransactionAndAssertDetails(driver: Driver) {
  await loginWithBalanceValidation(driver);

  const testDapp = new TestDapp(driver);

  await testDapp.openTestDappPage({ contractAddress: null, url: DAPP_URL });

  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

  await testDapp.clickSimpleSendButton();

  await driver.delay(veryLargeDelayMs);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  const tokenTransferTransactionConfirmation =
    new TokenTransferTransactionConfirmation(driver);
  await tokenTransferTransactionConfirmation.checkDappInitiatedHeadingTitle();
  await tokenTransferTransactionConfirmation.checkNetworkParagraph();
  await tokenTransferTransactionConfirmation.checkNetworkFeeParagraph();

  await tokenTransferTransactionConfirmation.clickScrollToBottomButton();
  await tokenTransferTransactionConfirmation.clickFooterConfirmButton();
}
