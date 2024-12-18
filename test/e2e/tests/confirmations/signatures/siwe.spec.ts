import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import { Suite } from 'mocha';
import { MockedEndpoint } from 'mockttp';
import { WINDOW_TITLES } from '../../../helpers';
import { Driver } from '../../../webdriver/driver';
import {
  mockSignatureApproved,
  mockSignatureRejected,
  scrollAndConfirmAndAssertConfirm,
  withTransactionEnvelopeTypeFixtures,
} from '../helpers';
import { TestSuiteArguments } from '../transactions/shared';
import PersonalSignConfirmation from '../../../page-objects/pages/confirmations/redesign/personal-sign-confirmation';
import {
  BlockaidReason,
  BlockaidResultType,
} from '../../../../../shared/constants/security-provider';
import {
  assertAccountDetailsMetrics,
  assertHeaderInfoBalance,
  assertPastedAddress,
  assertRejectedSignature,
  assertSignatureConfirmedMetrics,
  assertSignatureRejectedMetrics,
  assertVerifiedSiweMessage,
  clickHeaderInfoBtn,
  copyAddressAndPasteWalletAddress,
  initializePages,
  openDappAndTriggerSignature,
  SignatureType,
} from './signature-helpers';

describe('Confirmation Signature - SIWE @no-mmi', function (this: Suite) {
  it('initiates and confirms', async function () {
    await withTransactionEnvelopeTypeFixtures(
      this.test?.fullTitle(),
      TransactionEnvelopeType.legacy,
      async ({
        driver,
        mockedEndpoint: mockedEndpoints,
      }: TestSuiteArguments) => {
        await initializePages(driver);
        await openDappAndTriggerSignature(driver, SignatureType.SIWE);

        await clickHeaderInfoBtn(driver);
        await assertHeaderInfoBalance();

        await copyAddressAndPasteWalletAddress(driver);
        await assertPastedAddress();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await assertInfoValues(driver);
        await scrollAndConfirmAndAssertConfirm(driver);

        await assertVerifiedSiweMessage(
          driver,
          '0xef8674a92d62a1876624547bdccaef6c67014ae821de18fa910fbff56577a65830f68848585b33d1f4b9ea1c3da1c1b11553b6aabe8446717daf7cd1e38a68271c',
        );

        await assertAccountDetailsMetrics(
          driver,
          mockedEndpoints as MockedEndpoint[],
          'personal_sign',
        );

        await assertAccountDetailsMetrics(
          driver,
          mockedEndpoints as MockedEndpoint[],
          'personal_sign',
        );
        await assertSignatureConfirmedMetrics({
          driver,
          mockedEndpoints: mockedEndpoints as MockedEndpoint[],
          signatureType: 'personal_sign',
          uiCustomizations: [
            'redesigned_confirmation',
            'sign_in_with_ethereum',
          ],
          securityAlertReason: BlockaidReason.notApplicable,
          securityAlertResponse: BlockaidResultType.NotApplicable,
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
        await initializePages(driver);
        const confirmation = new PersonalSignConfirmation(driver);
        await openDappAndTriggerSignature(driver, SignatureType.SIWE);

        await confirmation.clickFooterCancelButtonAndAndWaitForWindowToClose();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        await assertRejectedSignature();
        await assertSignatureRejectedMetrics({
          driver,
          mockedEndpoints: mockedEndpoints as MockedEndpoint[],
          signatureType: 'personal_sign',
          uiCustomizations: [
            'redesigned_confirmation',
            'sign_in_with_ethereum',
          ],
          location: 'confirmation',
          securityAlertReason: BlockaidReason.notApplicable,
          securityAlertResponse: BlockaidResultType.NotApplicable,
        });
      },
      mockSignatureRejected,
    );
  });
});

async function assertInfoValues(driver: Driver) {
  const confirmation = new PersonalSignConfirmation(driver);
  await confirmation.clickCollapseSectionButton();
  await confirmation.verifyOrigin();
  await confirmation.verifySiweMessage();
}
