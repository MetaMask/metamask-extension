import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { withRedesignConfirmationFixtures } from '../helper-fixture';
import {
  DAPP_URL_WITHOUT_SCHEMA,
  WINDOW_TITLES,
  openDapp,
  switchToNotificationWindow,
  unlockWallet,
} from '../../../helpers';
import { Ganache } from '../../../seeder/ganache';
import { Driver } from '../../../webdriver/driver';
import { assertMetrics } from './signature-helpers';

describe('Confirmation Signature - Sign Typed Data', function (this: Suite) {
  if (!process.env.ENABLE_CONFIRMATION_REDESIGN) {
    return;
  }

  it('initiates and confirms and emits the correct events', async function () {
    await withRedesignConfirmationFixtures(
      this.test?.fullTitle(),
      async ({
        driver,
        ganacheServer,
        mockedEndpoint: mockedEndpoints,
      }: {
        driver: Driver;
        ganacheServer: Ganache;
        mockedEndpoint: any;
      }) => {
        const addresses = await ganacheServer.getAccounts();
        const publicAddress = addresses?.[0] as string;

        await unlockWallet(driver);
        await openDapp(driver);
        await driver.clickElement('#signTypedData');
        await switchToNotificationWindow(driver);

        await clickHeaderInfoBtn(driver);
        await assertHeaderInfoBalance(driver);

        await copyAddressAndPasteWalletAddress(driver);
        await assertPastedAddress(driver);

        await assertSignatureDetails(driver);

        await driver.clickElement('[data-testid="confirm-footer-button"]');
        await assertMetrics(driver, mockedEndpoints, 'eth_signTypedData');

        await assertVerifiedResults(driver, publicAddress);
      },
    );
  });

  it('initiates and rejects and emits the correct events', async function () {
    await withRedesignConfirmationFixtures(
      this.test?.fullTitle(),
      async ({
        driver,
        ganacheServer,
        mockedEndpoint: mockedEndpoints,
      }: {
        driver: Driver;
        ganacheServer: Ganache;
        mockedEndpoint: any;
      }) => {
        const addresses = await ganacheServer.getAccounts();
        const publicAddress = addresses?.[0] as string;

        await unlockWallet(driver);
        await openDapp(driver);
        await driver.clickElement('#signTypedData');
        await switchToNotificationWindow(driver);
        await driver.clickElement(
          '[data-testid="confirm-footer-cancel-button"]',
        );
        await assertMetrics(driver, mockedEndpoints, 'eth_signTypedData');

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        const rejectionResult = await driver.findElement(
          '#signTypedDataResult',
        );
        assert.equal(
          await rejectionResult.getText(),
          'Error: User rejected the request.',
        );
      },
    );
  });
});

async function assertSignatureDetails(driver: Driver) {
  const origin = driver.findElement({ text: DAPP_URL_WITHOUT_SCHEMA });
  const message = driver.findElement({ text: 'Hi, Alice!' });

  assert.ok(await origin);
  assert.ok(await message);
}

async function assertVerifiedResults(driver: Driver, publicAddress: string) {
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
function clickHeaderInfoBtn(driver: Driver) {
  throw new Error('Function not implemented.');
}

function assertHeaderInfoBalance(driver: Driver) {
  throw new Error('Function not implemented.');
}

function copyAddressAndPasteWalletAddress(driver: Driver) {
  throw new Error('Function not implemented.');
}

function assertPastedAddress(driver: Driver) {
  throw new Error('Function not implemented.');
}

