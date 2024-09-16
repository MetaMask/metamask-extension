import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { MockedEndpoint } from 'mockttp';
import { WINDOW_TITLES } from '../../../helpers';
import { Driver } from '../../../webdriver/driver';
import {
  mockSignatureRejected,
  scrollAndConfirmAndAssertConfirm,
  withRedesignConfirmationFixtures,
} from '../helpers';
import { TestSuiteArguments } from '../transactions/shared';
import {
  assertSignatureRejectedMetrics,
  openDappAndTriggerSignature,
  SignatureType,
} from './signature-helpers';

describe('Malicious Confirmation Signature - Bad Domain @no-mmi', function (this: Suite) {
  it('displays alert for domain binding and confirms', async function () {
    await withRedesignConfirmationFixtures(
      this.test?.fullTitle(),
      async ({ driver }: TestSuiteArguments) => {
        await openDappAndTriggerSignature(driver, SignatureType.SIWE_BadDomain);

        await verifyAlertIsDisplayed(driver);

        await acknowledgeAlert(driver);

        await scrollAndConfirmAndAssertConfirm(driver);

        await confirmFromAlertModal(driver);

        await assertVerifiedMessage(
          driver,
          '0x24e559452c37827008633f9ae50c68cdb28e33f547f795af687839b520b022e4093c38bf1dfebda875ded715f2754d458ed62a19248e5a9bd2205bd1cb66f9b51b',
        );
      },
    );
  });

  it('initiates and rejects from confirmation screen', async function () {
    await withRedesignConfirmationFixtures(
      this.test?.fullTitle(),
      async ({
        driver,
        mockedEndpoint: mockedEndpoints,
      }: TestSuiteArguments) => {
        await openDappAndTriggerSignature(driver, SignatureType.SIWE_BadDomain);

        await driver.clickElement(
          '[data-testid="confirm-footer-cancel-button"]',
        );

        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        const rejectionResult = await driver.waitForSelector({
          css: '#siweResult',
          text: 'Error: User rejected the request.',
        });
        assert.ok(rejectionResult);
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
        });
      },
      mockSignatureRejected,
    );
  });

  it('initiates and rejects from alert friction modal', async function () {
    await withRedesignConfirmationFixtures(
      this.test?.fullTitle(),
      async ({
        driver,
        mockedEndpoint: mockedEndpoints,
      }: TestSuiteArguments) => {
        await openDappAndTriggerSignature(driver, SignatureType.SIWE_BadDomain);

        await scrollAndConfirmAndAssertConfirm(driver);

        await driver.clickElement(
          '[data-testid="confirm-alert-modal-cancel-button"]',
        );
        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        const rejectionResult = await driver.waitForSelector({
          css: '#siweResult',
          text: 'Error: User rejected the request.',
        });
        assert.ok(rejectionResult);
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
            alert_resolved: [],
            alert_resolved_count: 0,
            alert_triggered: ['requestFrom'],
            alert_triggered_count: 1,
            alert_visualized: ['requestFrom'],
            alert_visualized_count: 1,
          },
        });
      },
      mockSignatureRejected,
    );
  });
});

async function confirmFromAlertModal(driver: Driver) {
  await driver.clickElement('[data-testid="alert-modal-acknowledge-checkbox"]');
  await driver.clickElement(
    '[data-testid="confirm-alert-modal-submit-button"]',
  );
}

async function acknowledgeAlert(driver: Driver) {
  await driver.clickElement('[data-testid="alert-modal-acknowledge-checkbox"]');
  await driver.clickElement('[data-testid="alert-modal-button"]');
}

async function verifyAlertIsDisplayed(driver: Driver) {
  await driver.clickElementSafe('.confirm-scroll-to-bottom__button');
  const alert = await driver.findElement('[data-testid="inline-alert"]');
  assert.equal(await alert.getText(), 'Alert');
  await driver.clickElement('[data-testid="inline-alert"]');
}

async function assertVerifiedMessage(driver: Driver, message: string) {
  await driver.waitUntilXWindowHandles(2);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

  const verifySigUtil = await driver.findElement('#siweResult');
  assert.equal(await verifySigUtil.getText(), message);
}
