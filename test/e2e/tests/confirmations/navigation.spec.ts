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
import { withTransactionEnvelopeTypeFixtures } from './helpers';

describe('Navigation Signature - Different signature types', function (this: Suite) {
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
});

async function verifySignTypedData(driver: Driver) {
  await driver.waitForSelector({ text: DAPP_HOST_ADDRESS });
  await driver.waitForSelector({ text: 'Hi, Alice!' });
}

async function verifyRejectionResults(driver: Driver, verifyResultId: string) {
  await driver.waitForSelector({
    css: verifyResultId,
    text: 'Error: User rejected the request.',
  });
}

async function verifySignedTypeV3Confirmation(driver: Driver) {
  await driver.waitForSelector({ text: DAPP_HOST_ADDRESS });
  await driver.waitForSelector({
    css: '.name__value',
    text: '0xCD2a3...DD826',
  });
  await driver.waitForSelector({
    css: '.name__value',
    text: '0xbBbBB...bBBbB',
  });
  await driver.waitForSelector({ text: 'Hello, Bob!' });
}

async function verifySignedTypeV4Confirmation(driver: Driver) {
  verifySignedTypeV3Confirmation(driver);
  await driver.waitForSelector({ text: '0x' });
}

async function queueSignatures(driver: Driver) {
  // There is a race condition which changes the order in which signatures are displayed (#25251)
  // We fix it deterministically by waiting for an element in the screen for each signature
  await driver.clickElement('#signTypedData');

  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.findElement({ text: 'Hi, Alice!' });
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement('#signTypedDataV3');
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.findElement({ text: 'Reject all' });
  await driver.waitForSelector(By.xpath("//div[normalize-space(.)='1 of 2']"));
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement('#signTypedDataV4');
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.waitForSelector(By.xpath("//div[normalize-space(.)='1 of 3']"));
}

async function queueSignaturesAndTransactions(driver: Driver) {
  await driver.clickElement('#signTypedData');
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.waitForSelector({
    tag: 'p',
    text: 'Hi, Alice!',
  });
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

  await driver.clickElement('#sendButton');
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.waitForSelector(By.xpath("//div[normalize-space(.)='1 of 2']"));

  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

  await driver.clickElement('#signTypedDataV3');
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.waitForSelector(By.xpath("//div[normalize-space(.)='1 of 3']"));
}
