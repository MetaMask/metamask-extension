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
  assertPastedAddress,
  assertSignatureConfirmedMetrics,
  assertSignatureRejectedMetrics,
  clickHeaderInfoBtn,
  copyAddressAndPasteWalletAddress,
  openDappAndTriggerDeploy,
  SignatureType,
  triggerSignature,
} from './signature-helpers';

describe('Confirmation Signature - NFT Permit @no-mmi', function (this: Suite) {
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

        await openDappAndTriggerDeploy(driver);
        await driver.delay(1000);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.clickElement('[data-testid="confirm-footer-button"]');

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await driver.delay(1000);
        await triggerSignature(driver, SignatureType.NFTPermit);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await clickHeaderInfoBtn(driver);
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
        await openDappAndTriggerDeploy(driver);
        await driver.delay(1000);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.clickElement('[data-testid="confirm-footer-button"]');

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await driver.delay(1000);
        await triggerSignature(driver, SignatureType.NFTPermit);

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
    text: '0x581c3...45947',
  });

  const title = driver.findElement({ text: 'Withdrawal request' });
  const description = driver.findElement({
    text: 'This site wants permission to withdraw your NFTs',
  });
  const primaryType = driver.findElement({ text: 'Permit' });
  const spender = driver.findElement({
    css: '.name__value',
    text: '0x581c3...45947',
  });
  const tokenId = driver.findElement({ text: '3606393' });
  const nonce = driver.findElement({ text: '0' });
  const deadline = driver.findElement({ text: '23 December 2024, 23:03' });

  assert.ok(await origin, 'origin');
  assert.ok(await contractPetName, 'contractPetName');
  assert.ok(await title, 'title');
  assert.ok(await description, 'description');
  assert.ok(await primaryType, 'primaryType');
  assert.ok(await spender, 'spender');
  assert.ok(await tokenId, 'tokenId');
  assert.ok(await nonce, 'nonce');
  assert.ok(await deadline, 'deadline');
}

async function assertVerifiedResults(driver: Driver, publicAddress: string) {
  await driver.waitUntilXWindowHandles(2);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement('#sign721PermitVerify');

  await driver.waitForSelector({
    css: '#sign721PermitVerifyResult',
    text: publicAddress,
  });

  await driver.waitForSelector({
    css: '#sign721PermitResult',
    text: '0x572bc6300f6aa669e85e0a7792bc0b0803fb70c3c492226b30007ff7030b03600e390ef295a5a525d19f444943ae82697f0e5b5b0d77cc382cb2ea9486ec27801c',
  });

  await driver.waitForSelector({
    css: '#sign721PermitResultR',
    text: 'r: 0x572bc6300f6aa669e85e0a7792bc0b0803fb70c3c492226b30007ff7030b0360',
  });

  await driver.waitForSelector({
    css: '#sign721PermitResultS',
    text: 's: 0x0e390ef295a5a525d19f444943ae82697f0e5b5b0d77cc382cb2ea9486ec2780',
  });

  await driver.waitForSelector({
    css: '#sign721PermitResultV',
    text: 'v: 28',
  });

  await driver.waitForSelector({
    css: '#sign721PermitVerifyResult',
    text: publicAddress,
  });
}
