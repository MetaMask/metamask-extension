import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import {
  withFixtures,
  defaultGanacheOptions,
  unlockWallet,
  openDapp,
  WINDOW_TITLES,
} from '../../helpers';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import { createBtcAccount } from '../../accounts/common';

describe('BTC Account - Dapp Connection', function (this: Suite) {
  it('cannot connect to dapps', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPreferencesControllerAndFeatureFlag({
            bitcoinSupportEnabled: true,
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        await createBtcAccount(driver);
        await openDapp(driver);
        await driver.clickElement('#connectButton');
        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const account2 = await driver.waitForSelector(
          '[data-testid="choose-account-list-1"]',
        );
        assert((await account2.getText()).includes('Bitcoin Ac...'));
        await account2.click();
        const nextButton = await driver.waitForSelector(
          '[data-testid="page-container-footer-next"]',
        );
        assert.equal(await nextButton.isEnabled(), false);
      },
    );
  });
});
