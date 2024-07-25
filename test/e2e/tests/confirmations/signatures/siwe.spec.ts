import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { MockedEndpoint } from 'mockttp';
import {
  DAPP_HOST_ADDRESS,
  WINDOW_TITLES,
  openDapp,
  switchToNotificationWindow,
  unlockWallet,
} from '../../../helpers';
import { Driver } from '../../../webdriver/driver';
import {
  scrollAndConfirmAndAssertConfirm,
  withRedesignConfirmationFixtures,
} from '../helpers';
import { TestSuiteArguments } from '../transactions/shared';
import {
  assertAccountDetailsMetrics,
  assertHeaderInfoBalance,
  assertPastedAddress,
  assertSignatureMetrics,
  clickHeaderInfoBtn,
  copyAddressAndPasteWalletAddress,
} from './signature-helpers';

describe('Confirmation Signature - SIWE @no-mmi', function (this: Suite) {
  it('initiates and confirms', async function () {
    await withRedesignConfirmationFixtures(
      this.test?.fullTitle(),
      async ({
        driver,
        mockedEndpoint: mockedEndpoints,
      }: TestSuiteArguments) => {
        await unlockWallet(driver);
        await openDapp(driver);
        await driver.clickElement('#siwe');
        await switchToNotificationWindow(driver);

        await clickHeaderInfoBtn(driver);
        await assertHeaderInfoBalance(driver);

        await copyAddressAndPasteWalletAddress(driver);
        await assertPastedAddress(driver);
        await assertAccountDetailsMetrics(
          driver,
          mockedEndpoints as MockedEndpoint[],
          'personal_sign',
        );
        await switchToNotificationWindow(driver);
        await assertInfoValues(driver);
        await scrollAndConfirmAndAssertConfirm(driver);
        await driver.delay(1000);

        await assertVerifiedSiweMessage(
          driver,
          '0xef8674a92d62a1876624547bdccaef6c67014ae821de18fa910fbff56577a65830f68848585b33d1f4b9ea1c3da1c1b11553b6aabe8446717daf7cd1e38a68271c',
        );
        await assertSignatureMetrics(
          driver,
          mockedEndpoints as MockedEndpoint[],
          'personal_sign',
          '',
          ['redesigned_confirmation', 'sign_in_with_ethereum'],
        );
      },
    );
  });

  it('initiates and rejects', async function () {
    await withRedesignConfirmationFixtures(
      this.test?.fullTitle(),
      async ({
        driver,
        mockedEndpoint: mockedEndpoints,
      }: TestSuiteArguments) => {
        await unlockWallet(driver);
        await openDapp(driver);
        await driver.clickElement('#siwe');
        await switchToNotificationWindow(driver);

        await driver.clickElement(
          '[data-testid="confirm-footer-cancel-button"]',
        );

        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        const rejectionResult = await driver.findElement('#siweResult');
        assert.equal(
          await rejectionResult.getText(),
          'Error: User rejected the request.',
        );
        await assertSignatureMetrics(
          driver,
          mockedEndpoints as MockedEndpoint[],
          'personal_sign',
          '',
          ['redesigned_confirmation', 'sign_in_with_ethereum'],
        );
      },
    );
  });

  it('displays alert for domain binding and confirms', async function () {
    await withRedesignConfirmationFixtures(
      this.test?.fullTitle(),
      async ({ driver }: TestSuiteArguments) => {
        await unlockWallet(driver);
        await openDapp(driver);
        await driver.clickElement('#siweBadDomain');
        await switchToNotificationWindow(driver);

        const alert = await driver.findElement('[data-testid="inline-alert"]');
        assert.equal(await alert.getText(), 'Alert');
        await driver.clickElement('[data-testid="inline-alert"]');

        await driver.clickElement(
          '[data-testid="alert-modal-acknowledge-checkbox"]',
        );
        await driver.clickElement('[data-testid="alert-modal-button"]');

        await scrollAndConfirmAndAssertConfirm(driver);

        await driver.clickElement(
          '[data-testid="alert-modal-acknowledge-checkbox"]',
        );
        await driver.clickElement(
          '[data-testid="confirm-alert-modal-submit-button"]',
        );

        await assertVerifiedSiweMessage(
          driver,
          '0x24e559452c37827008633f9ae50c68cdb28e33f547f795af687839b520b022e4093c38bf1dfebda875ded715f2754d458ed62a19248e5a9bd2205bd1cb66f9b51b',
        );
      },
    );
  });
});

async function assertInfoValues(driver: Driver) {
  const origin = driver.findElement({ text: DAPP_HOST_ADDRESS });
  const message = driver.findElement({
    text: 'I accept the MetaMask Terms of Service: https://community.metamask.io/tos',
  });

  assert.ok(await origin);
  assert.ok(await message);
}

async function assertVerifiedSiweMessage(driver: Driver, message: string) {
  await driver.waitUntilXWindowHandles(2);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

  const verifySigUtil = await driver.findElement('#siweResult');
  assert.equal(await verifySigUtil.getText(), message);
}
