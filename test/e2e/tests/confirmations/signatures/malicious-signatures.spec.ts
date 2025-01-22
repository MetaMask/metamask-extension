import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import { Suite } from 'mocha';
import { MockedEndpoint } from 'mockttp';
import { WINDOW_TITLES } from '../../../helpers';
import {
  mockSignatureRejected,
  scrollAndConfirmAndAssertConfirm,
  withTransactionEnvelopeTypeFixtures,
} from '../helpers';
import { TestSuiteArguments } from '../transactions/shared';
import Confirmation from '../../../page-objects/pages/confirmations/redesign/confirmation';
import ConfirmAlertModal from '../../../page-objects/pages/dialog/confirm-alert';
import {
  BlockaidReason,
  BlockaidResultType,
} from '../../../../../shared/constants/security-provider';
import {
  assertRejectedSignature,
  assertSignatureRejectedMetrics,
  assertVerifiedSiweMessage,
  initializePages,
  openDappAndTriggerSignature,
  SignatureType,
} from './signature-helpers';

describe('Malicious Confirmation Signature - Bad Domain @no-mmi', function (this: Suite) {
  it('displays alert for domain binding and confirms', async function () {
    await withTransactionEnvelopeTypeFixtures(
      this.test?.fullTitle(),
      TransactionEnvelopeType.legacy,
      async ({ driver }: TestSuiteArguments) => {
        await initializePages(driver);
        const confirmation = new Confirmation(driver);
        const alertModal = new ConfirmAlertModal(driver);

        await openDappAndTriggerSignature(driver, SignatureType.SIWE_BadDomain);

        await confirmation.clickScrollToBottomButton();
        await confirmation.clickInlineAlert();

        await alertModal.acknowledgeAlert();

        await scrollAndConfirmAndAssertConfirm(driver);

        await alertModal.confirmFromAlertModal();

        await assertVerifiedSiweMessage(
          driver,
          '0x24e559452c37827008633f9ae50c68cdb28e33f547f795af687839b520b022e4093c38bf1dfebda875ded715f2754d458ed62a19248e5a9bd2205bd1cb66f9b51b',
        );
      },
    );
  });

  it('initiates and rejects from confirmation screen', async function () {
    await withTransactionEnvelopeTypeFixtures(
      this.test?.fullTitle(),
      TransactionEnvelopeType.legacy,
      async ({
        driver,
        mockedEndpoint: mockedEndpoints,
      }: TestSuiteArguments) => {
        await initializePages(driver);
        const confirmation = new Confirmation(driver);

        await openDappAndTriggerSignature(driver, SignatureType.SIWE_BadDomain);

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
          expectedProps: {
            alert_action_clicked: [],
            alert_key_clicked: [],
            alert_resolved: [],
            alert_resolved_count: 0,
            alert_triggered: ['requestFrom'],
            alert_triggered_count: 1,
            alert_visualized: [],
            alert_visualized_count: 0,
          },
          securityAlertReason: BlockaidReason.notApplicable,
          securityAlertResponse: BlockaidResultType.NotApplicable,
        });
      },
      mockSignatureRejected,
    );
  });

  it('initiates and rejects from alert friction modal', async function () {
    await withTransactionEnvelopeTypeFixtures(
      this.test?.fullTitle(),
      TransactionEnvelopeType.legacy,
      async ({
        driver,
        mockedEndpoint: mockedEndpoints,
      }: TestSuiteArguments) => {
        await initializePages(driver);
        const alertModal = new ConfirmAlertModal(driver);

        await openDappAndTriggerSignature(driver, SignatureType.SIWE_BadDomain);

        await scrollAndConfirmAndAssertConfirm(driver);

        await alertModal.acknowledgeAlert();

        await alertModal.rejectFromAlertModal();

        await driver.waitUntilXWindowHandles(2);
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
          location: 'alert_friction_modal',
          expectedProps: {
            alert_action_clicked: [],
            alert_key_clicked: [],
            alert_resolved: ['requestFrom'],
            alert_resolved_count: 1,
            alert_triggered: ['requestFrom'],
            alert_triggered_count: 1,
            alert_visualized: ['requestFrom'],
            alert_visualized_count: 1,
          },
          securityAlertReason: BlockaidReason.notApplicable,
          securityAlertResponse: BlockaidResultType.NotApplicable,
        });
      },
      mockSignatureRejected,
    );
  });
});
