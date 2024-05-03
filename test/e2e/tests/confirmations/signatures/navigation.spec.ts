import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { withRedesignConfirmationFixtures } from '../helper-fixture';
import {
  DAPP_URL_WITHOUT_SCHEMA,
  WINDOW_TITLES,
  openDapp,
  unlockWallet,
  regularDelayMs,
} from '../../../helpers';
import { Ganache } from '../../../seeder/ganache';
import { Driver } from '../../../webdriver/driver';
import { WebElement } from 'selenium-webdriver';

describe('Navigation Signature - Different signature types', function (this: Suite) {
  if (!process.env.ENABLE_CONFIRMATION_REDESIGN) {
    return;
  }

  it('initiates and queues multiple signatures and confirms', async function () {
    await withRedesignConfirmationFixtures(
      this.test?.fullTitle(),
      async ({
        driver,
        ganacheServer,
      }: {
        driver: Driver;
        ganacheServer: Ganache;
      }) => {
        const addresses = await ganacheServer.getAccounts();
        const publicAddress = addresses?.[0] as string;

        await unlockWallet(driver);
        await openDapp(driver);
        await queueSignatures(driver);

        const origin = driver.findElement({ text: DAPP_URL_WITHOUT_SCHEMA });
        const message = driver.findElement({ text: 'Hi, Alice!' });

        // Verify Sign Typed Data confirmation is displayed
        assert.ok(await origin);
        assert.ok(await message);

        await driver.clickElement(
          '[data-testid="confirm-nav__next-confirmation"]',
        );

        // Verify Sign Typed Data v3 confirmation is displayed
        await verifySignedTypeV3Confirmation(driver, origin);

        await driver.clickElement(
          '[data-testid="confirm-nav__next-confirmation"]',
        );

        // Verify Sign Typed Data v4 confirmation is displayed
        await verifySignedTypeV4Confirmation(driver, origin);

        await driver.clickElement(
          '[data-testid="confirm-nav__previous-confirmation"]',
        );

        // Verify Sign Typed Data v3 confirmation is displayed
        await verifySignedTypeV3Confirmation(driver, origin);

        await driver.clickElement(
          '[data-testid="confirm-nav__previous-confirmation"]',
        );
        // Verify Sign Typed Data v3 confirmation is displayed
        assert.ok(await origin);
        assert.ok(await message);
      },
    );
  });

  it('initiates and queues a mix of signatures and transactions and navigates', async function () {
    await withRedesignConfirmationFixtures(
      this.test?.fullTitle(),
      async ({
        driver,
        ganacheServer,
      }: {
        driver: Driver;
        ganacheServer: Ganache;
      }) => {
        const addresses = await ganacheServer.getAccounts();
        const publicAddress = addresses?.[0] as string;

        await unlockWallet(driver);
        await openDapp(driver);
        await queueSignaturesAndTransactions(driver);

        const origin = driver.findElement({ text: DAPP_URL_WITHOUT_SCHEMA });
        const message = driver.findElement({ text: 'Hi, Alice!' });

        // Verify Sign Typed Data confirmation is displayed
        assert.ok(await origin);
        assert.ok(await message);

        await driver.clickElement(
          '[data-testid="confirm-nav__next-confirmation"]',
        );

        // Verify Transaction Sending ETH is displayed
        await verifyTransaction(driver, 'SENDING ETH');

        await driver.clickElement('[data-testid="next-page"]');

        // Verify Sign Typed Data v3 confirmation is displayed
        await verifySignedTypeV3Confirmation(driver, origin);

        await driver.clickElement(
          '[data-testid="confirm-nav__previous-confirmation"]',
        );

        // Verify Sign Typed Data v3 confirmation is displayed
        await verifyTransaction(driver, 'SENDING ETH');

        await driver.clickElement('[data-testid="previous-page"]');

        // Verify Sign Typed Data v3 confirmation is displayed
        assert.ok(await origin);
        assert.ok(await message);
      },
    );
  });

  it('initiates multiple signatures and rejects all', async function () {
    await withRedesignConfirmationFixtures(
      this.test?.fullTitle(),
      async ({
        driver,
        ganacheServer,
      }: {
        driver: Driver;
        ganacheServer: Ganache;
      }) => {
        await unlockWallet(driver);
        await openDapp(driver);
        await queueSignatures(driver);
        await driver.delay(regularDelayMs);

        await driver.clickElement('[data-testid="confirm-nav__reject-all"]');

        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        await verifyRejectionResults(driver, '#signTypedDataResult');
        await verifyRejectionResults(driver, '#signTypedDataV3Result');
        await verifyRejectionResults(driver, '#signTypedDataV4Result');
      },
    );
  });
});

async function verifyRejectionResults(driver: Driver, verifyResultId: string) {
  const rejectionResult = await driver.findElement(verifyResultId);
  assert.equal(
    await rejectionResult.getText(),
    'Error: User rejected the request.',
  );
}

async function verifySignedTypeV3Confirmation(
  driver: Driver,
  origin: WebElement,
) {
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

async function verifySignedTypeV4Confirmation(
  driver: Driver,
  origin: WebElement,
) {
  verifySignedTypeV3Confirmation(driver, origin);
  const attachment = driver.findElement({ text: '0x' });
  assert.ok(await attachment, 'attachment');
}

async function queueSignatures(driver: Driver) {
  await driver.clickElement('#signTypedData');
  await driver.waitUntilXWindowHandles(3);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

  await driver.clickElement('#signTypedDataV3');
  await driver.waitUntilXWindowHandles(3);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  await driver.waitUntilXWindowHandles(3);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

  await driver.clickElement('#signTypedDataV4');
  await driver.waitUntilXWindowHandles(3);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
}

async function queueSignaturesAndTransactions(driver: Driver) {
  await driver.clickElement('#signTypedData');
  await driver.waitUntilXWindowHandles(3);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  await driver.waitUntilXWindowHandles(3);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

  await driver.clickElement('#sendButton');
  await driver.waitUntilXWindowHandles(3);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  await driver.waitUntilXWindowHandles(3);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

  await driver.clickElement('#signTypedDataV3');
  await driver.waitUntilXWindowHandles(3);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
}

async function confirmAndVerifyResults(
  driver: Driver,
  publicAddress: string,
  verifyId: string,
  verifyResultId: string,
) {
  await confirm(driver);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement(verifyId);

  await driver.findElement(verifyResultId);
  const recoveredAddress = await driver.findElement(verifyResultId);

  assert.equal(await recoveredAddress.getText(), publicAddress);
}
async function verifyTransaction(
  driver: Driver,
  expectedTransactionType: String,
) {
  const transactionType = await driver.findElement('.confirm-page-container-summary__action__name',);
  assert.equal(await transactionType.getText(), expectedTransactionType);
}

async function confirmTransactionAndVerify(driver: Driver) {
  await confirm(driver);
}

async function confirm(driver: Driver) {
  await driver.waitUntilXWindowHandles(3);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.delay(regularDelayMs);
  await driver.clickElement('[data-testid="confirm-footer-button"]');
  await driver.waitUntilXWindowHandles(3);
}
