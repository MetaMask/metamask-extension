import { strict as assert } from 'assert';
import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import { Suite } from 'mocha';
import { MockedEndpoint } from 'mockttp';
import { DAPP_HOST_ADDRESS, WINDOW_TITLES } from '../../../helpers';
import { Ganache } from '../../../seeder/ganache';
import { Driver } from '../../../webdriver/driver';
import {
  mockSignatureApproved,
  mockSignatureRejected,
  scrollAndConfirmAndAssertConfirm,
  withTransactionEnvelopeTypeFixtures,
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

describe('Confirmation Signature - Sign Typed Data V4 @no-mmi', function (this: Suite) {
  it('initiates and confirms', async function () {
    await withTransactionEnvelopeTypeFixtures(
      this.test?.fullTitle(),
      TransactionEnvelopeType.legacy,
      async ({
        driver,
        ganacheServer,
        mockedEndpoint: mockedEndpoints,
      }: TestSuiteArguments) => {
        const addresses = await (ganacheServer as Ganache).getAccounts();
        const publicAddress = addresses?.[0] as string;

        await openDappAndTriggerSignature(
          driver,
          SignatureType.SignTypedDataV4,
        );

        await clickHeaderInfoBtn(driver);
        await assertHeaderInfoBalance(driver);

        await copyAddressAndPasteWalletAddress(driver);
        await assertPastedAddress(driver);

        await assertInfoValues(driver);
        await scrollAndConfirmAndAssertConfirm(driver);

        await assertAccountDetailsMetrics(
          driver,
          mockedEndpoints as MockedEndpoint[],
          'eth_signTypedData_v4',
        );

        await assertSignatureConfirmedMetrics({
          driver,
          mockedEndpoints: mockedEndpoints as MockedEndpoint[],
          signatureType: 'eth_signTypedData_v4',
          primaryType: 'Mail',
          withAnonEvents: true,
        });

        await assertVerifiedResults(driver, publicAddress);
      },
      async (mockServer) => {
        return await mockSignatureApproved(mockServer, true);
      },
    );
  });

  it('initiates and rejects', async function () {
    await withTransactionEnvelopeTypeFixtures(
      this.test?.fullTitle(),
      TransactionEnvelopeType.legacy,
      async ({
        driver,
        mockedEndpoint: mockedEndpoints,
      }: TestSuiteArguments) => {
        await openDappAndTriggerSignature(
          driver,
          SignatureType.SignTypedDataV4,
        );

        await driver.clickElementAndWaitForWindowToClose(
          '[data-testid="confirm-footer-cancel-button"]',
        );

        await assertSignatureRejectedMetrics({
          driver,
          mockedEndpoints: mockedEndpoints as MockedEndpoint[],
          signatureType: 'eth_signTypedData_v4',
          primaryType: 'Mail',
          location: 'confirmation',
        });

        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        const rejectionResult = await driver.waitForSelector({
          css: '#signTypedDataV4Result',
          text: 'Error: User rejected the request.',
        });
        assert.ok(rejectionResult);
      },
      async (mockServer) => {
        return await mockSignatureRejected(mockServer, true);
      },
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
  const contents = driver.findElement({ text: 'Hello, Bob!' });
  const fromName = driver.findElement({ text: 'Cow' });
  const fromAddressNum0 = driver.findElement({
    css: '.name__value',
    text: '0xCD2a3...DD826',
  });
  const toName = driver.findElement({ text: 'Bob' });
  const toAddressNum2 = driver.findElement({
    css: '.name__value',
    text: '0xB0B0b...00000',
  });
  const attachment = driver.findElement({ text: '0x' });

  assert.ok(await origin, 'origin');
  assert.ok(await contractPetName, 'contractPetName');
  assert.ok(await primaryType, 'primaryType');
  assert.ok(await contents, 'contents');
  assert.ok(await fromName, 'fromName');
  assert.ok(await fromAddressNum0, 'fromAddressNum0');
  assert.ok(await toName, 'toName');
  assert.ok(await toAddressNum2, 'toAddressNum2');
  assert.ok(await attachment, 'attachment');
}

async function assertVerifiedResults(driver: Driver, publicAddress: string) {
  await driver.waitUntilXWindowHandles(2);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement('#signTypedDataV4Verify');

  await driver.waitForSelector({
    css: '#signTypedDataV4Result',
    text: '0xcd2f9c55840f5e1bcf61812e93c1932485b524ca673b36355482a4fbdf52f692684f92b4f4ab6f6c8572dacce46bd107da154be1c06939b855ecce57a1616ba71b',
  });

  await driver.waitForSelector({
    css: '#signTypedDataV4VerifyResult',
    text: publicAddress,
  });
}
