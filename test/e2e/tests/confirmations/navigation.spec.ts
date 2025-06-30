import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import { Suite } from 'mocha';
import { openDapp, unlockWallet, WINDOW_TITLES } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import TestDapp from '../../page-objects/pages/test-dapp';
import { createDappTransaction } from '../../page-objects/flows/transaction';
import { TestSnaps } from '../../page-objects/pages/test-snaps';
import { openTestSnapClickButtonAndInstall } from '../../page-objects/flows/install-test-snap.flow';
import SignTypedData from '../../page-objects/pages/confirmations/redesign/sign-typed-data-confirmation';
import TransactionConfirmation from '../../page-objects/pages/confirmations/redesign/transaction-confirmation';
import { withTransactionEnvelopeTypeFixtures } from './helpers';

describe('Confirmation Navigation', function (this: Suite) {
  it('initiates and queues multiple signatures and confirms', async function () {
    await withTransactionEnvelopeTypeFixtures(
      this.test?.fullTitle(),
      TransactionEnvelopeType.legacy,
      async ({ driver }: { driver: Driver }) => {
        const confirmation = new SignTypedData(driver);
        await unlockWallet(driver);
        await openDapp(driver);
        await queueSignatures(driver);

        await verifySignTypedData(driver);
        await confirmation.clickNextPage();

        // Verify Sign Typed Data v3 confirmation is displayed
        await verifySignedTypeV3Confirmation(driver);

        await confirmation.clickNextPage();

        // Verify Sign Typed Data v4 confirmation is displayed
        await verifySignedTypeV4Confirmation(driver);

        await confirmation.clickPreviousPage();

        // Verify Sign Typed Data v3 confirmation is displayed
        await verifySignedTypeV3Confirmation(driver);

        await confirmation.clickPreviousPage();
        // Verify Sign Typed Data v3 confirmation is displayed
        await verifySignTypedData(driver);
      },
    );
  });

  it('initiates and queues a mix of signatures and transactions and navigates', async function () {
    await withTransactionEnvelopeTypeFixtures(
      this.test?.fullTitle(),
      TransactionEnvelopeType.legacy,
      async ({ driver }: { driver: Driver }) => {
        const confirmation = new TransactionConfirmation(driver);
        await unlockWallet(driver);
        await openDapp(driver);
        await queueSignaturesAndTransactions(driver);

        await verifySignTypedData(driver);

        await confirmation.clickNextPage();

        // Verify simple send transaction is displayed
        await confirmation.check_dappInitiatedHeadingTitle();

        await confirmation.clickNextPage();

        // Verify Sign Typed Data v3 confirmation is displayed
        await verifySignedTypeV3Confirmation(driver);

        await confirmation.clickPreviousPage();

        // Verify simple send transaction is displayed
        await confirmation.check_dappInitiatedHeadingTitle();

        await confirmation.clickPreviousPage();

        // Verify Sign Typed Data v3 confirmation is displayed
        await verifySignTypedData(driver);
      },
    );
  });

  it('initiates multiple signatures and rejects all', async function () {
    await withTransactionEnvelopeTypeFixtures(
      this.test?.fullTitle(),
      TransactionEnvelopeType.legacy,
      async ({ driver }: { driver: Driver }) => {
        const confirmation = new SignTypedData(driver);
        const testDapp = new TestDapp(driver);
        await unlockWallet(driver);
        await openDapp(driver);
        await queueSignatures(driver);

        await confirmation.clickRejectAll();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.check_failedSignTypedData('User rejected the request.');
        await testDapp.check_failedSignTypedDataV3(
          'User rejected the request.',
        );
        await testDapp.check_failedSignTypedDataV4(
          'User rejected the request.',
        );
      },
    );
  });

  it('navigates between transactions, signatures, and snap dialogs', async function () {
    await withTransactionEnvelopeTypeFixtures(
      this.test?.fullTitle(),
      TransactionEnvelopeType.feeMarket,
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);
        await openTestSnapClickButtonAndInstall(driver, 'connectDialogsButton');
        await testSnaps.scrollAndClickButton('confirmationButton');

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.clickSignTypedDatav4();

        await createDappTransaction(driver);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const confirmation = new TransactionConfirmation(driver);
        const signTypedDataConfirmation = new SignTypedData(driver);
        await confirmation.check_pageNumbers(1, 3);
        await confirmation.verifyConfirmationHeadingTitle();

        await confirmation.clickNextPage();
        await confirmation.check_pageNumbers(2, 3);
        await signTypedDataConfirmation.verifyConfirmationHeadingTitle();

        await confirmation.clickNextPage();
        await confirmation.check_pageNumbers(3, 3);
        await confirmation.check_dappInitiatedHeadingTitle();

        await confirmation.clickPreviousPage();
        await confirmation.check_pageNumbers(2, 3);
        await signTypedDataConfirmation.verifyConfirmationHeadingTitle();

        await confirmation.clickPreviousPage();
        await confirmation.check_pageNumbers(1, 3);
        await confirmation.verifyConfirmationHeadingTitle();
      },
    );
  });
});

async function verifySignTypedData(driver: Driver) {
  const confirmation = new SignTypedData(driver);
  await confirmation.verifyOrigin();
  await confirmation.verifySignTypedDataMessage();
}

async function verifySignedTypeV3Confirmation(driver: Driver) {
  const confirmation = new SignTypedData(driver);
  await confirmation.verifyOrigin();
  await confirmation.verifyFromAddress();
  await confirmation.verifyToAddress();
  await confirmation.verifyContents();
}

async function verifySignedTypeV4Confirmation(driver: Driver) {
  const confirmation = new SignTypedData(driver);
  verifySignedTypeV3Confirmation(driver);
  await confirmation.verifyAttachment();
}

async function queueSignatures(driver: Driver) {
  const testDapp = new TestDapp(driver);
  const confirmation = new SignTypedData(driver);

  // Sign Typed Data
  await testDapp.clickSignTypedData();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await confirmation.verifySignTypedDataMessage();

  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

  // Sign Typed Data V3
  await testDapp.clickSignTypedDatav3();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await confirmation.check_pageNumbers(1, 2);

  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

  // Sign Typed Data V4
  await testDapp.clickSignTypedDatav4();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await confirmation.check_pageNumbers(1, 3);
}

async function queueSignaturesAndTransactions(driver: Driver) {
  const testDapp = new TestDapp(driver);
  const confirmation = new SignTypedData(driver);

  // Sign Typed Data
  await testDapp.clickSignTypedData();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await confirmation.verifySignTypedDataMessage();

  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

  // Send Transaction
  await testDapp.clickSimpleSendButton();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await confirmation.check_pageNumbers(1, 2);

  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

  // Sign Typed Data V3
  await testDapp.clickSignTypedDatav3();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await confirmation.check_pageNumbers(1, 3);
}
