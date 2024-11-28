import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import { Suite } from 'mocha';
import { MockedEndpoint } from 'mockttp';
import { openDapp, unlockWallet, WINDOW_TITLES } from '../../../helpers';
import { Ganache } from '../../../seeder/ganache';
import { Driver } from '../../../webdriver/driver';
import {
  mockSignatureApproved,
  mockSignatureRejected,
  scrollAndConfirmAndAssertConfirm,
  withTransactionEnvelopeTypeFixtures,
} from '../helpers';
import { TestSuiteArguments } from '../transactions/shared';
import TestDapp from '../../../page-objects/pages/test-dapp';
import Confirmation from '../../../page-objects/pages/confirmations/redesign/confirmation';
import PermitConfirmation from '../../../page-objects/pages/confirmations/redesign/permit-confirmation';
import {
  assertAccountDetailsMetrics,
  assertHeaderInfoBalance,
  assertPastedAddress,
  assertRejectedSignature,
  assertSignatureConfirmedMetrics,
  assertSignatureRejectedMetrics,
  clickHeaderInfoBtn,
  copyAddressAndPasteWalletAddress,
  initializePages,
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
        await initializePages(driver);

        await openDappAndTriggerSignature(driver, SignatureType.Permit);

        await clickHeaderInfoBtn(driver);
        await assertHeaderInfoBalance();

        await copyAddressAndPasteWalletAddress(driver);
        await assertPastedAddress();
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
        const testDapp = new TestDapp(driver);
        const confirmation = new Confirmation(driver);
        await unlockWallet(driver);
        await openDapp(driver);
        await testDapp.clickPermit();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await confirmation.clickFooterCancelButtonAndAndWaitForWindowToClose();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        await assertRejectedSignature();

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
  const permitConfirmation = new PermitConfirmation(driver);
  await permitConfirmation.clickCollapseSectionButton();
  await permitConfirmation.verifyOrigin();
  await permitConfirmation.verifyContractPetName();
  await permitConfirmation.verifyPrimaryType();
  await permitConfirmation.verifyOwner();
  await permitConfirmation.verifySpender();
  await permitConfirmation.verifyValue();
  await permitConfirmation.verifyNonce();
  await permitConfirmation.verifyDeadline();
}

async function assertVerifiedResults(driver: Driver, publicAddress: string) {
  const testDapp = new TestDapp(driver);
  const expectedSignature =
    '0xf6555e4cc39bdec3397c357af876f87de00667c942f22dec555c28d290ed7d730103fe85c9d7c66d808a0a972f69ae00741a11df449475280772e7d9a232ea491b';
  const expectedR =
    '0xf6555e4cc39bdec3397c357af876f87de00667c942f22dec555c28d290ed7d73';
  const expectedS =
    '0x0103fe85c9d7c66d808a0a972f69ae00741a11df449475280772e7d9a232ea49';
  const expectedV = '27';

  await driver.waitUntilXWindowHandles(2);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

  await testDapp.check_successSignPermit(publicAddress);
  await testDapp.verifySignPermitResult(expectedSignature);
  await testDapp.verifySignPermitResultR(expectedR);
  await testDapp.verifySignPermitResultS(expectedS);
  await testDapp.verifySignPermitResultV(expectedV);
}
