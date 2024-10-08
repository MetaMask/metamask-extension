import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import {
  DAPP_HOST_ADDRESS,
  WINDOW_TITLES,
  openDapp,
  unlockWallet,
  regularDelayMs,
} from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { withRedesignConfirmationFixtures } from './helpers';

describe('Navigation Signature - Different signature types', function (this: Suite) {
  it('initiates and queues multiple signatures and confirms', async function () {
    await withRedesignConfirmationFixtures(
      this.test?.fullTitle(),
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
    await withRedesignConfirmationFixtures(
      this.test?.fullTitle(),
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        await openDapp(driver);
        await queueSignaturesAndTransactions(driver);

        await verifySignTypedData(driver);

        await driver.clickElement(
          '[data-testid="confirm-nav__next-confirmation"]',
        );

        // Verify Transaction Sending ETH is displayed
        await verifyTransaction(driver, 'SENDING ETH');

        await driver.clickElement('[data-testid="next-page"]');

        // Verify Sign Typed Data v3 confirmation is displayed
        await verifySignedTypeV3Confirmation(driver);

        await driver.clickElement(
          '[data-testid="confirm-nav__previous-confirmation"]',
        );

        // Verify Sign Typed Data v3 confirmation is displayed
        await verifyTransaction(driver, 'SENDING ETH');

        await driver.clickElement('[data-testid="previous-page"]');

        // Verify Sign Typed Data v3 confirmation is displayed
        await verifySignTypedData(driver);
      },
    );
  });

  it('initiates multiple signatures and rejects all', async function () {
    await withRedesignConfirmationFixtures(
      this.test?.fullTitle(),
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        await openDapp(driver);
        await queueSignatures(driver);
        await driver.delay(regularDelayMs);

        await driver.clickElement('[data-testid="confirm-nav__reject-all"]');

        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        await verifyRejectionResults(driver, '#signTypedDataResult');
        await verifyRejectionResults(driver, '#signTypedDataV3Result');
        await verifyRejectionResults(driver, '#signTypedDataV4Result');
      },
    );
  });
});

async function verifySignTypedData(driver: Driver) {
  const origin = await driver.findElement({ text: DAPP_HOST_ADDRESS });
  const message = await driver.findElement({ text: 'Hi, Alice!' });

  // Verify Sign Typed Data confirmation is displayed
  assert.ok(origin, 'origin');
  assert.ok(message, 'message');
}

async function verifyRejectionResults(driver: Driver, verifyResultId: string) {
  const rejectionResult = await driver.findElement(verifyResultId);
  assert.equal(
    await rejectionResult.getText(),
    'Error: User rejected the request.',
  );
}

async function verifySignedTypeV3Confirmation(driver: Driver) {
  const origin = await driver.findElement({ text: DAPP_HOST_ADDRESS });
  const fromAddress = driver.findElement({
    css: '.name__value',
    text: '0xCD2a3...DD826',
  });
  const toAddress = driver.findElement({
    css: '.name__value',
    text: '0xbBbBB...bBBbB',
  });
  const contents = driver.findElement({ text: 'Hello, Bob!' });

  assert.ok(await origin, 'origin');
  assert.ok(await fromAddress, 'fromAddress');
  assert.ok(await toAddress, 'toAddress');
  assert.ok(await contents, 'contents');
}

async function verifySignedTypeV4Confirmation(driver: Driver) {
  verifySignedTypeV3Confirmation(driver);
  const attachment = driver.findElement({ text: '0x' });
  assert.ok(await attachment, 'attachment');
}

async function queueSignatures(driver: Driver) {
  // There is a race condition which changes the order in which signatures are displayed (#25251)
  // We fix it deterministically by waiting for an element in the screen for each signature
  await driver.clickElement('#signTypedData');
  await driver.waitUntilXWindowHandles(3);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.findElement({ text: 'Hi, Alice!' });
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement('#signTypedDataV3');
  await driver.waitUntilXWindowHandles(3);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.findElement({ text: 'Reject all' });

  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement('#signTypedDataV4');
  await driver.waitUntilXWindowHandles(3);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
}

async function queueSignaturesAndTransactions(driver: Driver) {
  await driver.clickElement('#signTypedData');
  await driver.waitUntilXWindowHandles(3);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.delay(2000); // Delay needed due to a race condition
  // To be fixed in https://github.com/MetaMask/metamask-extension/issues/25251

  await driver.waitUntilXWindowHandles(3);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

  await driver.clickElement('#sendButton');
  await driver.waitUntilXWindowHandles(3);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.delay(2000);

  await driver.waitUntilXWindowHandles(3);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

  await driver.clickElement('#signTypedDataV3');
  await driver.waitUntilXWindowHandles(3);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.delay(2000);
}

async function verifyTransaction(
  driver: Driver,
  expectedTransactionType: string,
) {
  const transactionType = await driver.findElement(
    '.confirm-page-container-summary__action__name',
  );
  assert.equal(await transactionType.getText(), expectedTransactionType);
}
