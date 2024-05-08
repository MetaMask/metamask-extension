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
import { assertAccountDetailsMetrics, assertHeaderInfoBalance, assertPastedAddress, assertSignatureMetrics, clickHeaderInfoBtn, copyAddressAndPasteWalletAddress } from './signature-helpers';

describe('Confirmation Signature - Sign Typed Data V4', function (this: Suite) {
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
        await driver.clickElement('#signTypedDataV4');
        await switchToNotificationWindow(driver);

        await clickHeaderInfoBtn(driver);
        await assertHeaderInfoBalance(driver);

        await copyAddressAndPasteWalletAddress(driver);
        await assertPastedAddress(driver);

        await assertSignatureDetails(driver);

        await driver.clickElement('[data-testid="confirm-footer-button"]');

        await assertSignatureMetrics(
          driver,
          mockedEndpoints,
          'eth_signTypedData_v4',
        );

        await assertAccountDetailsMetrics(driver, mockedEndpoints,  'eth_signTypedData_v4');
        /**
         * TODO: test scroll and fixing scroll
         * @see {@link https://github.com/MetaMask/MetaMask-planning/issues/2458}
         */
        // test "confirm-footer-button" is disabled and unclickable
        //
        // await driver.clickElement('.confirm-scroll-to-bottom__button');
        // await driver.clickElement('[data-testid="confirm-footer-button"]');

        await assertVerifiedResults(driver, publicAddress);
      },
    );
  });

  it('initiates and rejects and emits the correct endpoints', async function () {
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
        await driver.clickElement('#signTypedDataV4');
        await switchToNotificationWindow(driver);
        await driver.clickElement(
          '[data-testid="confirm-footer-cancel-button"]',
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        const rejectionResult = await driver.findElement(
          '#signTypedDataV4Result',
        );
        await assertSignatureMetrics(
          driver,
          mockedEndpoints,
          'eth_signTypedData_v4',
        );

        await assertAccountDetailsMetrics(driver, mockedEndpoints, 'personal_sign');

        assert.equal(
          await rejectionResult.getText(),
          'Error: User rejected the request.',
        );
      },
    );
  });
});

async function assertSignatureDetails(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  const origin = driver.findElement({ text: DAPP_URL_WITHOUT_SCHEMA });
  const contractPetName = driver.findElement({
    css: '.name__value',
    text: '0xCcCCc...ccccC',
  });

  const primaryType = driver.findElement({ text: 'Mail' });
  const contents = driver.findElement({ text: 'Hello, Bob!' });

  const fromName = driver.findElement({ text: 'Cow' });
  const fromAddressNum0 = driver.findElement({
    css: '.name__value',
    text: '0xCD2a3...DD826',
  });
  const toName = driver.findElement({ text: 'Bob' });
  const toAddressNum2 = driver.findElement({
    css: '.name__value',
    text: '0xB0B0b...00000',
  });
  const attachment = driver.findElement({ text: '0x' });

  assert.ok(await origin, 'origin');
  assert.ok(await contractPetName, 'contractPetName');

  assert.ok(await primaryType, 'primaryType');
  assert.ok(await contents, 'contents');
  assert.ok(await fromName, 'fromName');
  assert.ok(await fromAddressNum0, 'fromAddressNum0');
  assert.ok(await toName, 'toName');
  assert.ok(await toAddressNum2, 'toAddressNum2');
  assert.ok(await attachment, 'attachment');
}

async function assertVerifiedResults(driver: Driver, publicAddress: string) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement('#signTypedDataV4Verify');

  const verifyResult = await driver.findElement('#signTypedDataV4Result');
  await driver.waitForSelector({
    css: '#signTypedDataV4VerifyResult',
    text: publicAddress,
  });
  const verifyRecoverAddress = await driver.findElement(
    '#signTypedDataV4VerifyResult',
  );

  assert.equal(
    await verifyResult.getText(),
    '0x089bfbf84d16c9b7a48c3d768e200e8b84e651bf4efb6c444ad2c89aa311859f1c4c637982939ec69fe8519214257d5bbb2e2ae0b8e9644a4008412863a2e0ae1b',
  );
  assert.equal(await verifyRecoverAddress.getText(), publicAddress);
}
