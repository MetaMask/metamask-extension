import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { MockedEndpoint } from 'mockttp';
import { DAPP_HOST_ADDRESS, WINDOW_TITLES } from '../../../helpers';
import { Ganache } from '../../../seeder/ganache';
import { Driver } from '../../../webdriver/driver';
import {
  mockSignatureApproved,
  mockSignatureRejected,
  scrollAndConfirmAndAssertConfirm,
  withRedesignConfirmationFixtures,
} from '../helpers';
import { TestSuiteArguments } from '../transactions/shared';
import {
  assertAccountDetailsMetrics,
  assertHeaderInfoBalance,
  assertPastedAddress,
  assertSignatureConfirmedMetrics,
  assertSignatureRejectedMetrics,
  clickHeaderInfoBtn,
  copyAddressAndPasteWalletAddress,
  openDappAndTriggerSignature,
  SignatureType,
} from './signature-helpers';

describe('Confirmation Signature - Sign Typed Data V3 @no-mmi', function (this: Suite) {
  it('initiates and confirms', async function () {
    await withRedesignConfirmationFixtures(
      this.test?.fullTitle(),
      async ({
        driver,
        ganacheServer,
        mockedEndpoint: mockedEndpoints,
      }: TestSuiteArguments) => {
        const addresses = await (ganacheServer as Ganache).getAccounts();
        const publicAddress = addresses?.[0] as string;

        await openDappAndTriggerSignature(
          driver,
          SignatureType.SignTypedDataV3,
        );

        await clickHeaderInfoBtn(driver);
        await assertHeaderInfoBalance(driver);

        await copyAddressAndPasteWalletAddress(driver);
        await assertPastedAddress(driver);
        await assertAccountDetailsMetrics(
          driver,
          mockedEndpoints as MockedEndpoint[],
          'eth_signTypedData_v3',
        );
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await assertInfoValues(driver);
        await scrollAndConfirmAndAssertConfirm(driver);
        await driver.delay(1000);
        await assertSignatureConfirmedMetrics({
          driver,
          mockedEndpoints: mockedEndpoints as MockedEndpoint[],
          signatureType: 'eth_signTypedData_v3',
        });
        await assertVerifiedResults(driver, publicAddress);
      },
      mockSignatureApproved,
    );
  });

  it('initiates and rejects', async function () {
    await withRedesignConfirmationFixtures(
      this.test?.fullTitle(),
      async ({
        driver,
        mockedEndpoint: mockedEndpoints,
      }: TestSuiteArguments) => {
        await openDappAndTriggerSignature(
          driver,
          SignatureType.SignTypedDataV3,
        );

        await driver.clickElement(
          '[data-testid="confirm-footer-cancel-button"]',
        );
        await driver.delay(1000);

        await assertSignatureRejectedMetrics({
          driver,
          mockedEndpoints: mockedEndpoints as MockedEndpoint[],
          signatureType: 'eth_signTypedData_v3',
          location: 'confirmation',
        });

        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        const rejectionResult = await driver.findElement(
          '#signTypedDataV3Result',
        );
        assert.equal(
          await rejectionResult.getText(),
          'Error: User rejected the request.',
        );
      },
      mockSignatureRejected,
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
  await driver.switchToWindowWithTitle('E2E Test Dapp');
  await driver.clickElement('#signTypedDataV3Verify');
  await driver.delay(500);

  const verifyResult = await driver.findElement('#signTypedDataV3Result');
  const verifyRecoverAddress = await driver.findElement(
    '#signTypedDataV3VerifyResult',
  );

  assert.equal(
    await verifyResult.getText(),
    '0x0a22f7796a2a70c8dc918e7e6eb8452c8f2999d1a1eb5ad714473d36270a40d6724472e5609948c778a07216bd082b60b6f6853d6354c731fd8ccdd3a2f4af261b',
  );
  assert.equal(await verifyRecoverAddress.getText(), publicAddress);
}
