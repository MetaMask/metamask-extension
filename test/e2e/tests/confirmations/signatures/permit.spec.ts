import { strict as assert } from 'assert';
import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import { Suite } from 'mocha';
import { MockedEndpoint } from 'mockttp';
import {
  DAPP_HOST_ADDRESS,
  openDapp,
  unlockWallet,
  WINDOW_TITLES,
} from '../../../helpers';
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

describe('Confirmation Signature - Permit @no-mmi', function (this: Suite) {
  it('initiates and confirms and emits the correct events', async function () {
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

        await openDappAndTriggerSignature(driver, SignatureType.Permit);

        await clickHeaderInfoBtn(driver);
        await assertHeaderInfoBalance(driver);

        await copyAddressAndPasteWalletAddress(driver);
        await assertPastedAddress(driver);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await assertInfoValues(driver);
        await scrollAndConfirmAndAssertConfirm(driver);
        await driver.delay(1000);

        await assertAccountDetailsMetrics(
          driver,
          mockedEndpoints as MockedEndpoint[],
          'eth_signTypedData_v4',
        );

        await assertSignatureConfirmedMetrics({
          driver,
          mockedEndpoints: mockedEndpoints as MockedEndpoint[],
          signatureType: 'eth_signTypedData_v4',
          primaryType: 'Permit',
          uiCustomizations: ['redesigned_confirmation', 'permit'],
        });

        await assertVerifiedResults(driver, publicAddress);
      },
      mockSignatureApproved,
    );
  });

  it('initiates and rejects and emits the correct events', async function () {
    await withTransactionEnvelopeTypeFixtures(
      this.test?.fullTitle(),
      TransactionEnvelopeType.legacy,
      async ({
        driver,
        mockedEndpoint: mockedEndpoints,
      }: TestSuiteArguments) => {
        await unlockWallet(driver);
        await openDapp(driver);
        await driver.clickElement('#signPermit');
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.clickElementAndWaitForWindowToClose(
          '[data-testid="confirm-footer-cancel-button"]',
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        await driver.waitForSelector({
          tag: 'span',
          text: 'Error: User rejected the request.',
        });

        await assertSignatureRejectedMetrics({
          driver,
          mockedEndpoints: mockedEndpoints as MockedEndpoint[],
          signatureType: 'eth_signTypedData_v4',
          primaryType: 'Permit',
          uiCustomizations: ['redesigned_confirmation', 'permit'],
          location: 'confirmation',
        });
      },
      mockSignatureRejected,
    );
  });
});

async function assertInfoValues(driver: Driver) {
  await driver.clickElement('[data-testid="sectionCollapseButton"]');
  const origin = driver.findElement({ text: DAPP_HOST_ADDRESS });
  const contractPetName = driver.findElement({
    css: '.name__value',
    text: '0xCcCCc...ccccC',
  });

  const primaryType = driver.findElement({ text: 'Permit' });
  const owner = driver.findElement({ css: '.name__name', text: 'Account 1' });
  const spender = driver.findElement({
    css: '.name__value',
    text: '0x5B38D...eddC4',
  });
  const value = driver.findElement({ text: '3,000' });
  const nonce = driver.findElement({ text: '0' });
  const deadline = driver.findElement({ text: '09 June 3554, 16:53' });

  assert.ok(await origin, 'origin');
  assert.ok(await contractPetName, 'contractPetName');
  assert.ok(await primaryType, 'primaryType');
  assert.ok(await owner, 'owner');
  assert.ok(await spender, 'spender');
  assert.ok(await value, 'value');
  assert.ok(await nonce, 'nonce');
  assert.ok(await deadline, 'deadline');
}

async function assertVerifiedResults(driver: Driver, publicAddress: string) {
  await driver.waitUntilXWindowHandles(2);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement('#signPermitVerify');

  await driver.waitForSelector({
    css: '#signPermitVerifyResult',
    text: publicAddress,
  });

  await driver.waitForSelector({
    css: '#signPermitResult',
    text: '0xf6555e4cc39bdec3397c357af876f87de00667c942f22dec555c28d290ed7d730103fe85c9d7c66d808a0a972f69ae00741a11df449475280772e7d9a232ea491b',
  });

  await driver.waitForSelector({
    css: '#signPermitResultR',
    text: 'r: 0xf6555e4cc39bdec3397c357af876f87de00667c942f22dec555c28d290ed7d73',
  });

  await driver.waitForSelector({
    css: '#signPermitResultS',
    text: 's: 0x0103fe85c9d7c66d808a0a972f69ae00741a11df449475280772e7d9a232ea49',
  });

  await driver.waitForSelector({
    css: '#signPermitResultV',
    text: 'v: 27',
  });
  await driver.waitForSelector({
    css: '#signPermitVerifyResult',
    text: publicAddress,
  });
}
