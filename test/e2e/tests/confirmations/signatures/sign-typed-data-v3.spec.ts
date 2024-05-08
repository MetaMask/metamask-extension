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
import {
  assertHeaderInfoBalance,
  assertPastedAddress,
  clickHeaderInfoBtn,
  copyAddressAndPasteWalletAddress,
  assertSignatureMetrics as assertSignatureMetrics,
  assertAccountDetailsMetrics,
} from './signature-helpers';

describe('Confirmation Signature - Sign Typed Data V3', function (this: Suite) {
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
        await driver.clickElement('#signTypedDataV3');
        await switchToNotificationWindow(driver);

        await clickHeaderInfoBtn(driver);
        await assertHeaderInfoBalance(driver);

        await copyAddressAndPasteWalletAddress(driver);
        await assertPastedAddress(driver);
        await assertAccountDetailsMetrics(driver, mockedEndpoints,  'eth_signTypedData_v3');

        await assertSignatureDetails(driver);

        await driver.clickElement('[data-testid="confirm-footer-button"]');
        await assertSignatureMetrics(
          driver,
          mockedEndpoints,
          'eth_signTypedData_v3',
        );
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

  it('initiates and rejects and emits the correct metrics', async function () {
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
        await driver.clickElement('#signTypedDataV3');
        await switchToNotificationWindow(driver);
        await driver.clickElement(
          '[data-testid="confirm-footer-cancel-button"]',
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        const rejectionResult = await driver.findElement(
          '#signTypedDataV3Result',
        );
        await assertSignatureMetrics(
          driver,
          mockedEndpoints,
          'eth_signTypedData_v3',
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
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  const origin = driver.findElement({ text: DAPP_URL_WITHOUT_SCHEMA });
  const contractPetName = driver.findElement({
    css: '.name__value',
    text: '0xCcCCc...ccccC',
  });

  const primaryType = driver.findElement({ text: 'Mail' });
  const fromName = driver.findElement({ text: 'Cow' });
  const fromAddress = driver.findElement({
    css: '.name__value',
    text: '0xCD2a3...DD826',
  });
  const toName = driver.findElement({ text: 'Bob' });
  const toAddress = driver.findElement({
    css: '.name__value',
    text: '0xbBbBB...bBBbB',
  });
  const contents = driver.findElement({ text: 'Hello, Bob!' });

  assert.ok(await origin, 'origin');
  assert.ok(await contractPetName, 'contractPetName');
  assert.ok(await primaryType, 'primaryType');
  assert.ok(await fromName, 'fromName');
  assert.ok(await fromAddress, 'fromAddress');
  assert.ok(await toName, 'toName');
  assert.ok(await toAddress, 'toAddress');
  assert.ok(await contents, 'contents');
}

async function assertVerifiedResults(driver: Driver, publicAddress: string) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement('#signTypedDataV3Verify');

  const verifyResult = await driver.findElement('#signTypedDataV3Result');
  await driver.waitForSelector({
    css: '#signTypedDataV3VerifyResult',
    text: publicAddress,
  });
  const verifyRecoverAddress = await driver.findElement(
    '#signTypedDataV3VerifyResult',
  );

  assert.equal(
    await verifyResult.getText(),
    '0x232588587d1e29b4ecf33725505e58f4305ba1d3ad09c9edb655b580e68e6cda01630fbef3b415dbd08e839fc5deee2c6887902539b5032a7c2a8487f58873821c',
  );
  assert.equal(await verifyRecoverAddress.getText(), publicAddress);
}
