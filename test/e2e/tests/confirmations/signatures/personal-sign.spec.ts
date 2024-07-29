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
import { Ganache } from '../../../seeder/ganache';
import { Driver } from '../../../webdriver/driver';
import { withRedesignConfirmationFixtures } from '../helpers';
import { TestSuiteArguments } from '../transactions/shared';
import {
  assertAccountDetailsMetrics,
  assertHeaderInfoBalance,
  assertPastedAddress,
  assertSignatureMetrics,
  clickHeaderInfoBtn,
  copyAddressAndPasteWalletAddress,
} from './signature-helpers';

describe('Confirmation Signature - Personal Sign @no-mmi', function (this: Suite) {
  it('initiates and confirms', async function () {
    await withRedesignConfirmationFixtures(
      this.test?.fullTitle(),
      async ({
        driver,
        ganacheServer,
        mockedEndpoint: mockedEndpoints,
      }: TestSuiteArguments) => {
        const addresses = await (ganacheServer as Ganache).getAccounts();
        const publicAddress = addresses?.[0] as string;

        await unlockWallet(driver);
        await openDapp(driver);
        await driver.clickElement('#personalSign');
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

        await driver.clickElement('[data-testid="confirm-footer-button"]');

        await assertVerifiedPersonalMessage(driver, publicAddress);
        await assertSignatureMetrics(
          driver,
          mockedEndpoints as MockedEndpoint[],
          'personal_sign',
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
        await driver.clickElement('#personalSign');
        await switchToNotificationWindow(driver);

        await driver.clickElement(
          '[data-testid="confirm-footer-cancel-button"]',
        );

        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        const rejectionResult = await driver.waitForSelector({
          css: '#personalSign',
          text: 'Error: User rejected the request.',
        });
        assert.ok(rejectionResult);
        await assertSignatureMetrics(
          driver,
          mockedEndpoints as MockedEndpoint[],
          'personal_sign',
        );
      },
    );
  });
});

async function assertInfoValues(driver: Driver) {
  const origin = driver.findElement({ text: DAPP_HOST_ADDRESS });
  const message = driver.findElement({
    text: 'Example `personal_sign` message',
  });

  assert.ok(await origin);
  assert.ok(await message);
}

async function assertVerifiedPersonalMessage(
  driver: Driver,
  publicAddress: string,
) {
  await driver.waitUntilXWindowHandles(2);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement('#personalSignVerify');

  const verifySigUtil = await driver.findElement(
    '#personalSignVerifySigUtilResult',
  );
  await driver.waitForSelector({
    css: '#personalSignVerifyECRecoverResult',
    text: publicAddress,
  });
  const verifyECRecover = await driver.findElement(
    '#personalSignVerifyECRecoverResult',
  );

  assert.equal(await verifySigUtil.getText(), publicAddress);
  assert.equal(await verifyECRecover.getText(), publicAddress);
}
