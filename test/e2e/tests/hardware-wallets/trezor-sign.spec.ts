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
  const TREZOR_ADDRESS = KNOWN_PUBLIC_KEY_ADDRESSES[0].address;

  it('sign typed v4', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withTrezorAccount()
          .withPermissionControllerConnectedToTestDapp({
            account: TREZOR_ADDRESS,
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
        await driver.clickElementAndWaitForWindowToClose({
          text: 'Confirm',
          tag: 'button',
        });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await driver.clickElement('#signTypedDataV4Verify');

        await driver.waitForSelector({
          css: '#signTypedDataV4VerifyResult',
          text: TREZOR_ADDRESS.toLocaleLowerCase(),
        });
      },
    );
  });
});
