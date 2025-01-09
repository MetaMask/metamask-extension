import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import { Suite } from 'mocha';
import { MockedEndpoint } from 'mockttp';
import { WINDOW_TITLES } from '../../../helpers';
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
import PersonalSignConfirmation from '../../../page-objects/pages/confirmations/redesign/personal-sign-confirmation';
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

describe('Confirmation Signature - Personal Sign @no-mmi', function (this: Suite) {
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
        await initializePages(driver);

        await openDappAndTriggerSignature(driver, SignatureType.PersonalSign);

        await clickHeaderInfoBtn(driver);
        await assertHeaderInfoBalance();

        await copyAddressAndPasteWalletAddress(driver);
        await assertPastedAddress();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await assertInfoValues(driver);

        await scrollAndConfirmAndAssertConfirm(driver);

        await assertVerifiedPersonalMessage(driver, publicAddress);

        await assertAccountDetailsMetrics(
          driver,
          mockedEndpoints as MockedEndpoint[],
          'personal_sign',
        );
        await assertSignatureConfirmedMetrics({
          driver,
          mockedEndpoints: mockedEndpoints as MockedEndpoint[],
          signatureType: 'personal_sign',
        });
      },
      mockSignatureApproved,
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
        const confirmation = new PersonalSignConfirmation(driver);

        await initializePages(driver);
        await openDappAndTriggerSignature(driver, SignatureType.PersonalSign);

        await confirmation.clickFooterCancelButtonAndAndWaitForWindowToClose();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        await assertRejectedSignature();

        await assertSignatureRejectedMetrics({
          driver,
          mockedEndpoints: mockedEndpoints as MockedEndpoint[],
          signatureType: 'personal_sign',
          location: 'confirmation',
        });
      },
      mockSignatureRejected,
    );
  });
});

async function assertInfoValues(driver: Driver) {
  const personalSignConfirmation = new PersonalSignConfirmation(driver);
  personalSignConfirmation.verifyOrigin();
  personalSignConfirmation.verifyMessage();
}

async function assertVerifiedPersonalMessage(
  driver: Driver,
  publicAddress: string,
) {
  const testDapp = new TestDapp(driver);
  await driver.waitUntilXWindowHandles(2);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

  await testDapp.check_successPersonalSign(publicAddress);
  await testDapp.verifyPersonalSignSigUtilResult(publicAddress);
}
