import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { withRedesignConfirmationFixtures } from '../helper-fixture';
import {
  DAPP_URL_WITHOUT_SCHEMA,
  WINDOW_TITLES,
  openDapp,
  unlockWallet,
} from '../../../helpers';
import { Ganache } from '../../../seeder/ganache';
import { Driver } from '../../../webdriver/driver';

describe('Confirmation Signature - Sign Typed Data', function (this: Suite) {
  if (!process.env.ENABLE_CONFIRMATION_REDESIGN) {
    return;
  }

  it('initiates and confirms', async function () {
    await withRedesignConfirmationFixtures(
      this.test?.fullTitle(),
      async ({ driver, ganacheServer }: { driver: Driver, ganacheServer: Ganache }) => {
        const addresses = await ganacheServer.getAccounts();
        const publicAddress = addresses?.[0] as string;

        await unlockWallet(driver);
        await openDapp(driver);
        await driver.clickElement('#signTypedData');

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog
        );

        const origin = driver.findElement({ text: DAPP_URL_WITHOUT_SCHEMA });
        const message = driver.findElement({ text: 'Hi, Alice!' });

        assert.ok(await origin);
        assert.ok(await message);

        await driver.clickElement('[data-testid="confirm-footer-button"]');

        await assertVerifiedResults(driver, publicAddress);
      },
    );
  });
});

async function assertVerifiedResults(driver: Driver, publicAddress: string) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement('#signTypedDataVerify');

  const verifyResult = await driver.findElement(
    '#signTypedDataResult',
  );
  await driver.waitForSelector({
    css: '#signTypedDataVerifyResult',
    text: publicAddress,
  });
  const verifyRecoverAddress = await driver.findElement(
    '#signTypedDataVerifyResult',
  );

  assert.equal(await verifyResult.getText(), '0x32791e3c41d40dd5bbfb42e66cf80ca354b0869ae503ad61cd19ba68e11d4f0d2e42a5835b0bfd633596b6a7834ef7d36033633a2479dacfdb96bda360d51f451b');
  assert.equal(await verifyRecoverAddress.getText(), publicAddress);
}
