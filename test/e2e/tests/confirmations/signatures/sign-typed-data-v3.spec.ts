import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import {
  scrollAndConfirmAndAssertConfirm,
  withRedesignConfirmationFixtures,
} from '../helpers';
import {
  DAPP_HOST_ADDRESS,
  WINDOW_TITLES,
  openDapp,
  switchToNotificationWindow,
  unlockWallet,
} from '../../../helpers';
import { Ganache } from '../../../seeder/ganache';
import { Driver } from '../../../webdriver/driver';
import {
  assertHeaderInfoBalance,
  assertPastedAddress,
  clickHeaderInfoBtn,
  copyAddressAndPasteWalletAddress,
  assertSignatureMetrics,
  assertAccountDetailsMetrics,
} from './signature-helpers';

describe('Confirmation Signature - Sign Typed Data V3', function (this: Suite) {
  if (!process.env.ENABLE_CONFIRMATION_REDESIGN) {
    return;
  }

  it('initiates and confirms', async function () {
    await withRedesignConfirmationFixtures(
      async ({
        driver,
        ganacheServer,
        mockedEndpoint: mockedEndpoints,
      }: {
        driver: Driver;
        ganacheServer: Ganache;
        mockedEndpoint: unknown;
      }) => {
        const addresses = await ganacheServer.getAccounts();
        const publicAddress = addresses?.[0] as string;

        await unlockWallet(driver);
        await openDapp(driver);
        await driver.clickElement('#signTypedDataV3');
        await switchToNotificationWindow(driver);

        await clickHeaderInfoBtn(driver);
        await assertHeaderInfoBalance(driver);

        await copyAddressAndPasteWalletAddress(driver);
        await assertPastedAddress(driver);
        await assertAccountDetailsMetrics(
          driver,
          mockedEndpoints,
          'eth_signTypedData_v3',
        );
        await switchToNotificationWindow(driver);

        await assertInfoValues(driver);
        await scrollAndConfirmAndAssertConfirm(driver);
        await driver.delay(1000);
        await assertSignatureMetrics(
          driver,
          mockedEndpoints,
          'eth_signTypedData_v3',
        );
        await assertVerifiedResults(driver, publicAddress);
      },
      this.test?.fullTitle(),
    );
  });

  it('initiates and rejects', async function () {
    await withRedesignConfirmationFixtures(
      async ({
        driver,
        mockedEndpoint: mockedEndpoints,
      }: {
        driver: Driver;
        mockedEndpoint: unknown;
      }) => {
        await unlockWallet(driver);
        await openDapp(driver);
        await driver.clickElement('#signTypedDataV3');
        await switchToNotificationWindow(driver);

        await driver.clickElement(
          '[data-testid="confirm-footer-cancel-button"]',
        );
        await driver.delay(1000);

        await assertSignatureMetrics(
          driver,
          mockedEndpoints,
          'eth_signTypedData_v3',
        );

        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        const rejectionResult = await driver.waitForSelector({
          css: '#signTypedDataV3Result',
          text: 'Error: User rejected the request.',
        });
        assert.ok(rejectionResult);
      },
      this.test?.fullTitle(),
    );
  });
});

async function assertInfoValues(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  const origin = driver.findElement({ text: DAPP_HOST_ADDRESS });
  const contractPetName = driver.findElement({
    css: '.name__value',
    text: '0xCcCCc...ccccC',
  });

  const primaryType = driver.findElement({ text: 'Mail' });
  const fromName = driver.findElement({ text: 'Cow' });
  const fromAddress = driver.findElement({
    css: '.name__value',
    text: '0xCD2a3...DD826',
  });
  const toName = driver.findElement({ text: 'Bob' });
  const toAddress = driver.findElement({
    css: '.name__value',
    text: '0xbBbBB...bBBbB',
  });
  const contents = driver.findElement({ text: 'Hello, Bob!' });

  assert.ok(await origin, 'origin');
  assert.ok(await contractPetName, 'contractPetName');
  assert.ok(await primaryType, 'primaryType');
  assert.ok(await fromName, 'fromName');
  assert.ok(await fromAddress, 'fromAddress');
  assert.ok(await toName, 'toName');
  assert.ok(await toAddress, 'toAddress');
  assert.ok(await contents, 'contents');
}

async function assertVerifiedResults(driver: Driver, publicAddress: string) {
  await driver.waitUntilXWindowHandles(2);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement('#signTypedDataV3Verify');

  const verifyResult = await driver.findElement('#signTypedDataV3Result');
  await driver.waitForSelector({
    css: '#signTypedDataV3VerifyResult',
    text: publicAddress,
  });
  const verifyRecoverAddress = await driver.findElement(
    '#signTypedDataV3VerifyResult',
  );

  assert.equal(
    await verifyResult.getText(),
    '0x0a22f7796a2a70c8dc918e7e6eb8452c8f2999d1a1eb5ad714473d36270a40d6724472e5609948c778a07216bd082b60b6f6853d6354c731fd8ccdd3a2f4af261b',
  );
  assert.equal(await verifyRecoverAddress.getText(), publicAddress);
}
