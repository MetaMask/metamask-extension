import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import FixtureBuilder from '../../../fixture-builder';
import {
  DAPP_URL_WITHOUT_SCHEMA,
  WINDOW_TITLES,
  defaultGanacheOptions,
  withFixtures,
  openDapp,
  unlockWallet,
} from '../../../helpers';
import { Ganache } from '../../../seeder/ganache';
import { Driver } from '../../../webdriver/driver';

describe('Personal Sign', function (this: Suite) {
  if (!process.env.ENABLE_CONFIRMATION_REDESIGN) {
    return;
  }

  it('initiates and confirms', async function () {
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

        const origin = driver.findElement({ text: DAPP_URL_WITHOUT_SCHEMA });
        const message = driver.findElement({ text: 'Example `personal_sign` message' });

        assert.ok(await origin);
        assert.ok(await message);

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
