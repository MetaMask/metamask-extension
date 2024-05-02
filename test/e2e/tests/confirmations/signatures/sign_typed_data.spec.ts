import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import FixtureBuilder from '../../../fixture-builder';
import { Ganache } from '../../../seeder/ganache';
import {
  DAPP_URL_WITHOUT_SCHEMA,
  WINDOW_TITLES,
  defaultGanacheOptions,
  withFixtures,
  openDapp,
  unlockWallet,
} from '../../../helpers';
import { Driver } from '../../../webdriver/driver';

describe('Sign Typed Data', function (this: Suite) {
  it('initiates and confirms', async function () {
    if (!process.env.ENABLE_CONFIRMATION_REDESIGN) {
      return;
    }

    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
        .withNetworkControllerOnMainnet()
          .withPermissionControllerConnectedToTestDapp()
          .withPreferencesController({
            preferences: {
              redesignedConfirmations: true,
            },
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver, ganacheServer }: { driver: Driver, ganacheServer: Ganache }) => {
        const addresses = await ganacheServer.getAccounts();
        const publicAddress = addresses?.[0] as string;

        await unlockWallet(driver);
        await openDapp(driver);
        await driver.clickElement('#signTypedData');

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog
        );

        const origin = await driver.isElementPresent({
          text: DAPP_URL_WITHOUT_SCHEMA,
          tag: 'p',
        });
        const message = await driver.isElementPresent({
          text: 'Hi, Alice!',
          tag: 'p',
        });

        assert.ok(origin);
        assert.ok(message);

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
  const verifyRecoverAddress = await driver.findElement(
    '#signTypedDataVerifyResult',
  );

  assert.equal(await verifyResult.getText(), '0x32791e3c41d40dd5bbfb42e66cf80ca354b0869ae503ad61cd19ba68e11d4f0d2e42a5835b0bfd633596b6a7834ef7d36033633a2479dacfdb96bda360d51f451b');
  assert.equal(await verifyRecoverAddress.getText(), publicAddress);
}
