import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import {
  defaultGanacheOptions,
  openDapp,
  unlockWallet,
  WINDOW_TITLES,
  withFixtures,
} from '../../helpers';
import { KNOWN_PUBLIC_KEY_ADDRESSES } from '../../../stub/keyring-bridge';

describe('Trezor Hardware Signatures', function (this: Suite) {
  it('sign typed v4', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withTrezorAccount()
          .withPermissionControllerConnectedToTestDapp({
            account: KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
        dapp: true,
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);

        await openDapp(driver);
        await driver.clickElement('#signTypedDataV4');
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.clickElement('.confirm-scroll-to-bottom__button');
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await driver.clickElement('#signTypedDataV4Verify');

        const verifyRecoverAddress = await driver.findElement(
          '#signTypedDataV4VerifyResult',
        );

        assert.equal(
          await verifyRecoverAddress.getText(),
          KNOWN_PUBLIC_KEY_ADDRESSES[0].address.toLocaleLowerCase(),
        );
      },
    );
  });
});
