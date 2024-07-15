import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import {
  scrollAndConfirmAndAssertConfirm,
  withRedesignConfirmationFixtures,
} from '../helpers';
import {
  DAPP_HOST_ADDRESS,
  WINDOW_TITLES,
  openDapp,
  switchToNotificationWindow,
  unlockWallet,
} from '../../../helpers';
import { Ganache } from '../../../seeder/ganache';
import { Driver } from '../../../webdriver/driver';
import { Mockttp } from '../../../mock-e2e';
import {
  assertHeaderInfoBalance,
  assertPastedAddress,
  clickHeaderInfoBtn,
  copyAddressAndPasteWalletAddress,
  assertSignatureMetrics,
  assertAccountDetailsMetrics,
} from './signature-helpers';

describe('Confirmation Signature - SIWE', function (this: Suite) {
  if (!process.env.ENABLE_CONFIRMATION_REDESIGN) {
    return;
  }

  it('initiates and confirms', async function () {
    await withRedesignConfirmationFixtures(
      this.test?.fullTitle(),
      async ({
        driver,
        ganacheServer,
        mockedEndpoint: mockedEndpoints,
      }: {
        driver: Driver;
        ganacheServer: Ganache;
        mockedEndpoint: Mockttp;
      }) => {
        const addresses = await ganacheServer.getAccounts();
        const publicAddress = addresses?.[0] as string;

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
          mockedEndpoints,
          'personal_sign',
        );
        await switchToNotificationWindow(driver);
        await assertInfoValues(driver);
        await scrollAndConfirmAndAssertConfirm(driver);
        await driver.delay(1000);

        await assertVerifiedSiweMessage(driver);
        await assertSignatureMetrics(
          driver,
          mockedEndpoints,
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
      }: {
        driver: Driver;
        mockedEndpoint: Mockttp;
      }) => {
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
          mockedEndpoints,
          'personal_sign',
          '',
          ['redesigned_confirmation', 'sign_in_with_ethereum'],
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

async function assertVerifiedSiweMessage(
  driver: Driver,
) {
  await driver.waitUntilXWindowHandles(2);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

  const verifySigUtil = await driver.findElement('#siweResult');
  assert.equal(
    await verifySigUtil.getText(),
    '0xef8674a92d62a1876624547bdccaef6c67014ae821de18fa910fbff56577a65830f68848585b33d1f4b9ea1c3da1c1b11553b6aabe8446717daf7cd1e38a68271c',
  );
}
