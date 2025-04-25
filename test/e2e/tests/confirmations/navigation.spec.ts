import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import { Suite } from 'mocha';
import { By } from 'selenium-webdriver';
import {
  DAPP_HOST_ADDRESS,
  openDapp,
  unlockWallet,
  WINDOW_TITLES,
} from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import TestDapp from '../../page-objects/pages/test-dapp';
import { createDappTransaction } from '../../page-objects/flows/transaction';
import { TestSnaps } from '../../page-objects/pages/test-snaps';
import Confirmation from '../../page-objects/pages/confirmations/redesign/confirmation';
import { openTestSnapClickButtonAndInstall } from '../../page-objects/flows/install-test-snap.flow';
import { withTransactionEnvelopeTypeFixtures } from './helpers';
import SignTypedData from '../../page-objects/pages/confirmations/redesign/sign-typed-data-confirmation';

describe('Confirmation Navigation', function (this: Suite) {
  it('initiates and queues multiple signatures and confirms', async function () {
    await withTransactionEnvelopeTypeFixtures(
      this.test?.fullTitle(),
      TransactionEnvelopeType.legacy,
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        await openDapp(driver);
        await queueSignatures(driver);

        await verifySignTypedData(driver);
        await driver.clickElement(
          '[data-testid="confirm-nav__next-confirmation"]',
        );

        // Verify Sign Typed Data v3 confirmation is displayed
        await verifySignedTypeV3Confirmation(driver);

        await driver.clickElement(
          '[data-testid="confirm-nav__next-confirmation"]',
        );

        // Verify Sign Typed Data v4 confirmation is displayed
        await verifySignedTypeV4Confirmation(driver);

        await driver.clickElement(
          '[data-testid="confirm-nav__previous-confirmation"]',
        );

        // Verify Sign Typed Data v3 confirmation is displayed
        await verifySignedTypeV3Confirmation(driver);

        await driver.clickElement(
          '[data-testid="confirm-nav__previous-confirmation"]',
        );
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
        await unlockWallet(driver);
        await openDapp(driver);
        await queueSignaturesAndTransactions(driver);

        await verifySignTypedData(driver);

        await driver.clickElement(
          '[data-testid="confirm-nav__next-confirmation"]',
        );

        // Verify simple send transaction is displayed
        await driver.waitForSelector({
          tag: 'h3',
          text: 'Transfer request',
        });

        await driver.clickElement(
          '[data-testid="confirm-nav__next-confirmation"]',
        );

        // Verify Sign Typed Data v3 confirmation is displayed
        await verifySignedTypeV3Confirmation(driver);

        await driver.clickElement(
          '[data-testid="confirm-nav__previous-confirmation"]',
        );

        // Verify simple send transaction is displayed
        await driver.waitForSelector({
          tag: 'h3',
          text: 'Transfer request',
        });

        await driver.clickElement(
          '[data-testid="confirm-nav__previous-confirmation"]',
        );

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
        await unlockWallet(driver);
        await openDapp(driver);
        await queueSignatures(driver);

        await driver.clickElementAndWaitForWindowToClose(
          '[data-testid="confirm-nav__reject-all"]',
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        await verifyRejectionResults(driver, '#signTypedDataResult');
        await verifyRejectionResults(driver, '#signTypedDataV3Result');
        await verifyRejectionResults(driver, '#signTypedDataV4Result');
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

        const confirmation = new Confirmation(driver);
        await confirmation.check_pageNumbers(1, 3);
        await driver.waitForSelector({ text: 'Confirmation Dialog' });

        await confirmation.clickNextPage();
        await confirmation.check_pageNumbers(2, 3);
        await driver.waitForSelector({ text: 'Signature request' });

        await confirmation.clickNextPage();
        await confirmation.check_pageNumbers(3, 3);
        await driver.waitForSelector({ text: 'Transfer request' });

        await confirmation.clickPreviousPage();
        await confirmation.check_pageNumbers(2, 3);
        await driver.waitForSelector({ text: 'Signature request' });

        await confirmation.clickPreviousPage();
        await confirmation.check_pageNumbers(1, 3);
        await driver.waitForSelector({ text: 'Confirmation Dialog' });
      },
    );
  });
});

async function verifySignTypedData(driver: Driver) {
  const confirmation = new SignTypedData(driver);
  await confirmation.verifyOrigin();
  await confirmation.verifySignTypedDataMessage();
}

async function verifyRejectionResults(driver: Driver, verifyResultId: string) {
  await driver.waitForSelector({
    css: verifyResultId,
    text: 'Error: User rejected the request.',
  });
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
