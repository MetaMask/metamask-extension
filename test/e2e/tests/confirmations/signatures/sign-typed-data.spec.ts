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

describe('Confirmation Signature - Sign Typed Data @no-mmi', function (this: Suite) {
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
        await driver.clickElement('#signTypedData');
        await switchToNotificationWindow(driver);

        await clickHeaderInfoBtn(driver);
        await assertHeaderInfoBalance(driver);

        await copyAddressAndPasteWalletAddress(driver);
        await assertPastedAddress(driver);
        await assertAccountDetailsMetrics(
          driver,
          mockedEndpoints as MockedEndpoint[],
          'eth_signTypedData',
        );

        await assertInfoValues(driver);

        await driver.clickElement('[data-testid="confirm-footer-button"]');
        await driver.delay(1000);

        await assertSignatureMetrics(
          driver,
          mockedEndpoints as MockedEndpoint[],
          'eth_signTypedData',
        );

        await assertVerifiedResults(driver, publicAddress);
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
        await driver.clickElement('#signTypedData');
        await switchToNotificationWindow(driver);

        await driver.clickElement(
          '[data-testid="confirm-footer-cancel-button"]',
        );
        await driver.delay(1000);

        await assertSignatureMetrics(
          driver,
          mockedEndpoints as MockedEndpoint[],
          'eth_signTypedData',
        );

        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        const rejectionResult = await driver.waitForSelector({
          css: '#signTypedDataResult',
          text: 'Error: User rejected the request.',
        });
        assert.ok(rejectionResult);
      },
    );
  });
});

async function assertInfoValues(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  const origin = driver.findElement({ text: DAPP_HOST_ADDRESS });
  const message = driver.findElement({ text: 'Hi, Alice!' });

  assert.ok(await origin);
  assert.ok(await message);
}

async function assertVerifiedResults(driver: Driver, publicAddress: string) {
  await driver.waitUntilXWindowHandles(2);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement('#signTypedDataVerify');

  const result = await driver.findElement('#signTypedDataResult');
  await driver.waitForSelector({
    css: '#signTypedDataVerifyResult',
    text: publicAddress,
  });
  const verifyRecoverAddress = await driver.findElement(
    '#signTypedDataVerifyResult',
  );

  assert.equal(
    await result.getText(),
    '0x32791e3c41d40dd5bbfb42e66cf80ca354b0869ae503ad61cd19ba68e11d4f0d2e42a5835b0bfd633596b6a7834ef7d36033633a2479dacfdb96bda360d51f451b',
  );
  assert.equal(await verifyRecoverAddress.getText(), publicAddress);
}
