import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { MockedEndpoint } from 'mockttp';
import {
  DAPP_HOST_ADDRESS,
  WINDOW_TITLES,
  openDapp,
  unlockWallet,
} from '../../../helpers';
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

describe('Confirmation Signature - Permit @no-mmi', function (this: Suite) {
  it('initiates and confirms and emits the correct events', async function () {
    await withRedesignConfirmationFixtures(
      this.test?.fullTitle(),
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
        await assertAccountDetailsMetrics(
          driver,
          mockedEndpoints as MockedEndpoint[],
          'eth_signTypedData_v4',
        );

        await copyAddressAndPasteWalletAddress(driver);
        await assertPastedAddress(driver);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await assertInfoValues(driver);
        await scrollAndConfirmAndAssertConfirm(driver);
        await driver.delay(1000);

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
    await withRedesignConfirmationFixtures(
      this.test?.fullTitle(),
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

        const rejectionResult = await driver.findElement('#signPermitResult');
        assert.equal(
          await rejectionResult.getText(),
          'Error: User rejected the request.',
        );

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
  const deadline = driver.findElement({ text: '02 August 1971, 16:53' });

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

  const verifyResult = await driver.findElement('#signPermitResult');
  const verifyResultR = await driver.findElement('#signPermitResultR');
  const verifyResultS = await driver.findElement('#signPermitResultS');
  const verifyResultV = await driver.findElement('#signPermitResultV');

  await driver.waitForSelector({
    css: '#signPermitVerifyResult',
    text: publicAddress,
  });
  const verifyRecoverAddress = await driver.findElement(
    '#signPermitVerifyResult',
  );

  assert.equal(
    await verifyResult.getText(),
    '0x0a396f89ee073214f7e055e700048abd7b4aba6ecca0352937d6a2ebb7176f2f43c63097ad7597632e34d6a801695702ba603d5872a33ee7d7562fcdb9e816ee1c',
  );
  assert.equal(
    await verifyResultR.getText(),
    'r: 0x0a396f89ee073214f7e055e700048abd7b4aba6ecca0352937d6a2ebb7176f2f',
  );
  assert.equal(
    await verifyResultS.getText(),
    's: 0x43c63097ad7597632e34d6a801695702ba603d5872a33ee7d7562fcdb9e816ee',
  );
  assert.equal(await verifyResultV.getText(), 'v: 28');
  assert.equal(await verifyRecoverAddress.getText(), publicAddress);
}
