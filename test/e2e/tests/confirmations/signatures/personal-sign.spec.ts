import { strict as assert } from 'assert';
import { Suite } from 'mocha';
const FixtureBuilder = require('../../../fixture-builder');
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

describe('Personal Sign', function (this: Suite) {
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
        await driver.clickElement('#personalSign');

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog
        );

        const origin = await driver.isElementPresent({
          text: DAPP_URL_WITHOUT_SCHEMA,
          tag: 'p',
        });
        const message = await driver.isElementPresent({
          text: 'Example `personal_sign` message',
          tag: 'p',
        });

        assert.ok(origin);
        assert.ok(message);

        await driver.clickElement('[data-testid="confirm-footer-button"]');

        await assertVerifiedPersonalMessage(driver, publicAddress);
      },
    );
  });
});

async function assertVerifiedPersonalMessage(driver: Driver, publicAddress: string) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement('#personalSignVerify');

  const verifySigUtil = await driver.findElement(
    '#personalSignVerifySigUtilResult',
  );
  const verifyECRecover = await driver.findElement(
    '#personalSignVerifyECRecoverResult',
  );

  assert.equal(await verifySigUtil.getText(), publicAddress);
  assert.equal(await verifyECRecover.getText(), publicAddress);
}
